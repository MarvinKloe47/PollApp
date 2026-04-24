import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  template: `
    <header class="app-nav" [class.app-nav--light]="isLightPage()">
      <div class="app-nav__inner">
        <a class="app-nav__logo" routerLink="/" aria-label="PollApp home">
          <img
            [src]="isLightPage() ? 'logo_dark.svg' : 'logo.svg'"
            alt="Poll App"
            class="app-nav__logo-img"
            width="119"
            height="50"
          />
        </a>

        @if (isLightPage()) {
          <button
            class="app-nav__create-btn"
            type="button"
            (click)="router.navigate(['/create'])"
          >
            Create survey
          </button>
        }
      </div>
    </header>

    <router-outlet></router-outlet>
  `,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(public router: Router) {}

  isLightPage(): boolean {
    return this.router.url.startsWith('/poll/');
  }
}