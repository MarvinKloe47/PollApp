import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Poll } from '../../../core/models/poll.model';

@Component({
  selector: 'app-poll-card',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './poll-card.component.html',
  styleUrl: './poll-card.component.scss'
})
export class PollCardComponent {
  @Input() poll!: Poll;

  get totalVotes(): number {
    return this.poll.options.reduce(
      (sum, option) => sum + option.vote_count,
      0
    );
  }

  get isActive(): boolean {
    return new Date(this.poll.deadline) > new Date();
  }
}