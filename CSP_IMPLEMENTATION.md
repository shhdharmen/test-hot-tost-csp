# CSP Implementation with Nonces

This Angular application is configured with Content Security Policy (CSP) using nonces for enhanced security when deployed on Netlify.

## What's Implemented

### 1. Server-Side Nonce Generation (`src/server.ts`)

- Generates a unique random nonce for each request using `crypto.randomBytes()`
- Sets CSP headers dynamically with the nonce
- Makes the nonce available globally for Angular's CSP_NONCE token
- Passes the nonce through Netlify context for component access
- Includes debug logging to troubleshoot CSP header application
- **Edge Function Compatible**: Removed Express static file serving (handled by Netlify automatically)

### 2. Angular CSP_NONCE Integration

- **Server Config** (`src/app/app.config.server.ts`): Provides the CSP_NONCE token using the global nonce
- **Client Config** (`src/app/app.config.ts`): Provides an empty CSP_NONCE for client-side hydration
- **Component Usage** (`src/app/app.ts`): Demonstrates how to inject and use the nonce in components

### 3. Route Configuration (`src/app/app.routes.server.ts`)

- **CRITICAL**: Routes are configured with `RenderMode.Server` instead of `RenderMode.Prerender`
- This ensures each request goes through the server handler where CSP headers are set
- Prerendered pages are static and cannot have dynamic nonces

### 4. CSP Policy

The following CSP policy is enforced:

```
default-src 'self';
script-src 'self' 'nonce-{RANDOM_NONCE}';
style-src 'self' 'nonce-{RANDOM_NONCE}' 'unsafe-inline';
font-src 'self' data:;
img-src 'self' data: https:;
connect-src 'self';
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
block-all-mixed-content;
upgrade-insecure-requests
```

### 5. Netlify Configuration (`netlify.toml`)

- Uses `@netlify/plugin-csp-nonce` plugin
- Static CSP headers removed (now set dynamically)
- Other security headers still applied to static assets

## How to Use CSP Nonce in Components

```typescript
import { Component, inject, CSP_NONCE } from "@angular/core";

@Component({
  selector: "my-component",
  template: `<div>Nonce: {{ cspNonce }}</div>`,
})
export class MyComponent {
  protected cspNonce = inject(CSP_NONCE, { optional: true });
}
```

## Benefits

1. **Enhanced Security**: Prevents XSS attacks by only allowing scripts/styles with the correct nonce
2. **Dynamic Nonces**: Each request gets a unique nonce, making it harder for attackers
3. **Framework Integration**: Angular's built-in CSP_NONCE token is properly configured
4. **SSR Compatible**: Works seamlessly with Angular's Server-Side Rendering
5. **Netlify Optimized**: Leverages Netlify's CSP nonce plugin and edge functions

## Testing

1. **Build**: `npm run build` - Ensures no CSP-related build errors
2. **Local Development**: Use `netlify serve` to test CSP headers locally
3. **Production**: Deploy to Netlify and check browser developer tools for CSP headers
4. **Verify Headers**: Use browser DevTools Network tab to inspect response headers
5. **CLI Testing**: `curl -I https://your-site.netlify.app/` to check headers

## Important Notes

- ⚠️ **Routes must use `RenderMode.Server`** - Prerendered routes won't have CSP headers
- The nonce is only available during SSR, not on the client-side after hydration
- `'unsafe-inline'` is included for styles to support some Angular components that inject styles dynamically
- Hot Toast library styles are configured to work with the CSP policy
- Check the server logs for CSP nonce generation and policy setting debug information
- **Edge Function Compatibility**: Static file serving is handled by Netlify, not in the Edge Function

## Troubleshooting

If CSP headers are not appearing:

1. Verify routes are using `RenderMode.Server` in `app.routes.server.ts`
2. Check the Network tab in DevTools for response headers
3. Look for console logs about nonce generation and CSP policy setting
4. Ensure the application is deployed to Netlify (not just statically hosted)

If you get Edge Function file system errors:

1. Remove any file system access code from `server.ts`
2. Don't use `express.static()` or similar file serving in Edge Functions
3. Netlify handles static asset serving automatically
