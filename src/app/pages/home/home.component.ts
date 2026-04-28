import { Component, OnInit, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PollService } from '../../core/services/poll.service';
import { Poll } from '../../core/models/poll.model';
import { PollCardComponent } from '../../shared/components/poll-card/poll-card.component';

/**
 * Distinguishes between current and archived poll views on the home page.
 */
type PollTab = 'active' | 'past';

/**
 * Displays the poll overview, category filters, and primary landing page actions.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PollCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  public readonly activeTab: WritableSignal<PollTab> = signal<PollTab>('active');
  public readonly selectedCategory: WritableSignal<string | null> = signal<string | null>(null);
  public readonly showCategoryMenu: WritableSignal<boolean> = signal(false);
  public readonly isIllustrationHovered: WritableSignal<boolean> = signal(false);
  public readonly isCtaHovered: WritableSignal<boolean> = signal(false);

  public readonly categories: string[] = [
    'Team Activities',
    'Health & Wellness',
    'Gaming & Entertainment',
    'Education & Learning',
    'Lifestyle & Preferences',
    'Technology & Innovation'
  ];

  public polls: Poll[] = [];
  public loading: boolean = true;
  public error: string = '';

  /**
   * Creates the home page component.
   *
   * @param pollService Service used to load poll data.
   * @param router Router used for navigation.
   */
  constructor(
    private readonly pollService: PollService,
    private readonly router: Router
  ) {}

  /**
   * Loads poll data when the component is initialized.
   */
  async ngOnInit(): Promise<void> {
    await this.loadPolls();
  }

  /**
   * Fetches the latest polls and updates the loading state.
   */
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

  /**
   * Returns polls whose deadline is still in the future.
   *
   * @returns Active polls sorted in their existing order.
   */
  getActivePolls(): Poll[] {
    return this.polls.filter((poll) => new Date(poll.deadline) > new Date());
  }

  /**
   * Returns polls whose deadline has already passed.
   *
   * @returns Archived polls sorted in their existing order.
   */
  getPastPolls(): Poll[] {
    return this.polls.filter((poll) => new Date(poll.deadline) <= new Date());
  }

  /**
   * Returns active polls ending within the next 24 hours.
   *
   * @returns Time-sensitive polls that should be highlighted.
   */
  getUrgentPolls(): Poll[] {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return this.getActivePolls().filter((poll) => {
      const deadline = new Date(poll.deadline).getTime();
      return deadline - now <= oneDay;
    });
  }

  /**
   * Applies the active tab and category filter to the loaded polls.
   *
   * @returns Polls that should currently be rendered on the page.
   */
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

  /**
   * Formats a short status label describing how long a poll remains open.
   *
   * @param deadline Poll deadline as an ISO date string.
   * @returns Human-readable countdown text.
   */
  getEndsInText(deadline: string): string {
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) {
      return 'Ending today';
    }

    return `Ends in ${days} ${days === 1 ? 'Day' : 'Days'}`;
  }

  /**
   * Toggles the visibility of the category selection menu.
   */
  toggleCategoryMenu(): void {
    this.showCategoryMenu.set(!this.showCategoryMenu());
  }

  /**
   * Updates the active category filter and closes the menu.
   *
   * @param category Newly selected category or `null` to clear the filter.
   */
  selectCategory(category: string | null): void {
    this.selectedCategory.set(category);
    this.showCategoryMenu.set(false);
  }

  /**
   * Switches between the active and past poll tabs.
   *
   * @param tab Tab that should become active.
   */
  switchTab(tab: PollTab): void {
    this.activeTab.set(tab);
  }

  /**
   * Navigates to the poll creation flow.
   */
  openCreateModal(): void {
    this.router.navigate(['/create']);
  }

  /**
   * Opens the detail view for a selected poll.
   *
   * @param poll Poll that should be displayed.
   */
  navigateToPoll(poll: Poll): void {
    this.router.navigate(['/poll', poll.id]);
  }
}
