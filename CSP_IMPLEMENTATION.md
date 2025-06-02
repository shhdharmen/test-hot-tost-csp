# CSP Implementation with Nonces

This Angular application is configured with Content Security Policy (CSP) using nonces for enhanced security when deployed on Netlify.

## What's Implemented

### 1. Server-Side Nonce Generation (`src/server.ts`)

- Generates a unique random nonce for each request using `crypto.randomBytes()`
- Sets CSP headers dynamically with the nonce
- Makes the nonce available globally for Angular's CSP_NONCE token
- Passes the nonce through Netlify context for component access

### 2. Angular CSP_NONCE Integration

- **Server Config** (`src/app/app.config.server.ts`): Provides the CSP_NONCE token using the global nonce
- **Client Config** (`src/app/app.config.ts`): Provides an empty CSP_NONCE for client-side hydration
- **Component Usage** (`src/app/app.ts`): Demonstrates how to inject and use the nonce in components

### 3. CSP Policy

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

### 4. Netlify Configuration (`netlify.toml`)

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

## Notes

- The nonce is only available during SSR, not on the client-side after hydration
- `'unsafe-inline'` is included for styles to support some Angular components that inject styles dynamically
- Hot Toast library styles are configured to work with the CSP policy
