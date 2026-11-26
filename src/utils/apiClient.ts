export type ApiErrorKind =
  | 'connection'
  | 'configuration'
  | 'rate_limit'
  | 'gemini'
  | 'invalid_response'
  | 'server';

export class ApiClientError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;

  constructor(
    message: string,
    kind: ApiErrorKind,
    options?: { status?: number; code?: string }
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.kind = kind;
    this.status = options?.status;
    this.code = options?.code;
  }
}

export async function postApiJson<TResponse>(
  url: string,
  payload: unknown
): Promise<TResponse> {
  let res: globalThis.Response;

  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiClientError(
      'No fue posible conectar con el servidor de JAIRRESTAURA. Verifica tu conexión a internet o intenta de nuevo en unos segundos.',
      'connection'
    );
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const rawText = await res.text();
  const trimmed = rawText.trim();

  let parsed: Record<string, unknown> | null = null;
  const looksLikeJson =
    contentType.includes('application/json') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[');

  if (looksLikeJson && trimmed.length > 0) {
    try {
      parsed = JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    if (res.status === 404 || contentType.includes('text/html') || contentType.includes('text/plain')) {
      throw new ApiClientError(
        `El backend (${url}) devolvió una respuesta no JSON (HTTP ${res.status}). Si estás en producción, verifica que las funciones API (/api/*) estén activas en el despliegue.`,
        'invalid_response',
        { status: res.status }
      );
    }

    throw new ApiClientError(
      `El servidor devolvió una respuesta inesperada (HTTP ${res.status}). Tu mensaje se conservó; intenta de nuevo en unos momentos.`,
      'invalid_response',
      { status: res.status }
    );
  }

  if (!res.ok) {
    const serverMessage =
      typeof parsed.error === 'string' && parsed.error.trim().length > 0
        ? parsed.error
        : `El servidor respondió con error (HTTP ${res.status}).`;
    const serverCode = typeof parsed.code === 'string' ? parsed.code : undefined;

    if (
      serverCode === 'MISSING_API_KEY' ||
      serverCode === 'GEMINI_AUTH_ERROR' ||
      res.status === 503 ||
      res.status === 401 ||
      res.status === 403
    ) {
      throw new ApiClientError(serverMessage, 'configuration', {
        status: res.status,
        code: serverCode,
      });
    }

    if (serverCode === 'GEMINI_RATE_LIMIT' || res.status === 429) {
      throw new ApiClientError(serverMessage, 'rate_limit', {
        status: res.status,
        code: serverCode,
      });
    }

    if (serverCode === 'GEMINI_RESPONSE_ERROR' || res.status === 502) {
      throw new ApiClientError(serverMessage, 'gemini', {
        status: res.status,
        code: serverCode,
      });
    }

    throw new ApiClientError(serverMessage, 'server', {
      status: res.status,
      code: serverCode,
    });
  }

  return parsed as TResponse;
}
