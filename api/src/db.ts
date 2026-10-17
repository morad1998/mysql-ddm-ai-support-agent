import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

// The API always connects as the AI agent persona, so every query returns
// whatever the masking policies show that persona.
const DB_USER = 'svc_ai_agent';

// Path to the password file. DDM_AI_AGENT_PWD_FILE overrides the default.
// The password itself never lives in code, config or logs.
const PASSWORD_FILE =
  process.env.DDM_AI_AGENT_PWD_FILE ??
  'D:\\morad\\mysql-enterprise-26.7.0\\secrets\\svc_ai_agent.pwd';

function readPassword(): string {
  let password: string;
  try {
    password = readFileSync(PASSWORD_FILE, 'utf8').trim();
  } catch {
    throw new Error(`Cannot read the ${DB_USER} password file at ${PASSWORD_FILE}`);
  }
  if (password.length === 0) {
    throw new Error(`The ${DB_USER} password file at ${PASSWORD_FILE} is empty`);
  }
  return password;
}

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: '127.0.0.1',
      port: 3308,
      user: DB_USER,
      password: readPassword(),
      database: 'support',
      connectionLimit: 5,
      // Return DATE/DATETIME as the stored strings, so JSON shows the exact
      // database values instead of timezone-shifted ISO timestamps.
      dateStrings: true,
    });
  }
  return pool;
}
