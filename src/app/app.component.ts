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

        <button
          type="button"
          class="app-header__create"
          routerLink="/create"
        >
          Create survey
        </button>
      </div>
    </header>

    <router-outlet></router-outlet>
  `,
  styleUrl: './app.component.scss'
})
export class AppComponent {}