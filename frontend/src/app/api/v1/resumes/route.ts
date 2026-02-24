import { getAuthenticatedRequestContext } from '@/server/auth-user';
import { jsonError } from '@/server/json-error';

const isDev = process.env.NODE_ENV === 'development';

interface ResumePayload {
  title?: unknown;
  templateId?: unknown;
  data?: unknown;
}

interface ResumeRow {
  id: string;
  title: string;
  template_id: string;
  data: unknown;
  created_at: string;
  updated_at: string;
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

function mapResumeRecord(row: ResumeRow) {
  return {
    id: row.id,
    title: row.title,
    templateId: row.template_id,
    data: row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function logDevError(operation: string, error: unknown): void {
  if (!isDev) {
    return;
  }
  console.error(`[api/v1/resumes] ${operation} failed`, error);
}

function isRLSForbidden(error: { code?: string } | null | undefined): boolean {
  return error?.code === '42501';
}

export async function GET(request: Request): Promise<Response> {
  const authContext = await getAuthenticatedRequestContext(request);
  if (!authContext) {
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const { user, supabase } = authContext;

  const { data, error } = await supabase
    .from('resumes')
    .select('id,title,template_id,created_at,updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    logDevError('list resumes', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    if (isRLSForbidden(error)) {
      return jsonError(403, 'FORBIDDEN', 'You do not have access to this resource');
    }
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
  const authContext = await getAuthenticatedRequestContext(request);
  if (!authContext) {
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const { user, supabase } = authContext;

  let payload: ResumePayload;
  try {
    payload = (await request.json()) as ResumePayload;
  } catch (error) {
    logDevError('parse create resume payload', error);
    return jsonError(400, 'VALIDATION_ERROR', 'Request body must be valid JSON');
  }

  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const templateID = typeof payload.templateId === 'string' ? payload.templateId.trim() : '';
  const resumeData = payload.data;

  if (!title || !templateID || !resumeData || typeof resumeData !== 'object') {
    return jsonError(400, 'VALIDATION_ERROR', 'title, templateId, and data are required');
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (existingError) {
    logDevError('resolve existing resume', {
      code: existingError.code,
      message: existingError.message,
      details: existingError.details,
      hint: existingError.hint,
    });
    if (isRLSForbidden(existingError)) {
      return jsonError(403, 'FORBIDDEN', 'You do not have access to this resource');
    }
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to create resume');
  }

  const existingResumeID = existingRows?.[0]?.id;

  if (existingResumeID) {
    const { data, error } = await supabase
      .from('resumes')
      .update({
        title,
        template_id: templateID,
        data: resumeData,
      })
      .eq('id', existingResumeID)
      .eq('user_id', user.id)
      .select('id,title,template_id,data,created_at,updated_at')
      .single();

    if (error || !data) {
      if (error) {
        logDevError('update existing resume', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
      } else {
        logDevError('update existing resume', { message: 'Supabase returned empty data after update' });
      }
      if (isRLSForbidden(error)) {
        return jsonError(403, 'FORBIDDEN', 'You do not have access to this resource');
      }
      return jsonError(500, 'INTERNAL_ERROR', 'Failed to create resume');
    }

    return Response.json(mapResumeRecord(data as ResumeRow), { status: 200 });
  }

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
    if (error) {
      logDevError('create resume', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    } else {
      logDevError('create resume', { message: 'Supabase returned empty data after insert' });
    }
    if (isRLSForbidden(error)) {
      return jsonError(403, 'FORBIDDEN', 'You do not have access to this resource');
    }
    return jsonError(500, 'INTERNAL_ERROR', 'Failed to create resume');
  }

  return Response.json(mapResumeRecord(data as ResumeRow), { status: 201 });
}
