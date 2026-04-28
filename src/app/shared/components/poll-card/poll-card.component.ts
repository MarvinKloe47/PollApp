import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Poll } from '../../../core/models/poll.model';

/**
 * Displays a compact summary card for a poll in list views.
 */
@Component({
  selector: 'app-poll-card',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './poll-card.component.html',
  styleUrl: './poll-card.component.scss'
})
export class PollCardComponent {
  @Input() public poll!: Poll;

  /**
   * Computes the total number of votes across all poll options.
   *
   * @returns Sum of the option vote counters.
   */
  get totalVotes(): number {
    return this.poll.options.reduce(
      (sum, option) => sum + option.vote_count,
      0
    );
  }

  /**
   * Indicates whether the poll deadline is still in the future.
   *
   * @returns `true` when the poll is still active.
   */
  get isActive(): boolean {
    return !this.poll.deadline || new Date(this.poll.deadline) > new Date();
  }
}
