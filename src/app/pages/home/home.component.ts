import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PollService } from '../../core/services/poll.service';
import { Poll } from '../../core/models/poll.model';
import { PollCardComponent } from '../../shared/components/poll-card/poll-card.component';

type PollTab = 'active' | 'past';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PollCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  readonly activeTab = signal<PollTab>('active');
  readonly selectedCategory = signal<string | null>(null);
  readonly showCategoryMenu = signal(false);
  readonly isIllustrationHovered = signal(false);
  readonly isCtaHovered = signal(false);

  readonly categories = [
    'Team Activities',
    'Health & Wellness',
    'Gaming & Entertainment',
    'Education & Learning',
    'Lifestyle & Preferences',
    'Technology & Innovation'
  ];

  polls: Poll[] = [];
  loading = true;
  error = '';

  constructor(
    private readonly pollService: PollService,
    private readonly router: Router
  ) {}

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

  getActivePolls(): Poll[] {
    return this.polls.filter((poll) => new Date(poll.deadline) > new Date());
  }

  getPastPolls(): Poll[] {
    return this.polls.filter((poll) => new Date(poll.deadline) <= new Date());
  }

  getUrgentPolls(): Poll[] {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return this.getActivePolls().filter((poll) => {
      const deadline = new Date(poll.deadline).getTime();
      return deadline - now <= oneDay;
    });
  }

  getDisplayedPolls(): Poll[] {
    const polls = this.activeTab() === 'active'
      ? this.getActivePolls()
      : this.getPastPolls();

    const category = this.selectedCategory();

    if (!category) {
      return polls;
    }

    return polls.filter((poll) => poll.category === category);
  }

  getEndsInText(deadline: string): string {
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) {
      return 'Ending today';
    }

    return `Ends in ${days} ${days === 1 ? 'Day' : 'Days'}`;
  }

  toggleCategoryMenu(): void {
    this.showCategoryMenu.set(!this.showCategoryMenu());
  }

  selectCategory(category: string | null): void {
    this.selectedCategory.set(category);
    this.showCategoryMenu.set(false);
  }

  switchTab(tab: PollTab): void {
    this.activeTab.set(tab);
  }

  openCreateModal(): void {
    this.router.navigate(['/create']);
  }

  navigateToPoll(poll: Poll): void {
    this.router.navigate(['/poll', poll.id]);
  }
}