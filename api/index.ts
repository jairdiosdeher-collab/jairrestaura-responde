import type { IncomingMessage, ServerResponse } from 'http';
import type { Request, Response } from 'express';
import { createApiApp } from '../server/apiApp.ts';

const app = createApiApp();

interface VercelIncomingRequest extends IncomingMessage {
  body?: unknown;
  _body?: boolean;
}

export default function handler(req: VercelIncomingRequest, res: ServerResponse) {
  // Restore original /api/... path when Vercel rewrites /api/(.*) -> /api/index?__path=$1
  const rawUrl = req.url || '/api';
  const parsedUrl = new URL(rawUrl, 'http://localhost');
  const forwardedPath = parsedUrl.searchParams.get('__path');

  if (forwardedPath !== null) {
    parsedUrl.searchParams.delete('__path');
    const qs = parsedUrl.searchParams.toString();
    const cleanSubPath = forwardedPath.replace(/^\/+/, '');
    req.url = cleanSubPath ? `/api/${cleanSubPath}${qs ? `?${qs}` : ''}` : `/api${qs ? `?${qs}` : ''}`;
  }

  // If Vercel runtime already parsed req.body before invoking the handler,
  // prevent express.json() from hanging or re-reading an already-consumed stream.
  if (req.body !== undefined) {
    if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        // Leave string body intact if not valid JSON
      }
    }
    req._body = true;
  }

  return app(req as unknown as Request, res as unknown as Response);
}
