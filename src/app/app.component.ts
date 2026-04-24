import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  template: `
    <header>
      <nav>
        <a routerLink="/">Home</a>
        <a routerLink="/create">Create Poll</a>
      </nav>
    </header>

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