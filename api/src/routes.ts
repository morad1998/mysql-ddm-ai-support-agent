import type { Connection, Pool, RowDataPacket } from 'mysql2/promise';
import { withPersonaConnection } from './db.ts';

// Every route returns { status, body }. The server turns that into JSON.
export interface RouteResult {
  status: number;
  body: unknown;
}

type Handler = (pool: Pool, code: string) => Promise<RouteResult>;

const NOT_FOUND: RouteResult = { status: 404, body: { error: 'not_found' } };

// All queries bind the customer code as a parameter; nothing is concatenated into SQL.
async function findCustomerId(pool: Pool, code: string): Promise<number | undefined> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT customer_id FROM customer WHERE customer_code = ?',
    [code],
  );
  return rows[0]?.customer_id as number | undefined;
}

const CUSTOMER_SQL =
  'SELECT customer_id, full_name, email, mobile, national_id FROM customer WHERE customer_code = ?';

async function getCustomer(pool: Pool, code: string): Promise<RouteResult> {
  const [rows] = await pool.query<RowDataPacket[]>(CUSTOMER_SQL, [code]);
  return rows.length === 0 ? NOT_FOUND : { status: 200, body: rows[0] };
}

// GET /demo/compare/:code
//
// This endpoint exists only to power the side-by-side demo UI. It is not a pattern
// for production use — a real application would never let one endpoint silently
// hold two different privilege levels.
//
// It runs the same customer query twice, on two separate short-lived connections:
// once as svc_ai_agent (masked) and once as svc_supervisor (exempt, real values).
export async function compareCustomer(code: string): Promise<RouteResult> {
  const lookup = async (conn: Connection) => {
    const [rows] = await conn.query<RowDataPacket[]>(CUSTOMER_SQL, [code]);
    return rows[0];
  };
  const masked = await withPersonaConnection('svc_ai_agent', lookup);
  if (!masked) return NOT_FOUND;
  const real = await withPersonaConnection('svc_supervisor', lookup);
  return { status: 200, body: { masked, real } };
}

async function getWarranty(pool: Pool, code: string): Promise<RouteResult> {
  if ((await findCustomerId(pool, code)) === undefined) return NOT_FOUND;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.serial_no, p.model_no, w.type, w.start_date, w.end_date, w.status
       FROM customer c
       JOIN product_unit p ON p.customer_id = c.customer_id
       JOIN warranty w ON w.unit_id = p.unit_id
      WHERE c.customer_code = ?
      ORDER BY p.unit_id, w.warranty_id`,
    [code],
  );
  return { status: 200, body: rows };
}

async function getOrders(pool: Pool, code: string): Promise<RouteResult> {
  const customerId = await findCustomerId(pool, code);
  if (customerId === undefined) return NOT_FOUND;

  const [orders] = await pool.query<RowDataPacket[]>(
    `SELECT order_id, order_date, total_amount, status
       FROM sales_order
      WHERE customer_id = ?
      ORDER BY order_id`,
    [customerId],
  );
  if (orders.length === 0) return { status: 200, body: [] };

  // One payment query for all of this customer's orders, grouped below.
  const [payments] = await pool.query<RowDataPacket[]>(
    `SELECT payment_id, order_id, card_pan, iban, amount, paid_at
       FROM payment
      WHERE order_id IN (?)
      ORDER BY payment_id`,
    [orders.map((o) => o.order_id)],
  );

  const body = orders.map((o) => ({
    order_id: o.order_id,
    order_date: o.order_date,
    total_amount: o.total_amount,
    status: o.status,
    payments: payments
      .filter((p) => p.order_id === o.order_id)
      .map((p) => ({
        payment_id: p.payment_id,
        card_pan: p.card_pan,
        iban: p.iban,
        amount: p.amount,
        paid_at: p.paid_at,
      })),
  }));
  return { status: 200, body };
}

async function getTickets(pool: Pool, code: string): Promise<RouteResult> {
  const customerId = await findCustomerId(pool, code);
  if (customerId === undefined) return NOT_FOUND;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ticket_id, channel, status, problem_text
       FROM service_ticket
      WHERE customer_id = ?
      ORDER BY ticket_id`,
    [customerId],
  );
  return { status: 200, body: rows };
}

// Customer routes: /customers/:code and /customers/:code/<sub>
const customerRoutes: Record<string, Handler> = {
  '': getCustomer,
  warranty: getWarranty,
  orders: getOrders,
  tickets: getTickets,
};

const CUSTOMER_PATH = /^\/customers\/([^/]+)(?:\/([a-z]+))?$/;

// Returns the handler and decoded code for a path, or undefined if no route matches.
// Throws URIError if the code is not valid percent-encoding.
export function matchCustomerRoute(path: string): { handler: Handler; code: string } | undefined {
  const match = CUSTOMER_PATH.exec(path);
  if (!match) return undefined;
  const handler = customerRoutes[match[2] ?? ''];
  if (!handler) return undefined;
  return { handler, code: decodeURIComponent(match[1]) };
}
