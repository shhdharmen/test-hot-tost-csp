import { Component, inject } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'test-hot-tost-csp';
  protected toast = inject(HotToastService);

  showToast() {
    this.toast.success('Hello, world!');
  }
}
