import { isMainModule } from '@angular/ssr/node';
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import express from 'express';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { getContext } from '@netlify/angular-runtime/context.mjs';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularAppEngine();

/**
 * Content Security Policy middleware
 * Add CSP headers to all responses for enhanced security using nonces
 */
app.use((req, res, next) => {
  // Generate a unique nonce for each request
  const nonce = randomBytes(16).toString('base64');

  // Store nonce in res.locals so it can be accessed by Angular SSR
  res.locals['cspNonce'] = nonce;

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
// app.use((req, res, next) => {
//   angularApp
//     .handle(req as Request)
//     .then((response) =>
//       response ? writeResponseToNodeResponse(response, res) : next()
//     )
//     .catch(next);
// });

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export async function netlifyAppEngineHandler(
  request: Request
): Promise<Response> {
  const context = getContext();

  // Example API endpoints can be defined here.
  // Uncomment and define endpoints as necessary.
  // const pathname = new URL(request.url).pathname;
  // if (pathname === '/api/hello') {
  //   return Response.json({ message: 'Hello from the API' });
  // }

  const result = await angularApp.handle(request, context);
  return result || new Response('Not found', { status: 404 });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler);
