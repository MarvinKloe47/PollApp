import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PollService } from '../../core/services/poll.service';
import { Poll } from '../../core/models/poll.model';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './poll-detail.component.html',
  styleUrl: './poll-detail.component.scss'
})
export class PollDetailComponent implements OnInit {
  poll: Poll | null = null;
  loading = true;
  error = '';
  selectedOptionId: string | null = null;
  voting = false;

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
    this.selectedOptionId = await this.pollService.getUserVote(pollId, voterId);
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
    if (!this.poll) return 0;

    return this.poll.options.reduce(
      (sum, option) => sum + option.voteCount,
      0
    );
  }

  getPercentage(votes: number): number {
    if (this.totalVotes === 0) return 0;
    return (votes / this.totalVotes) * 100;
  }

  async vote(optionId: string): Promise<void> {
    if (!this.poll || this.selectedOptionId) return;

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