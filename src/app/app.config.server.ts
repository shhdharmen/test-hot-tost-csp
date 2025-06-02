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
      useValue: 'rand0mN0nc3',
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
