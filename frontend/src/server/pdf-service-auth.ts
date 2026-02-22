import { createHash, createHmac } from 'node:crypto';

export interface PDFServiceAuthInput {
  method: string;
  path: string;
  body: string;
  serviceId: string;
  secret: string;
  timestamp?: number;
  nonce?: string;
}

export async function createPDFServiceAuthHeaders(
  input: PDFServiceAuthInput,
): Promise<Record<string, string>> {
  const timestamp = input.timestamp ?? Math.floor(Date.now() / 1000);
  const nonce = input.nonce ?? crypto.randomUUID();
  const method = input.method.toUpperCase();
  const bodyHash = createHash('sha256').update(input.body).digest('hex');
  const canonical = `${timestamp}\n${method}\n${input.path}\n${bodyHash}`;
  const signature = createHmac('sha256', input.secret).update(canonical).digest('hex');

  return {
    'X-Service-Id': input.serviceId,
    'X-Service-Timestamp': String(timestamp),
    'X-Service-Nonce': nonce,
    'X-Service-Signature': `sha256=${signature}`,
  };
}
