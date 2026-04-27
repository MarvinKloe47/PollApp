import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PollService } from '../../core/services/poll.service';
import { Poll } from '../../core/models/poll.model';

/**
 * Renders a single poll, its voting state, and live vote updates.
 */
@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './poll-detail.component.html',
  styleUrl: './poll-detail.component.scss'
})
export class PollDetailComponent implements OnInit, OnDestroy {
  /** Poll currently displayed in the detail view. */
  poll: Poll | null = null;
  /** Indicates whether the poll data is currently loading. */
  loading = true;
  /** User-facing error message shown when loading or voting fails. */
  error = '';
  /** Option already selected by the current visitor, if any. */
  selectedOptionId: string | null = null;
  /** Indicates whether a vote request is currently in flight. */
  voting = false;
  /** Live update subscription for the current poll. */
  private voteSubscription: any;

  /**
   * Creates the poll detail component.
   *
   * @param route Route used to read the current poll identifier.
   * @param pollService Service used to load and update poll data.
   */
  constructor(
    private route: ActivatedRoute,
    private pollService: PollService
  ) {}

  /**
   * Loads the current poll, voter state, and live update subscription.
   */
  async ngOnInit(): Promise<void> {
    const pollId = this.route.snapshot.paramMap.get('id');

    if (!pollId) {
      this.error = 'Keine Poll-ID';
      this.loading = false;
      return;
    }

    await this.loadPoll(pollId);
    await this.loadUserVote(pollId);
    this.subscribeToLiveVotes(pollId);
  }

  /**
   * Cleans up the live vote subscription when the component is destroyed.
   */
  ngOnDestroy(): void {
    if (this.voteSubscription) {
      this.voteSubscription.unsubscribe();
    }
  }

  /**
   * Loads the poll data for the provided identifier.
   *
   * @param pollId Identifier of the poll to fetch.
   */
  async loadPoll(pollId: string): Promise<void> {
    try {
      this.poll = await this.pollService.getPollById(pollId);
    } catch {
      this.error = 'Fehler beim Laden';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Resolves the current visitor's previous vote for the poll.
   *
   * @param pollId Identifier of the poll being viewed.
   */
  async loadUserVote(pollId: string): Promise<void> {
    const voterId = this.getVoterIdentifier();
    this.selectedOptionId = await this.pollService.getUserVote(pollId, voterId);
  }

  /**
   * Subscribes to realtime vote updates and refreshes the poll on changes.
   *
   * @param pollId Identifier of the poll to observe.
   */
  subscribeToLiveVotes(pollId: string): void {
    this.voteSubscription = this.pollService.subscribeToPollUpdates(
      pollId,
      async () => {
        await this.loadPoll(pollId);
      }
    );
  }

  /**
   * Returns a stable client-side voter identifier stored in local storage.
   *
   * @returns Existing or newly generated voter identifier.
   */
  getVoterIdentifier(): string {
    let id = localStorage.getItem('voter_id');

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('voter_id', id);
    }

    return id;
  }

  /**
   * Computes the total number of votes across all options.
   *
   * @returns Sum of vote counts for the loaded poll.
   */
  get totalVotes(): number {
    if (!this.poll) {
      return 0;
    }

    return this.poll.options.reduce(
      (sum, option) => sum + option.vote_count,
      0
    );
  }

  /**
   * Converts a vote count into a percentage of the total.
   *
   * @param votes Number of votes for the option.
   * @returns Percentage value between `0` and `100`.
   */
  getPercentage(votes: number): number {
    if (this.totalVotes === 0) {
      return 0;
    }

    return (votes / this.totalVotes) * 100;
  }

  /**
   * Submits a vote for the selected option if the user has not voted yet.
   *
   * @param optionId Identifier of the option being voted for.
   */
  async vote(optionId: string): Promise<void> {
    if (!this.poll || this.selectedOptionId) {
      return;
    }

    try {
      this.voting = true;

      await this.pollService.vote(
        this.poll.id,
        optionId,
        this.getVoterIdentifier()
      );

      this.selectedOptionId = optionId;
      await this.loadPoll(this.poll.id);
    } catch {
      this.error = 'Vote fehlgeschlagen';
    } finally {
      this.voting = false;
    }
  }

  /**
   * Returns the alphabetical label used to annotate an option.
   *
   * @param index Zero-based option index.
   * @returns Uppercase letter such as `A` or `B`.
   */
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  /**
   * Indicates whether the loaded poll has already reached its deadline.
   *
   * @returns `true` when voting should be considered closed.
   */
  isPollPast(): boolean {
    if (!this.poll) {
      return false;
    }

    return new Date(this.poll.deadline) <= new Date();
  }

  /**
   * Formats the poll deadline for display in the detail header.
   *
   * @returns Localized deadline text or a fallback label.
   */
  getDeadlineText(): string {
    if (!this.poll?.deadline) {
      return 'No deadline';
    }

    const date = new Date(this.poll.deadline);

    if (isNaN(date.getTime())) {
      return 'No deadline';
    }

    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
