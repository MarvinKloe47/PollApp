import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RealtimeChannel } from '@supabase/supabase-js';
import { PollService } from '../../core/services/poll.service';
import { Poll, PollQuestion } from '../../core/models/poll.model';

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
  public poll: Poll | null = null;
  public loading: boolean = true;
  public error: string = '';
  public selectedOptionIds: string[] = [];
  public voting: boolean = false;
  private voteSubscription: RealtimeChannel | null = null;

  /**
   * Creates the poll detail component.
   *
   * @param route Route used to read the current poll identifier.
   * @param pollService Service used to load and update poll data.
   */
  constructor(
    private readonly route: ActivatedRoute,
    private readonly pollService: PollService
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
    const votes = await this.pollService.getUserVotes(pollId, voterId);
    this.selectedOptionIds = votes;
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
   * Indicates whether any poll question allows multiple selected answers.
   *
   * @returns `true` when at least one question accepts multiple answers.
   */
  get canVoteMultiple(): boolean {
    return !!this.poll?.questions.some((question) => question.allow_multiple);
  }

  /**
   * Indicates whether the current visitor has already voted.
   *
   * @returns `true` when at least one option is selected for this voter.
   */
  get hasVoted(): boolean {
    return this.selectedOptionIds.length > 0;
  }

  /**
   * Indicates whether the visitor has already selected the provided option.
   *
   * @param optionId Identifier of the option to check.
   * @returns `true` when the option is already part of the visitor's vote.
   */
  isOptionSelected(optionId: string): boolean {
    return this.selectedOptionIds.includes(optionId);
  }

  /**
   * Indicates whether the visitor has already voted in a question.
   *
   * @param question Question whose voting state should be checked.
   * @returns `true` when one of the question's options was selected.
   */
  hasVotedInQuestion(question: PollQuestion): boolean {
    return question.options.some((option) => this.isOptionSelected(option.id));
  }

  /**
   * Determines whether an option should be disabled in the UI.
   *
   * @param optionId Identifier of the option being evaluated.
   * @param question Question that owns the option.
   * @returns `true` when the option can no longer be selected.
   */
  isOptionDisabled(optionId: string, question: PollQuestion): boolean {
    if (this.voting || this.isPollPast()) {
      return true;
    }

    if (question.allow_multiple) {
      return this.isOptionSelected(optionId);
    }

    return this.hasVotedInQuestion(question);
  }

  /**
   * Computes the total number of votes for one question.
   *
   * @param question Question whose answer votes should be summed.
   * @returns Sum of vote counts for the question.
   */
  getQuestionVotes(question: PollQuestion): number {
    return question.options.reduce((sum, option) => sum + option.vote_count, 0);
  }

  /**
   * Converts a vote count into a percentage of the total.
   *
   * @param votes Number of votes for the option.
   * @param question Question used as the percentage base.
   * @returns Percentage value between `0` and `100`.
   */
  getPercentage(votes: number, question: PollQuestion): number {
    const questionVotes = this.getQuestionVotes(question);

    if (questionVotes === 0) {
      return 0;
    }

    return (votes / questionVotes) * 100;
  }

  /**
   * Submits a vote for the selected option if the user has not voted yet.
   *
   * @param optionId Identifier of the option being voted for.
   */
  async vote(optionId: string): Promise<void> {
    if (!this.poll) {
      return;
    }

    const question = this.getQuestionForOption(optionId);

    if (!question || this.isOptionDisabled(optionId, question)) {
      return;
    }

    try {
      this.voting = true;

      await this.pollService.vote(
        this.poll.id,
        optionId,
        this.getVoterIdentifier()
      );

      this.selectedOptionIds = [...this.selectedOptionIds, optionId];
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
   * Finds the question that owns an answer option.
   *
   * @param optionId Identifier of the option to find.
   * @returns Owning question or `null` when not found.
   */
  private getQuestionForOption(optionId: string): PollQuestion | null {
    return this.poll?.questions.find((question) =>
      question.options.some((option) => option.id === optionId)
    ) ?? null;
  }

  /**
   * Indicates whether the loaded poll has already reached its deadline.
   *
   * @returns `true` when voting should be considered closed.
   */
  isPollPast(): boolean {
    if (!this.poll?.deadline) {
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
