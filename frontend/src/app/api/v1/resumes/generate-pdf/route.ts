import { proxyPDFRequest } from '@/server/pdf-proxy';

function jsonError(status: number, code: string, message: string): Response {
  return Response.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonError(400, 'BAD_REQUEST', 'Content-Type must be application/json');
  }

  const body = await request.text();

  try {
    const upstream = await proxyPDFRequest({
      body,
      contentType,
    });

    const responseHeaders = new Headers();
    const upstreamContentType = upstream.headers.get('Content-Type');
    const upstreamDisposition = upstream.headers.get('Content-Disposition');

    if (upstreamContentType) {
      responseHeaders.set('Content-Type', upstreamContentType);
    }
    if (upstreamDisposition) {
      responseHeaders.set('Content-Disposition', upstreamDisposition);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return jsonError(502, 'BAD_GATEWAY', 'Failed to reach PDF service');
  }
}
