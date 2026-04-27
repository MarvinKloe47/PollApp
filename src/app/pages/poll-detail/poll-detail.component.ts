import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PollService } from '../../core/services/poll.service';
import { Poll } from '../../core/models/poll.model';

@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './poll-detail.component.html',
  styleUrl: './poll-detail.component.scss'
})
export class PollDetailComponent implements OnInit, OnDestroy {
  poll: Poll | null = null;
  loading = true;
  error = '';
  selectedOptionIds: string[] = [];
  voting = false;
  private voteSubscription: any;

  constructor(
    private route: ActivatedRoute,
    private pollService: PollService
  ) {}

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

  ngOnDestroy(): void {
    if (this.voteSubscription) {
      this.voteSubscription.unsubscribe();
    }
  }

  async loadPoll(pollId: string): Promise<void> {
    try {
      this.poll = await this.pollService.getPollById(pollId);
    } catch {
      this.error = 'Fehler beim Laden';
    } finally {
      this.loading = false;
    }
  }

  async loadUserVote(pollId: string): Promise<void> {
    const voterId = this.getVoterIdentifier();
    const votes = await this.pollService.getUserVotes(pollId, voterId);
    this.selectedOptionIds = this.canVoteMultiple ? votes : votes.slice(0, 1);
  }

  subscribeToLiveVotes(pollId: string): void {
    this.voteSubscription = this.pollService.subscribeToPollUpdates(
      pollId,
      async () => {
        await this.loadPoll(pollId);
      }
    );
  }

  getVoterIdentifier(): string {
    let id = localStorage.getItem('voter_id');

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('voter_id', id);
    }

    return id;
  }

  get totalVotes(): number {
    if (!this.poll) {
      return 0;
    }

    return this.poll.options.reduce(
      (sum, option) => sum + option.vote_count,
      0
    );
  }

  get canVoteMultiple(): boolean {
    return !!this.poll?.allow_multiple;
  }

  get hasVoted(): boolean {
    return this.selectedOptionIds.length > 0;
  }

  isOptionSelected(optionId: string): boolean {
    return this.selectedOptionIds.includes(optionId);
  }

  isOptionDisabled(optionId: string): boolean {
    if (this.voting || this.isPollPast()) {
      return true;
    }

    if (this.canVoteMultiple) {
      return this.isOptionSelected(optionId);
    }

    return this.hasVoted;
  }

  getPercentage(votes: number): number {
    if (this.totalVotes === 0) {
      return 0;
    }

    return (votes / this.totalVotes) * 100;
  }

  async vote(optionId: string): Promise<void> {
    if (!this.poll) {
      return;
    }

    if (!this.canVoteMultiple && this.hasVoted) {
      return;
    }

    if (this.canVoteMultiple && this.isOptionSelected(optionId)) {
      return;
    }

    try {
      this.voting = true;

      await this.pollService.vote(
        this.poll.id,
        optionId,
        this.getVoterIdentifier()
      );

      this.selectedOptionIds = this.canVoteMultiple
        ? [...this.selectedOptionIds, optionId]
        : [optionId];
      await this.loadPoll(this.poll.id);
    } catch {
      this.error = 'Vote fehlgeschlagen';
    } finally {
      this.voting = false;
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  isPollPast(): boolean {
    if (!this.poll) {
      return false;
    }

    return new Date(this.poll.deadline) <= new Date();
  }

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