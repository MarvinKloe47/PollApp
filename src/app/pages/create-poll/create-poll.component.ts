import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PollService } from '../../core/services/poll.service';
import { CreatePollData } from '../../core/models/poll.model';


interface QuestionDraft {
  text: string;
  options: string[];
  allowMultiple: boolean;
}

@Component({
  selector: 'app-create-poll-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-poll.component.html',
  styleUrl: './create-poll.component.scss',
})
export class CreatePollComponent {
  title = '';
  description = '';
  deadline = '';
  category = '';
  get minDeadline(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  showCategories = false;
  readonly categories = ['Team Activities', 'Health & Wellness', 'Gaming & Entertainment', 'Education & Learning', 'Lifestyle & Preferences', 'Technology & Innovation'];

  questions: QuestionDraft[] = [
    { text: '', options: ['', ''], allowMultiple: false }
  ];
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  showSuccess = signal(false);
  private createdPollId: string | null = null;

  constructor(private readonly pollService: PollService, private readonly router: Router) {}

  /** Appends a new empty question with two default answer slots. */
  addQuestion(): void {
    this.questions.push({ text: '', options: ['', ''], allowMultiple: false });
  }

  /** Resets the first question instead of removing it to always keep at least one. */
  removeQuestion(index: number): void {
    if (index === 0) {
      this.questions[0].text = '';
      this.questions[0].options = ['', ''];
      this.questions[0].allowMultiple = false;
    } else {
      this.questions.splice(index, 1);
    }
  }

  /** Adds an empty answer slot to the given question. */
  addOption(questionIndex: number): void {
    this.questions[questionIndex].options.push('');
  }

  /** Removes an answer option or clears it if only two remain. */
  removeOption(questionIndex: number, optionIndex: number): void {
    if (this.questions[questionIndex].options.length > 2) {
      this.questions[questionIndex].options.splice(optionIndex, 1);
    } else {
      this.questions[questionIndex].options[optionIndex] = '';
    }
  }

  /** Maps a zero-based index to A, B, C, D... for option labels. */
  getLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  /** Selects a category and closes the dropdown. */
  selectCategory(cat: string): void {
    this.category = cat;
    this.showCategories = false;
  }

  /** Returns list of validation issues for display. */
  validationHints(): string[] {
    const hints: string[] = [];
    if (!this.title.trim()) hints.push('Survey name is required.');
    const validOptions = this.questions[0].options.filter(o => o.trim().length > 0);
    if (validOptions.length < 2) hints.push('At least 2 answers are required.');
    if (this.deadline && new Date(this.deadline) <= new Date()) hints.push('Deadline must be in the future.');
    return hints;
  }

  /** Title and at least two non-empty options are required. Deadline must not be in the past. */
  isFormValid(): boolean {
    return this.validationHints().length === 0;
  }

  /** Validates, builds the payload and delegates to the poll service. */
  async handleSubmit(): Promise<void> {
    if (!this.isFormValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const data: CreatePollData = {
      title: this.title.trim(),
      description: this.description.trim(),
      deadline: this.deadline,
      options: this.questions[0].options.filter(o => o.trim().length > 0),
      category: this.category,
    };

    const result = await this.pollService.createPoll(data);

    if (result) {
      this.createdPollId = result;
      this.showSuccess.set(true);
    } else {
      this.errorMessage.set('Failed to create poll. Please try again.');
    }

    this.isSubmitting.set(false);
  }

  closeSuccessOverlay(): void {
    this.router.navigate(['/poll', this.createdPollId]);
  }

  /** Navigates back to the home page. */
  handleClose(): void {
    this.router.navigate(['/']);
  }

  /** Prevents clicks inside the modal from bubbling up to the backdrop. */
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
