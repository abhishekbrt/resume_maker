import { getAuthenticatedUser } from '@/server/auth-user';
import { jsonError } from '@/server/json-error';
import { createSupabaseServerClient } from '@/server/supabase-server';

interface ResumePayload {
  title?: unknown;
  templateId?: unknown;
  data?: unknown;
}

function mapResumeMetadata(row: {
  id: string;
  title: string;
  template_id: string;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    title: row.title,
    templateId: row.template_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request): Promise<Response> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('resumes')
    .select('id,title,template_id,created_at,updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to list resumes');
  }

  return Response.json(
    {
      resumes: (data ?? []).map(mapResumeMetadata),
    },
    { status: 200 },
  );
}

export async function POST(request: Request): Promise<Response> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const payload = (await request.json()) as ResumePayload;
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const templateID = typeof payload.templateId === 'string' ? payload.templateId.trim() : '';
  const resumeData = payload.data;

  if (!title || !templateID || !resumeData || typeof resumeData !== 'object') {
    return jsonError(400, 'VALIDATION_ERROR', 'title, templateId, and data are required');
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      title,
      template_id: templateID,
      data: resumeData,
    })
    .select('id,title,template_id,data,created_at,updated_at')
    .single();

  if (error || !data) {
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to create resume');
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
    { status: 201 },
  );
}
