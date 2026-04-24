import { Component, OnInit } from '@angular/core';
import { PollService } from '../../core/services/poll.service';
import { Poll } from '../../core/models/poll.model';
import { CommonModule } from '@angular/common';
import { PollCardComponent } from '../../shared/components/poll-card/poll-card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PollCardComponent, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  polls: Poll[] = [];
  loading = true;
  error = '';

  constructor(private pollService: PollService) {}

  async ngOnInit(): Promise<void> {
    await this.loadPolls();
  }

  async loadPolls(): Promise<void> {
    try {
      this.loading = true;
      this.polls = await this.pollService.loadPolls();
    } catch {
      this.error = 'Fehler beim Laden der Umfragen';
    } finally {
      this.loading = false;
    }
  }
  isActive(deadline: string): boolean {
  return new Date(deadline) > new Date();
}

get activePolls(): Poll[] {
  return this.polls.filter((poll) => this.isActive(poll.deadline));
}

get pastPolls(): Poll[] {
  return this.polls.filter((poll) => !this.isActive(poll.deadline));
}
}