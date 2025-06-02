import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { getContext } from '@netlify/angular-runtime/context.mjs';
import { randomBytes } from 'node:crypto';

const angularApp = new AngularAppEngine();

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
  console.log('Generated CSP nonce:', nonce);

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
    // Create new headers including CSP with nonce
    const headers = new Headers(result.headers);

    // Set CSP header with nonce
    const cspPolicy = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      `style-src 'self' 'nonce-${nonce}'`,
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

    console.log('Setting CSP policy:', cspPolicy);

    headers.set('Content-Security-Policy', cspPolicy);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );

    // Get the response body and inject nonce into app-root
    let body = await result.text();

    // Inject ngCspNonce attribute into app-root element (handles any existing attributes)
    body = body.replace(
      /<app-root([^>]*?)(\s*\/?>)/,
      `<app-root$1 ngCspNonce="${nonce}"$2`
    );

    // Inject nonce into any script tags (handles any existing attributes)
    body = body.replace(/<script([^>]*?)>/g, `<script$1 nonce="${nonce}">`);

    // Inject a script to handle dynamically created scripts at runtime
    const nonceScript = `
    <script nonce="${nonce}">
      (function() {
        const nonce = '${nonce}';
        console.log('Runtime nonce handler loaded with nonce:', nonce);
        
        // Override createElement to automatically add nonce to script elements
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
          const element = originalCreateElement.call(this, tagName);
          if (tagName.toLowerCase() === 'script' && nonce) {
            element.setAttribute('nonce', nonce);
            console.log('Added nonce to dynamically created script:', nonce);
          }
          return element;
        };
        
        // Also watch for any script elements added via innerHTML or other methods
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1) { // Element node
                if (node.tagName === 'SCRIPT' && !node.getAttribute('nonce') && nonce) {
                  node.setAttribute('nonce', nonce);
                  console.log('Added nonce to observed script element:', nonce);
                }
                // Check child script elements too
                const scriptTags = node.querySelectorAll && node.querySelectorAll('script');
                if (scriptTags) {
                  scriptTags.forEach(function(script) {
                    if (!script.getAttribute('nonce') && nonce) {
                      script.setAttribute('nonce', nonce);
                      console.log('Added nonce to child script element:', nonce);
                    }
                  });
                }
              }
            });
          });
        });
        
        observer.observe(document.body || document.documentElement, {
          childList: true,
          subtree: true
        });
      })();
    </script>`;

    // Insert the nonce script before the closing </head> tag
    body = body.replace('</head>', nonceScript + '\n</head>');

    console.log('Injected ngCspNonce into app-root:', nonce);
    console.log('Injected nonce into script tags:', nonce);
    console.log('Injected runtime nonce handler:', nonce);

    // Create a new response with the updated headers and modified body
    const response = new Response(body, {
      status: result.status,
      statusText: result.statusText,
      headers: headers,
    });

    return response;
  }

  return new Response('Not found', { status: 404 });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler);
