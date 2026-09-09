type Statement = {
  readonly bind: (...values: readonly string[]) => Statement;
  readonly first: () => Promise<unknown>;
};
type VisitorDatabase = {
  readonly prepare: (sql: string) => Statement;
  readonly batch: (statements: readonly Statement[]) => Promise<readonly { readonly results: readonly unknown[] }[]>;
};
type Context = {
  readonly request: Request;
  readonly env: { readonly VISITOR_DB?: VisitorDatabase; readonly VISITOR_COUNTER_ENABLED?: string };
};
type Count = { readonly count: number; readonly since: string };
const totalQuery = 'SELECT count, since FROM visitor_totals WHERE id = 1';
const sessionPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } as const;

function parseCount(value: unknown): Count | null {
  if (typeof value !== 'object' || value === null || !('count' in value) || !('since' in value)) return null;
  if (typeof value.count !== 'number' || !Number.isSafeInteger(value.count) || value.count < 0) return null;
  if (typeof value.since !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.since)) return null;
  return { count: value.count, since: value.since };
}

function failure(status: number, error: string): Response {
  return Response.json({ error }, { status, headers });
}

async function readSession(request: Request): Promise<string | Response> {
  if (request.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') return failure(415, 'content_type');
  if (Number(request.headers.get('Content-Length')) > 256) return failure(413, 'body_too_large');
  if (!request.body) return failure(400, 'invalid_session');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > 256) { await reader.cancel(); return failure(413, 'body_too_large'); }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof value !== 'object' || value === null || !('sessionId' in value) || Object.keys(value).length !== 1) return failure(400, 'invalid_session');
    return typeof value.sessionId === 'string' && sessionPattern.test(value.sessionId)
      ? value.sessionId : failure(400, 'invalid_session');
  } catch (error) {
    if (error instanceof SyntaxError) return failure(400, 'invalid_json');
    throw error;
  }
}

export async function onRequest({ request, env }: Context): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET, POST' } });
  }
  if (env.VISITOR_COUNTER_ENABLED !== 'true') return new Response(null, { status: 204, headers });
  if (!env.VISITOR_DB) return failure(503, 'unavailable');
  if (request.method === 'POST' && request.headers.get('Origin') !== new URL(request.url).origin) return failure(403, 'origin');
  try {
    if (request.method === 'GET') {
      const count = parseCount(await env.VISITOR_DB.prepare(totalQuery).first());
      return count ? Response.json(count, { headers }) : failure(503, 'unavailable');
    }
    const sessionId = await readSession(request);
    if (sessionId instanceof Response) return sessionId;
    const results = await env.VISITOR_DB.batch([
      env.VISITOR_DB.prepare('INSERT INTO visitor_sessions (session_id) VALUES (?) ON CONFLICT(session_id) DO NOTHING').bind(sessionId),
      env.VISITOR_DB.prepare(totalQuery),
    ]);
    const count = parseCount(results[1]?.results[0]);
    return count ? Response.json(count, { headers }) : failure(503, 'unavailable');
  } catch (error) {
    console.error('Visitor counter unavailable:', error instanceof Error ? error.name : 'UnknownError');
    return failure(503, 'unavailable');
  }
}
