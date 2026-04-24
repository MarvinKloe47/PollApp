import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PollService } from '../../core/services/poll.service';

@Component({
  selector: 'app-create-poll',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './create-poll.component.html',
  styleUrl: './create-poll.component.scss'
})
export class CreatePollComponent {
  title = '';
  description = '';
  deadline = '';
  category = '';
  questionText = '';
  allowMultiple = false;
  options = ['', ''];
  loading = false;
  error = '';
  showCategories = false;

  readonly categories = [
    'Team Activities',
    'Health & Wellness',
    'Gaming & Entertainment',
    'Education & Learning',
    'Lifestyle & Preferences',
    'Technology & Innovation'
  ];

  constructor(
    private pollService: PollService,
    private router: Router
  ) {}

  get minDeadline(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  getLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  addOption(): void {
    this.options.push('');
  }

  removeOption(index: number): void {
    if (this.options.length > 2) {
      this.options.splice(index, 1);
      return;
    }

    this.options[index] = '';
  }

  clearQuestion(): void {
    this.questionText = '';
    this.options = ['', ''];
    this.allowMultiple = false;
  }

  selectCategory(category: string): void {
    this.category = category;
    this.showCategories = false;
  }

  validationHints(): string[] {
    const hints: string[] = [];
    const validOptions = this.getCleanedOptions();

    if (!this.title.trim()) {
      hints.push('Survey name is required.');
    }

    if (validOptions.length < 2) {
      hints.push('At least 2 answers are required.');
    }

    if (this.deadline && new Date(this.deadline) <= new Date()) {
      hints.push('Deadline must be in the future.');
    }

    return hints;
  }

  isFormValid(): boolean {
    return this.validationHints().length === 0;
  }

  async submit(): Promise<void> {
    if (!this.isFormValid() || this.loading) {
      return;
    }

    try {
      this.loading = true;
      this.error = '';

      const pollId = await this.pollService.createPoll({
        title: this.title.trim(),
        description: this.description.trim(),
        deadline: this.deadline || new Date(Date.now() + 86400000).toISOString(),
        category: this.category || 'Team Activities',
        options: this.getCleanedOptions()
      });

      await this.router.navigate(['/poll', pollId]);
    } catch {
      this.error = 'Failed to create poll. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  handleClose(): void {
    this.router.navigate(['/']);
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  private getCleanedOptions(): string[] {
    return this.options
      .map((option) => option.trim())
      .filter((option) => option.length > 0);
  }
}