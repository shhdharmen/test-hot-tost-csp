import {
  mergeApplicationConfig,
  ApplicationConfig,
  CSP_NONCE,
  inject,
  REQUEST_CONTEXT,
  DOCUMENT,
} from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: CSP_NONCE,
      useFactory: () => {
        // Use the global nonce that was set in server.ts
        const nonce = (globalThis as any)?.cspNonce || '';
        console.log('Server CSP_NONCE factory called with nonce:', nonce);
        return nonce;
      },
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
