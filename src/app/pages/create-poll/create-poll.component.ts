import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PollService } from '../../core/services/poll.service';

@Component({
  selector: 'app-create-poll',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-poll.component.html',
  styleUrl: './create-poll.component.scss'
})
export class CreatePollComponent {
  title = '';
  description = '';
  deadline = '';
  category = 'Allgemein';
  options = ['', ''];

  loading = false;
  error = '';

  constructor(
    private pollService: PollService,
    private router: Router
  ) {}

  addOption(): void {
    this.options.push('');
  }

  removeOption(index: number): void {
    if (this.options.length <= 2) {
      return;
    }

    this.options.splice(index, 1);
  }

  async submit(): Promise<void> {
    const cleanedOptions = this.options
      .map((option) => option.trim())
      .filter((option) => option.length > 0);

    if (!this.title.trim() || !this.deadline || cleanedOptions.length < 2) {
      this.error = 'Bitte Titel, Deadline und mindestens 2 Optionen ausfüllen.';
      return;
    }

    try {
      this.loading = true;
      this.error = '';

      const pollId = await this.pollService.createPoll({
        title: this.title.trim(),
        description: this.description.trim(),
        deadline: this.deadline,
        category: this.category.trim(),
        options: cleanedOptions
      });

      await this.router.navigate(['/poll', pollId]);
    } catch {
      this.error = 'Die Umfrage konnte nicht erstellt werden.';
    } finally {
      this.loading = false;
    }
  }
}