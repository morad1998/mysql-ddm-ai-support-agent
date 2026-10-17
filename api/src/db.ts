import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';
import type { Connection, Pool } from 'mysql2/promise';

const SECRETS_DIR = 'D:\\morad\\mysql-enterprise-26.7.0\\secrets';

const CONNECTION = {
  host: '127.0.0.1',
  port: 3308,
  database: 'support',
  // Return DATE/DATETIME as the stored strings, so JSON shows the exact
  // database values instead of timezone-shifted ISO timestamps.
  dateStrings: true,
};

// The API always connects as the AI agent persona, so every query returns
// whatever the masking policies show that persona.
const DB_USER = 'svc_ai_agent';

// Path to the password file. DDM_AI_AGENT_PWD_FILE overrides the default.
// Passwords never live in code, config or logs.
const PASSWORD_FILE = process.env.DDM_AI_AGENT_PWD_FILE ?? `${SECRETS_DIR}\\svc_ai_agent.pwd`;

function readPassword(user: string, file: string): string {
  let password: string;
  try {
    password = readFileSync(file, 'utf8').trim();
  } catch {
    throw new Error(`Cannot read the ${user} password file at ${file}`);
  }
  if (password.length === 0) {
    throw new Error(`The ${user} password file at ${file} is empty`);
  }
  return password;
}

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      ...CONNECTION,
      user: DB_USER,
      password: readPassword(DB_USER, PASSWORD_FILE),
      connectionLimit: 5,
    });
  }
  return pool;
}

// Opens one short-lived connection as the given persona, runs fn, and closes it.
// Used only by the demo comparison endpoint (see routes.ts).
export async function withPersonaConnection<T>(user: string, fn: (conn: Connection) => Promise<T>): Promise<T> {
  const conn = await mysql.createConnection({
    ...CONNECTION,
    user,
    password: readPassword(user, `${SECRETS_DIR}\\${user}.pwd`),
  });
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}
