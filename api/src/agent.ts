// Tool-calling support agent: Cohere Command A (OCI Generative AI) decides which
// support API endpoints to call. Every tool calls our own API, which reads MySQL
// as svc_ai_agent, so the model only ever sees masked data.
//
// The model is called through the OCI CLI with the personal profile, using the
// COHERE chat format: tools[].parameterDefinitions, toolResults[] and chatHistory
// roles USER / CHATBOT / TOOL (from `--generate-param-json-input chat-request`).

import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

const API_BASE = process.env.DDM_API_BASE ?? 'http://127.0.0.1:4000';
const OCI_CONFIG = process.env.DDM_OCI_CONFIG ?? join(homedir(), '.oci-personal', 'config');
const OCI_PROFILE = 'PERSONAL';
const OCI_REGION = 'me-riyadh-1';
const COMPARTMENT_NAME = 'mysql-jdv-quality-inspection';
const MODEL_ID = 'cohere.command-a-03-2025';
const MAX_TOOL_CALLS = 6;

const PREAMBLE =
  'You are a support assistant for an air-conditioning manufacturer. You only know what is in the JSON data provided in this message. ' +
  'Some fields are intentionally masked (shown as stars, X\'s, or [hidden]) because you are not authorized to see their real values — ' +
  'this is enforced by the database itself, not by these instructions. Never guess, invent, or ask for the real values of masked fields. ' +
  'Base your entire answer only on the fields and values actually present in the JSON.';

// Default used by the CLI run, so earlier evidence runs stay reproducible.
const DEFAULT_CODE = 'CUST-0002';
const DEFAULT_QUESTION = 'about a cooling problem and a billing concern';

function initialMessage(code: string, question?: string): string {
  if (question === undefined) {
    return `A customer with code ${code} contacted support ${DEFAULT_QUESTION}. Investigate and draft a reply.`;
  }
  return `A customer with code ${code} contacted support. Their question: "${question}" Investigate using the tools and draft a reply.`;
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

interface ToolDefinition {
  name: string;
  description: string;
  parameterDefinitions: Record<string, { description: string; type: string; isRequired: boolean }>;
}

const codeParam = {
  code: { description: 'Customer code, for example CUST-0001', type: 'str', isRequired: true },
};

const TOOLS: ToolDefinition[] = [
  { name: 'find_customer', description: 'Look up a customer\'s profile (name, contact details, ID) by customer code.', parameterDefinitions: codeParam },
  { name: 'get_warranty', description: 'List the customer\'s product units with their warranty type, dates and status.', parameterDefinitions: codeParam },
  { name: 'get_orders', description: 'List the customer\'s orders, each with its payments (card, IBAN, amount, time).', parameterDefinitions: codeParam },
  { name: 'get_tickets', description: 'List the customer\'s support tickets with channel, status and problem text.', parameterDefinitions: codeParam },
];

const TOOL_PATHS: Record<string, string> = {
  find_customer: '',
  get_warranty: '/warranty',
  get_orders: '/orders',
  get_tickets: '/tickets',
};

// Runs one tool by calling the support API. Returns the outputs array the
// COHERE format expects: a list of JSON objects.
async function runTool(name: string, params: Record<string, unknown>): Promise<Record<string, unknown>[]> {
  const suffix = TOOL_PATHS[name];
  if (suffix === undefined) return [{ error: `unknown_tool: ${name}` }];
  const code = typeof params.code === 'string' ? params.code : '';
  const res = await fetch(`${API_BASE}/customers/${encodeURIComponent(code)}${suffix}`);
  const body: unknown = await res.json();
  if (Array.isArray(body)) return body.length > 0 ? (body as Record<string, unknown>[]) : [{ result: 'no rows' }];
  return [body as Record<string, unknown>];
}

// ---------------------------------------------------------------------------
// OCI Generative AI call
// ---------------------------------------------------------------------------

interface ToolCall {
  name: string;
  parameters: Record<string, unknown>;
}

interface ChatTurn {
  text: string;
  toolCalls: ToolCall[];
  finishReason?: string;
}

function readTenancy(): string {
  const line = readFileSync(OCI_CONFIG, 'utf8').split(/\r?\n/).find((l) => /^\s*tenancy\s*=/.test(l));
  if (!line) throw new Error(`No tenancy in ${OCI_CONFIG}`);
  return line.split('=', 2)[1].trim();
}

async function oci(args: string[]): Promise<unknown> {
  const { stdout } = await run('oci', [...args, '--config-file', OCI_CONFIG, '--profile', OCI_PROFILE, '--output', 'json'], {
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true,
  });
  return JSON.parse(stdout);
}

// Looks the compartment up by name, so no OCID is stored in the repository.
async function findCompartmentId(): Promise<string> {
  const result = (await oci([
    'iam', 'compartment', 'list', '--compartment-id', readTenancy(),
    '--compartment-id-in-subtree', 'true', '--all', '--name', COMPARTMENT_NAME,
  ])) as { data: { id: string }[] };
  const id = result.data[0]?.id;
  if (!id) throw new Error(`Compartment ${COMPARTMENT_NAME} not found`);
  return id;
}

// The CLI prints response keys in kebab-case; accept camelCase too.
function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) if (obj[k] !== undefined) return obj[k];
  return undefined;
}

async function chat(workDir: string, compartmentId: string, request: object): Promise<ChatTurn> {
  const requestFile = join(workDir, 'chat-request.json');
  const servingFile = join(workDir, 'serving-mode.json');
  writeFileSync(requestFile, JSON.stringify(request), 'utf8');
  writeFileSync(servingFile, JSON.stringify({ modelId: MODEL_ID, servingType: 'ON_DEMAND' }), 'utf8');

  const result = (await oci([
    'generative-ai-inference', 'chat-result', 'chat', '--region', OCI_REGION, '--compartment-id', compartmentId,
    '--chat-request', `file://${requestFile}`, '--serving-mode', `file://${servingFile}`,
  ])) as { data: Record<string, unknown> };

  const response = pick(result.data, 'chat-response', 'chatResponse') as Record<string, unknown>;
  const rawCalls = (pick(response, 'tool-calls', 'toolCalls') ?? []) as Record<string, unknown>[];
  return {
    text: (pick(response, 'text') as string | undefined) ?? '',
    toolCalls: rawCalls.map((c) => ({ name: c.name as string, parameters: (c.parameters ?? {}) as Record<string, unknown> })),
    finishReason: pick(response, 'finish-reason', 'finishReason') as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// Tool-call loop
// ---------------------------------------------------------------------------

export interface TraceStep {
  round: number;
  tool: string;
  parameters: Record<string, unknown>;
  outputs: Record<string, unknown>[];
}

export interface AgentTrace {
  model: string;
  region: string;
  initialMessage: string;
  steps: TraceStep[];
  modelCalls: number;
  capHit: boolean;
  finalAnswer: string;
}

// Runs the tool-call loop for one customer. Without a question it uses the
// default CLI message from the S5 evidence runs.
export async function runAgent(code: string = DEFAULT_CODE, question?: string): Promise<AgentTrace> {
  const message = initialMessage(code, question);
  const workDir = mkdtempSync(join(tmpdir(), 'ddm-agent-'));
  const trace: AgentTrace = {
    model: MODEL_ID, region: OCI_REGION, initialMessage: message,
    steps: [], modelCalls: 0, capHit: false, finalAnswer: '',
  };

  try {
    const compartmentId = await findCompartmentId();
    const base = {
      apiFormat: 'COHERE', preambleOverride: PREAMBLE, tools: TOOLS,
      isForceSingleStep: false, isStream: false, maxTokens: 600, temperature: 0.2,
    };

    const history: object[] = [{ role: 'USER', message }];
    let turn = await chat(workDir, compartmentId, { ...base, message, chatHistory: [] });
    trace.modelCalls++;

    for (let round = 1; turn.toolCalls.length > 0; round++) {
      if (trace.steps.length + turn.toolCalls.length > MAX_TOOL_CALLS) {
        trace.capHit = true;
        break;
      }

      const toolResults = [];
      for (const call of turn.toolCalls) {
        const outputs = await runTool(call.name, call.parameters);
        trace.steps.push({ round, tool: call.name, parameters: call.parameters, outputs });
        toolResults.push({ call, outputs });
      }

      // Cohere multi-step: the previous turn and its tool calls go into the
      // history, and this round's results go in toolResults.
      history.push({ role: 'CHATBOT', message: turn.text, toolCalls: turn.toolCalls });
      turn = await chat(workDir, compartmentId, { ...base, message: '', chatHistory: history, toolResults });
      trace.modelCalls++;
      history.push({ role: 'TOOL', toolResults });
    }

    trace.finalAnswer = turn.text;
    return trace;
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

// Run directly: print the trace as JSON on stdout.
if (import.meta.main) {
  runAgent()
    .then((trace) => console.log(JSON.stringify(trace, null, 2)))
    .catch((err: Error & { stderr?: string }) => {
      console.error('Agent failed:', err.message);
      if (err.stderr) console.error(err.stderr.split(/\r?\n/).slice(0, 15).join('\n'));
      process.exit(1);
    });
}
