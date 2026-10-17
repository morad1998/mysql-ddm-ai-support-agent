import { createServer } from 'node:http';
import type { ServerResponse } from 'node:http';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from './db.ts';

const PORT = 4000;
const PERSONA = 'svc_ai_agent';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
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
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }

  const path = new URL(req.url ?? '/', 'http://localhost').pathname;

  if (path === '/health') {
    sendJson(res, 200, { status: 'ok', persona: PERSONA });
    return;
  }

  const match = /^\/customers\/([^/]+)$/.exec(path);
  if (match) {
    let code: string;
    try {
      code = decodeURIComponent(match[1]);
    } catch {
      sendJson(res, 400, { error: 'bad_request' });
      return;
    }

    try {
      // The code is always bound as a parameter, never concatenated into SQL.
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT customer_id, full_name, email, mobile, national_id FROM customer WHERE customer_code = ?',
        [code],
      );
      if (rows.length === 0) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      sendJson(res, 200, rows[0]);
    } catch (err) {
      console.error('Customer lookup failed:', (err as { code?: string }).code ?? 'unknown');
      sendJson(res, 500, { error: 'internal_error' });
    }
    return;
  }

  sendJson(res, 404, { error: 'not_found' });
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
