import { getAuthenticatedUser } from '@/server/auth-user';
import { createSupabaseServerClient } from '@/server/supabase-server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ResumePatchPayload {
  title?: unknown;
  templateId?: unknown;
  data?: unknown;
}

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

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const { id } = await context.params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('resumes')
    .select('id,title,template_id,data,photo_path,created_at,updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
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
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const { id } = await context.params;
  const payload = (await request.json()) as ResumePatchPayload;
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

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('resumes')
    .update(changes)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id,title,template_id,data,created_at,updated_at')
    .single();

  if (error || !data) {
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
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const { id } = await context.params;
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('resumes').delete().eq('id', id).eq('user_id', user.id);

  if (error) {
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to delete resume');
  }

  return new Response(null, { status: 204 });
}
