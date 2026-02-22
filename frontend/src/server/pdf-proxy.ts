import { createPDFServiceAuthHeaders } from '@/server/pdf-service-auth';

interface ProxyPDFInput {
  body: string;
  contentType: string;
}

const defaultPDFServiceURL = 'http://localhost:8080/api/v1/resumes/generate-pdf';
const defaultServiceID = 'nextjs-api';

export async function proxyPDFRequest(input: ProxyPDFInput): Promise<Response> {
  const serviceURL = process.env.GO_PDF_SERVICE_URL ?? defaultPDFServiceURL;
  const serviceSecret = process.env.GO_PDF_SERVICE_HMAC_SECRET;
  const serviceID = process.env.GO_PDF_SERVICE_ID ?? defaultServiceID;

  if (!serviceSecret || serviceSecret.trim() === '') {
    throw new Error('GO_PDF_SERVICE_HMAC_SECRET is required');
  }

  const targetURL = new URL(serviceURL);
  const serviceHeaders = await createPDFServiceAuthHeaders({
    method: 'POST',
    path: targetURL.pathname,
    body: input.body,
    serviceId: serviceID,
    secret: serviceSecret,
  });

  return fetch(serviceURL, {
    method: 'POST',
    headers: {
      'Content-Type': input.contentType,
      ...serviceHeaders,
    },
    body: input.body,
  });
}
