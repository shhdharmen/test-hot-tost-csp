import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import express from 'express';
import { join } from 'node:path';
import { getContext } from '@netlify/angular-runtime/context.mjs';
import { randomBytes } from 'node:crypto';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularAppEngine();
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
// if (isMainModule(import.meta.url)) {
//   const port = process.env['PORT'] || 4000;
//   app.listen(port, (error) => {
//     if (error) {
//       throw error;
//     }

//     console.log(`Node Express server listening on http://localhost:${port}`);
//   });
// }

/**
 * Generate a random nonce for CSP
 */
function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

export async function netlifyAppEngineHandler(
  request: Request
): Promise<Response> {
  const context = getContext();

  // Generate a unique nonce for this request
  const nonce = generateNonce();

  // Make nonce available globally for Angular's CSP_NONCE
  (globalThis as any).cspNonce = nonce;

  // Example API endpoints can be defined here.
  // Uncomment and define endpoints as necessary.
  // const pathname = new URL(request.url).pathname;
  // if (pathname === '/api/hello') {
  //   return Response.json({ message: 'Hello from the API' });
  // }

  // Create a new context with the nonce for potential use in components
  const enhancedContext = {
    ...context,
    'csp-nonce': nonce,
  };

  const result = await angularApp.handle(request, enhancedContext);

  if (result) {
    // Clone the response to modify headers
    const response = new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers: new Headers(result.headers),
    });

    // Set CSP header with nonce
    const cspPolicy = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`, // unsafe-inline needed for some Angular styles
      "font-src 'self' data:",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'block-all-mixed-content',
      'upgrade-insecure-requests',
    ].join('; ');

    response.headers.set('Content-Security-Policy', cspPolicy);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );

    return response;
  }

  return new Response('Not found', { status: 404 });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler);
