import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CreatePollData } from '../../core/models/poll.model';
import { PollService } from '../../core/services/poll.service';

interface QuestionDraft {
  text: string;
  options: string[];
  allowMultiple: boolean;
}

const BASE_OPTIONS = ['', ''];
const CATEGORY_OPTIONS = [
  'Team Activities',
  'Health & Wellness',
  'Gaming & Entertainment',
  'Education & Learning',
  'Lifestyle & Preferences',
  'Technology & Innovation'
];

@Component({
  selector: 'app-create-poll-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-poll.component.html',
  styleUrl: './create-poll.component.scss'
})
export class CreatePollComponent {
  surveyTitle = '';
  surveyDescription = '';
  surveyDeadline = '';
  surveyCategory = '';
  categoryMenuOpen = false;
  readonly categoryOptions = CATEGORY_OPTIONS;

  questionDrafts: QuestionDraft[] = [this.createDraft()];
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  showSuccess = signal(false);
  private createdPollId: string | null = null;

  constructor(private readonly pollService: PollService, private readonly router: Router) {}

  get minDeadline(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  get hasSingleQuestion(): boolean {
    return this.questionDrafts.length === 1;
  }

  get showValidationHints(): boolean {
    return !this.isFormReady();
  }

  get submitDisabled(): boolean {
    return !this.isFormReady() || this.isSubmitting();
  }

  get validationHintList(): string[] {
    return this.buildValidationHints();
  }

  appendQuestion(): void {
    this.questionDrafts.push(this.createDraft());
  }

  removeQuestionAt(index: number): void {
    if (index === 0) {
      this.resetDraft(this.questionDrafts[0]);
      return;
    }

    this.questionDrafts.splice(index, 1);
  }

  appendAnswer(questionIndex: number): void {
    this.questionDrafts[questionIndex].options.push('');
  }

  removeAnswer(questionIndex: number, optionIndex: number): void {
    const options = this.questionDrafts[questionIndex].options;
    if (options.length > 2) {
      options.splice(optionIndex, 1);
    } else {
      options[optionIndex] = '';
    }
  }

  getAnswerLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  setCategory(category: string): void {
    this.surveyCategory = category;
    this.categoryMenuOpen = false;
  }

  buildValidationHints(): string[] {
    const hints: string[] = [];
    if (!this.surveyTitle.trim()) hints.push('Survey name is required.');
    if (this.getValidOptions(this.primaryQuestion).length < 2) hints.push('At least 2 answers are required.');
    if (this.surveyDeadline && new Date(this.surveyDeadline) <= new Date()) hints.push('Deadline must be in the future.');
    return hints;
  }

  isFormReady(): boolean {
    return this.buildValidationHints().length === 0;
  }

  async submitForm(): Promise<void> {
    if (!this.isFormReady() || this.isSubmitting()) return;

    try {
      this.isSubmitting.set(true);
      this.errorMessage.set(null);
      const pollId = await this.pollService.createPoll(this.buildPayload());
      this.createdPollId = pollId;
      this.showSuccess.set(true);
    } catch {
      this.errorMessage.set('Failed to create poll. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  closeSuccess(): void {
    if (!this.createdPollId) {
      this.router.navigate(['/']);
      return;
    }

    this.router.navigate(['/poll', this.createdPollId]);
  }

  closeModal(): void {
    this.router.navigate(['/']);
  }

  stopModalClick(event: Event): void {
    event.stopPropagation();
  }

  private createDraft(): QuestionDraft {
    return { text: '', options: [...BASE_OPTIONS], allowMultiple: false };
  }

  private resetDraft(draft: QuestionDraft): void {
    draft.text = '';
    draft.options = [...BASE_OPTIONS];
    draft.allowMultiple = false;
  }

  private get primaryQuestion(): QuestionDraft {
    return this.questionDrafts[0];
  }

  private getValidOptions(question: QuestionDraft): string[] {
    return question.options.map((option) => option.trim()).filter((option) => option.length > 0);
  }

  private buildPayload(): CreatePollData {
    return {
      title: this.surveyTitle.trim(),
      description: this.surveyDescription.trim(),
      deadline: this.surveyDeadline,
      options: this.getValidOptions(this.primaryQuestion),
      category: this.surveyCategory
    };
  }
}
