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
    const escapedNonce = nonce.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const nonceScript =
      '<script nonce="' +
      escapedNonce +
      '">\n' +
      '  (function() {\n' +
      "    const nonce = '" +
      escapedNonce +
      "';\n" +
      "    console.log('Runtime nonce handler loaded with nonce:', nonce);\n" +
      '    \n' +
      '    // Override createElement to automatically add nonce to script elements\n' +
      '    const originalCreateElement = document.createElement;\n' +
      '    document.createElement = function(tagName) {\n' +
      '      const element = originalCreateElement.call(this, tagName);\n' +
      "      if (tagName.toLowerCase() === 'script' && nonce) {\n" +
      "        element.setAttribute('nonce', nonce);\n" +
      "        console.log('Added nonce to dynamically created script:', nonce);\n" +
      '      }\n' +
      '      return element;\n' +
      '    };\n' +
      '    \n' +
      '    // Also watch for any script elements added via innerHTML or other methods\n' +
      '    const observer = new MutationObserver(function(mutations) {\n' +
      '      mutations.forEach(function(mutation) {\n' +
      '        mutation.addedNodes.forEach(function(node) {\n' +
      '          if (node.nodeType === 1) { // Element node\n' +
      "            if (node.tagName === 'SCRIPT' && !node.getAttribute('nonce') && nonce) {\n" +
      "              node.setAttribute('nonce', nonce);\n" +
      "              console.log('Added nonce to observed script element:', nonce);\n" +
      '            }\n' +
      '            // Check child script elements too\n' +
      "            const scriptTags = node.querySelectorAll && node.querySelectorAll('script');\n" +
      '            if (scriptTags) {\n' +
      '              scriptTags.forEach(function(script) {\n' +
      "                if (!script.getAttribute('nonce') && nonce) {\n" +
      "                  script.setAttribute('nonce', nonce);\n" +
      "                  console.log('Added nonce to child script element:', nonce);\n" +
      '                }\n' +
      '              });\n' +
      '            }\n' +
      '          }\n' +
      '        });\n' +
      '      });\n' +
      '    });\n' +
      '    \n' +
      '    observer.observe(document.body || document.documentElement, {\n' +
      '      childList: true,\n' +
      '      subtree: true\n' +
      '    });\n' +
      '  })();\n' +
      '</script>';

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
