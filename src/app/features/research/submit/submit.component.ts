import { Component, signal, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ResearchService } from '@core/services/research.service';
import { ToastService } from '@core/services/toast.service';
import { SidebarComponent } from '@shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-submit',
  standalone: true,
  imports: [ReactiveFormsModule, SidebarComponent],
  templateUrl: './submit.component.html',
  styleUrl: './submit.component.scss'
})
export class SubmitComponent {
  private readonly fb = inject(FormBuilder);
  private readonly researchService = inject(ResearchService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    query: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
    searchTopN: [10, [Validators.min(1), Validators.max(20)]],
    rerankerTopK: [5, [Validators.min(1), Validators.max(10)]],
    retrieverTopK: [8, [Validators.min(1), Validators.max(20)]],
    refinementIterations: [2, [Validators.min(0), Validators.max(3)]],
  });

  loading = signal(false);
  showAdvanced = signal(false);

  readonly exampleQueries = [
    'What are the latest breakthroughs in quantum computing in 2025?',
    'How is AI transforming drug discovery and clinical trials?',
    'What is the current state of nuclear fusion energy research?',
    'Explain the geopolitical implications of rare earth metal supply chains.',
  ];

  get queryControl() { return this.form.get('query')!; }
  get charCount() { return this.queryControl.value?.length ?? 0; }

  useExample(q: string): void { this.form.patchValue({ query: q }); }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);

    this.researchService.submitResearch(this.form.value as any).subscribe({
      next: (response) => {
        this.toastService.success('Research started', 'Your query is being processed by the pipeline.');
        this.router.navigate(['/research', response.jobId]);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.detail ?? 'Failed to submit research query.';
        this.toastService.error('Submission failed', msg);
      }
    });
  }
}
