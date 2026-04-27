import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CreatePollComponent } from './pages/create-poll/create-poll.component';
import { PollDetailComponent } from './pages/poll-detail/poll-detail.component';

/**
 * Declares the application's top-level routes.
 */
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'create', component: CreatePollComponent },
  { path: 'poll/:id', component: PollDetailComponent }
];
