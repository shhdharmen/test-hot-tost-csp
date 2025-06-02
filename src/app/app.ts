import { Component, Inject, inject, Optional } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';
import type { Context } from '@netlify/edge-functions';
import {} from '@netlify/edge-functions';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'test-hot-tost-csp';
  protected toast = inject(HotToastService);

  constructor(
    // ...
    @Inject('netlify.request') @Optional() request?: Request,
    @Inject('netlify.context') @Optional() context?: Context,
    @Inject('netlify.response') @Optional() response?: Response
  ) {
    console.log(request?.json() ?? 'no request');
    console.log(context ?? 'no context');
    console.log(response?.json() ?? 'no response');
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
