import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CreatePollData } from '../../core/models/poll.model';
import { PollService } from '../../core/services/poll.service';

/**
 * Represents the editable state of a question while building a poll.
 */
interface QuestionDraft {
  /** Current question prompt text. */
  text: string;
  /** Candidate answer options for the question. */
  options: string[];
  /** Indicates whether multiple answers should be allowed. */
  allowMultiple: boolean;
}

/** Default two-option scaffold used for new question drafts. */
const BASE_OPTIONS = ['', ''];

/** Categories available when creating a new poll. */
const CATEGORY_OPTIONS = [
  'Team Activities',
  'Health & Wellness',
  'Gaming & Entertainment',
  'Education & Learning',
  'Lifestyle & Preferences',
  'Technology & Innovation'
];

/**
 * Hosts the poll creation form and validates user input before submission.
 */
@Component({
  selector: 'app-create-poll-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-poll.component.html',
  styleUrl: './create-poll.component.scss'
})
export class CreatePollComponent {
  /** Title entered for the survey. */
  surveyTitle = '';
  /** Description entered for the survey. */
  surveyDescription = '';
  /** Deadline value selected in the form. */
  surveyDeadline = '';
  /** Category chosen for the survey. */
  surveyCategory = '';
  /** Controls the visibility of the category dropdown menu. */
  categoryMenuOpen = false;
  /** Available category labels rendered in the picker. */
  readonly categoryOptions = CATEGORY_OPTIONS;

  /** Mutable list of drafted poll questions. */
  questionDrafts: QuestionDraft[] = [this.createDraft()];
  /** Indicates whether the form is currently being submitted. */
  isSubmitting = signal(false);
  /** Stores the latest submission error for display in the UI. */
  errorMessage = signal<string | null>(null);
  /** Controls the success overlay shown after a poll was created. */
  showSuccess = signal(false);
  /** Identifier of the most recently created poll. */
  private createdPollId: string | null = null;

  /**
   * Creates the poll creation component.
   *
   * @param pollService Service used to persist the new poll.
   * @param router Router used for closing the modal flow.
   */
  constructor(private readonly pollService: PollService, private readonly router: Router) {}

  /**
   * Computes the minimum selectable deadline based on the current local time.
   *
   * @returns Deadline string formatted for the datetime-local input.
   */
  get minDeadline(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  /**
   * Indicates whether only the initial question draft exists.
   *
   * @returns `true` when the form contains exactly one question.
   */
  get hasSingleQuestion(): boolean {
    return this.questionDrafts.length === 1;
  }

  /**
   * Indicates whether validation feedback should currently be shown.
   *
   * @returns `true` when the form is not yet ready for submission.
   */
  get showValidationHints(): boolean {
    return !this.isFormReady();
  }

  /**
   * Indicates whether the submit action should be disabled.
   *
   * @returns `true` while invalid or during an active submission.
   */
  get submitDisabled(): boolean {
    return !this.isFormReady() || this.isSubmitting();
  }

  /**
   * Builds the list of validation messages currently relevant to the form.
   *
   * @returns Human-readable validation hints for the user.
   */
  get validationHintList(): string[] {
    return this.buildValidationHints();
  }

  /**
   * Appends a new blank question draft to the form.
   */
  appendQuestion(): void {
    this.questionDrafts.push(this.createDraft());
  }

  /**
   * Removes a question draft or resets the first one to its initial state.
   *
   * @param index Index of the draft to remove or reset.
   */
  removeQuestionAt(index: number): void {
    if (index === 0) {
      this.resetDraft(this.questionDrafts[0]);
      return;
    }

    this.questionDrafts.splice(index, 1);
  }

  /**
   * Adds an empty answer option to a question draft.
   *
   * @param questionIndex Index of the question to extend.
   */
  appendAnswer(questionIndex: number): void {
    this.questionDrafts[questionIndex].options.push('');
  }

  /**
   * Removes an answer option while preserving a minimum of two visible fields.
   *
   * @param questionIndex Index of the owning question.
   * @param optionIndex Index of the option to remove or clear.
   */
  removeAnswer(questionIndex: number, optionIndex: number): void {
    const options = this.questionDrafts[questionIndex].options;
    if (options.length > 2) {
      options.splice(optionIndex, 1);
    } else {
      options[optionIndex] = '';
    }
  }

  /**
   * Returns the alphabetical label used for an option input.
   *
   * @param index Zero-based option index.
   * @returns Uppercase letter label such as `A` or `B`.
   */
  getAnswerLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  /**
   * Stores the selected category and closes the dropdown.
   *
   * @param category Category chosen by the user.
   */
  setCategory(category: string): void {
    this.surveyCategory = category;
    this.categoryMenuOpen = false;
  }

  /**
   * Builds the current list of validation errors for the form.
   *
   * @returns Validation hints that must be resolved before submission.
   */
  buildValidationHints(): string[] {
    const hints: string[] = [];
    if (!this.surveyTitle.trim()) hints.push('Survey name is required.');
    if (this.getValidOptions(this.primaryQuestion).length < 2) hints.push('At least 2 answers are required.');
    if (this.surveyDeadline && new Date(this.surveyDeadline) <= new Date()) hints.push('Deadline must be in the future.');
    return hints;
  }

  /**
   * Indicates whether all mandatory poll fields are valid.
   *
   * @returns `true` when submission requirements are satisfied.
   */
  isFormReady(): boolean {
    return this.buildValidationHints().length === 0;
  }

  /**
   * Persists the poll and shows the success state on completion.
   */
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

  /**
   * Closes the success state and navigates to the created poll when available.
   */
  closeSuccess(): void {
    if (!this.createdPollId) {
      this.router.navigate(['/']);
      return;
    }

    this.router.navigate(['/poll', this.createdPollId]);
  }

  /**
   * Closes the creation flow and returns to the home page.
   */
  closeModal(): void {
    this.router.navigate(['/']);
  }

  /**
   * Prevents clicks inside the modal from bubbling to the backdrop.
   *
   * @param event Browser click event raised inside the modal.
   */
  stopModalClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Creates a fresh question draft with the default option scaffold.
   *
   * @returns Newly initialized draft object.
   */
  private createDraft(): QuestionDraft {
    return { text: '', options: [...BASE_OPTIONS], allowMultiple: false };
  }

  /**
   * Resets an existing draft back to its initial blank state.
   *
   * @param draft Draft object to reset in place.
   */
  private resetDraft(draft: QuestionDraft): void {
    draft.text = '';
    draft.options = [...BASE_OPTIONS];
    draft.allowMultiple = false;
  }

  /**
   * Returns the primary question currently used to build the poll payload.
   *
   * @returns First question draft in the editor.
   */
  private get primaryQuestion(): QuestionDraft {
    return this.questionDrafts[0];
  }

  /**
   * Returns trimmed, non-empty options for a draft question.
   *
   * @param question Question draft whose options should be normalized.
   * @returns Valid option labels ready for persistence.
   */
  private getValidOptions(question: QuestionDraft): string[] {
    return question.options.map((option) => option.trim()).filter((option) => option.length > 0);
  }

  /**
   * Converts the current form state into the payload expected by the backend.
   *
   * @returns Normalized poll creation payload.
   */
  private buildPayload(): CreatePollData {
    return {
      title: this.surveyTitle.trim(),
      description: this.surveyDescription.trim(),
      deadline: this.surveyDeadline,
      options: this.getValidOptions(this.primaryQuestion),
      category: this.surveyCategory,
      allow_multiple: this.primaryQuestion.allowMultiple
    };
  }
}
