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
    @Inject('netlify.context') @Optional() context?: Context
  ) {
    console.log(
      `Rendering Foo for path ${request?.url} from location ${context?.geo?.city}`
    );
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
