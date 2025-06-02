import {
  mergeApplicationConfig,
  ApplicationConfig,
  CSP_NONCE,
  inject,
  REQUEST_CONTEXT,
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
        return (globalThis as any)?.cspNonce || '';
      },
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
