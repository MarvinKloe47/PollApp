import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  template: `
    <header class="app-header">
      <div class="app-header__inner">
        <a routerLink="/" class="app-header__logo">
          <img src="logo.svg" alt="Poll App" />
        </a>

      </div>
    </header>

    <router-outlet></router-outlet>
  `,
  styleUrl: './app.component.scss'
})
export class AppComponent {}