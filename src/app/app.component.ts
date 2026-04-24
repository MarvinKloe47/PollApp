import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  template: `
      <header class="app-nav">
    <div class="app-nav__inner">
      <a class="app-nav__logo" routerLink="/">
        <img src="logo.svg" alt="Poll App" class="app-nav__logo-img">
      </a>

      <a class="app-nav__create-btn" routerLink="/create">
        Create survey
      </a>
    </div>
  </header>

  <router-outlet></router-outlet>


    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    header {
      padding: 16px;
      border-bottom: 1px solid #ccc;
    }

    nav {
      display: flex;
      gap: 16px;
    }

    main {
      padding: 20px;
    }
  `]
})
export class AppComponent {}