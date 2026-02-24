import { getAuthenticatedRequestContext } from '@/server/auth-user';
import { jsonError } from '@/server/json-error';

const isDev = process.env.NODE_ENV === 'development';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ResumePatchPayload {
  title?: unknown;
  templateId?: unknown;
  data?: unknown;
}

function logDevError(operation: string, error: unknown): void {
  if (!isDev) {
    return;
  }
  console.error(`[api/v1/resumes/:id] ${operation} failed`, error);
}

function isRLSForbidden(error: { code?: string } | null | undefined): boolean {
  return error?.code === '42501';
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const authContext = await getAuthenticatedRequestContext(request);
  if (!authContext) {
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const { user, supabase } = authContext;

  const { id } = await context.params;
  const { data, error } = await supabase
    .from('resumes')
    .select('id,title,template_id,data,photo_path,created_at,updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    if (error) {
      logDevError('get resume', {
        id,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    }
    if (isRLSForbidden(error)) {
      return jsonError(403, 'FORBIDDEN', 'You do not have access to this resource');
    }
    return jsonError(404, 'NOT_FOUND', 'Resume not found');
  }

  return Response.json(
    {
      id: data.id,
      title: data.title,
      templateId: data.template_id,
      data: data.data,
      photoPath: data.photo_path,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    { status: 200 },
  );
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  const authContext = await getAuthenticatedRequestContext(request);
  if (!authContext) {
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const { user, supabase } = authContext;

  const { id } = await context.params;
  let payload: ResumePatchPayload;
  try {
    payload = (await request.json()) as ResumePatchPayload;
  } catch (error) {
    logDevError('parse patch payload', { id, error });
    return jsonError(400, 'VALIDATION_ERROR', 'Request body must be valid JSON');
  }
  const changes: Record<string, unknown> = {};

  if (typeof payload.title === 'string' && payload.title.trim() !== '') {
    changes.title = payload.title.trim();
  }
  if (typeof payload.templateId === 'string' && payload.templateId.trim() !== '') {
    changes.template_id = payload.templateId.trim();
  }
  if (payload.data && typeof payload.data === 'object') {
    changes.data = payload.data;
  }

  if (Object.keys(changes).length === 0) {
    return jsonError(400, 'VALIDATION_ERROR', 'At least one mutable field must be provided');
  }

  changes.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('resumes')
    .update(changes)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id,title,template_id,data,created_at,updated_at')
    .single();

  if (error || !data) {
    if (error) {
      logDevError('patch resume', {
        id,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    }
    if (isRLSForbidden(error)) {
      return jsonError(403, 'FORBIDDEN', 'You do not have access to this resource');
    }
    return jsonError(404, 'NOT_FOUND', 'Resume not found');
  }

  return Response.json(
    {
      id: data.id,
      title: data.title,
      templateId: data.template_id,
      data: data.data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    { status: 200 },
  );
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  const authContext = await getAuthenticatedRequestContext(request);
  if (!authContext) {
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const { user, supabase } = authContext;

  const { id } = await context.params;
  const { error } = await supabase.from('resumes').delete().eq('id', id).eq('user_id', user.id);

  if (error) {
    logDevError('delete resume', {
      id,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    if (isRLSForbidden(error)) {
      return jsonError(403, 'FORBIDDEN', 'You do not have access to this resource');
    }
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to delete resume');
  }

  return new Response(null, { status: 204 });
}
