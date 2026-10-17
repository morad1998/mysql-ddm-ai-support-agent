import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import type { Pool } from 'mysql2/promise';
import { runAgent } from './agent.ts';
import { getPool } from './db.ts';
import { compareCustomer, matchCustomerRoute } from './routes.ts';

const PORT = 4000;
const PERSONA = 'svc_ai_agent';
const WEB_ROOT = resolve(import.meta.dirname, '..', '..', 'web');
const MAX_BODY_BYTES = 10 * 1024;
const CODE_PATTERN = /^[A-Za-z0-9-]{1,20}$/;
const MAX_QUESTION_LENGTH = 500;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((done, fail) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        fail(new Error('body_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => done(Buffer.concat(chunks).toString('utf8')));
    req.on('error', fail);
  });
}

// Serves files from web/, defaulting to index.html. Paths outside web/ are refused.
async function serveStatic(res: ServerResponse, path: string): Promise<void> {
  let file: string;
  try {
    file = resolve(WEB_ROOT, '.' + decodeURIComponent(path === '/' ? '/index.html' : path));
  } catch {
    sendJson(res, 400, { error: 'bad_request' });
    return;
  }
  const type = CONTENT_TYPES[extname(file)];
  if (!file.startsWith(WEB_ROOT + sep) || !type) {
    sendJson(res, 404, { error: 'not_found' });
    return;
  }
  try {
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': type });
    res.end(content);
  } catch {
    sendJson(res, 404, { error: 'not_found' });
  }
}

// POST /demo/ask { code, question } -> runs the tool-calling agent.
async function handleAsk(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let input: { code?: unknown; question?: unknown };
  try {
    input = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: 'bad_request' });
    return;
  }
  const { code, question } = input;
  if (typeof code !== 'string' || !CODE_PATTERN.test(code) ||
      typeof question !== 'string' || question.trim().length === 0 || question.length > MAX_QUESTION_LENGTH) {
    sendJson(res, 400, { error: 'bad_request' });
    return;
  }
  const trace = await runAgent(code, question.trim());
  sendJson(res, 200, {
    toolTrace: trace.steps,
    finalAnswer: trace.finalAnswer,
    modelCalls: trace.modelCalls,
    capHit: trace.capHit,
  });
}

// Fail fast if the password file is missing, before accepting any request.
let pool: Pool;
try {
  pool = getPool();
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;

  try {
    if (req.method === 'POST' && path === '/demo/ask') {
      await handleAsk(req, res);
      return;
    }

    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method_not_allowed' });
      return;
    }

    if (path === '/health') {
      sendJson(res, 200, { status: 'ok', persona: PERSONA });
      return;
    }

    const compare = /^\/demo\/compare\/([^/]+)$/.exec(path);
    if (compare) {
      const result = await compareCustomer(decodeURIComponent(compare[1]));
      sendJson(res, result.status, result.body);
      return;
    }

    if (path.startsWith('/customers/')) {
      const route = matchCustomerRoute(path);
      if (!route) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      const result = await route.handler(pool, route.code);
      sendJson(res, result.status, result.body);
      return;
    }

    await serveStatic(res, path);
  } catch (err) {
    if (err instanceof URIError) {
      sendJson(res, 400, { error: 'bad_request' });
      return;
    }
    console.error('Request failed:', (err as { code?: string }).code ?? (err as Error).name);
    if (!res.headersSent) sendJson(res, 500, { error: 'internal_error' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`ddm-ai-support-api listening on http://127.0.0.1:${PORT} as ${PERSONA}`);
});

function shutdown(): void {
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
