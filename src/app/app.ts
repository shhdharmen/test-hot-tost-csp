import { Component, Inject, inject, Optional, CSP_NONCE } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';
import type { Context } from '@netlify/edge-functions';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'test-hot-tost-csp';
  protected toast = inject(HotToastService);
  protected cspNonce = inject(CSP_NONCE, { optional: true });

  constructor(
    // ...
    @Inject('netlify.request') @Optional() request?: Request,
    @Inject('netlify.context') @Optional() context?: Context
  ) {
    console.log(
      `Rendering Foo for path ${request?.url} from location ${context?.geo?.city}`
    );
    console.log('CSP Nonce available:', this.cspNonce);
    // ...
  }

  showToast() {
    this.toast.success('Look at my styles', {
      style: {
        border: '1px solid #713200',
        padding: '16px',
        color: '#713200',
      },
      iconTheme: {
        primary: '#713200',
        secondary: '#FFFAEE',
      },
    });
  }
}
