import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { Subscription, catchError } from 'rxjs';
import { ResearchService } from '@core/services/research.service';
import { ToastService } from '@core/services/toast.service';
import { SidebarComponent } from '@shared/components/sidebar/sidebar.component';
import { JobStatusResponse, JobStatus, ResearchResult } from '@core/models/models';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [RouterLink, SidebarComponent, DecimalPipe, SlicePipe],
  templateUrl: './result.component.html',
  styleUrl: './result.component.scss'
})
export class ResultComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly researchService = inject(ResearchService);
  private readonly toastService = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);

  job = signal<JobStatusResponse | null>(null);
  loading = signal(true);
  cancelling = signal(false);
  activeTab = signal<'answer' | 'sources' | 'analysis'>('answer');

  private sub = new Subscription();

  // ── Computed helpers ────────────────────────────────────────────────────────
  readonly status = computed<JobStatus | null>(() => this.job()?.status ?? null);

  readonly isActive = computed(() => {
    const s = this.status();
    return s === 'CREATED' || s === 'IN_PROGRESS';
  });

  readonly isCompleted  = computed(() => this.status() === 'COMPLETED');
  readonly isFailed     = computed(() => this.status() === 'FAILED');
  readonly isCancelled  = computed(() => this.status() === 'CANCELLED');

  readonly result = computed<ResearchResult | null>(() => this.job()?.result ?? null);

  readonly renderedAnswer = computed<SafeHtml>(() => {
    const answer = this.result()?.answer;
    if (!answer) return '';
    const raw = marked.parse(answer) as string;
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  });

  readonly confidencePct = computed(() =>
    Math.round((this.result()?.confidence ?? 0) * 100)
  );

  readonly confidenceColor = computed(() => {
    const pct = this.confidencePct();
    if (pct >= 80) return 'var(--color-success)';
    if (pct >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  });

  // SVG circle progress for confidence ring
  readonly circumference = 2 * Math.PI * 36; // r=36
  readonly strokeDashoffset = computed(() => {
    const pct = this.confidencePct() / 100;
    return this.circumference * (1 - pct);
  });

  readonly elapsedLabel = computed(() => {
    const ms = this.job()?.elapsedMs;
    if (!ms) return null;
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  });

  readonly domainList = computed(() => {
    return (this.result()?.sources ?? []).map(url => {
      try { return new URL(url).hostname.replace('www.', ''); }
      catch { return url; }
    });
  });

  readonly pipelineStages = [
    { key: 'search',   label: 'Search',   desc: 'Exa API real-time results' },
    { key: 'rerank',   label: 'Re-rank',  desc: 'Cross-encoder scoring' },
    { key: 'read',     label: 'Read',     desc: 'Web page extraction' },
    { key: 'embed',    label: 'Embed',    desc: 'FAISS vector indexing' },
    { key: 'retrieve', label: 'Retrieve', desc: 'Semantic chunk retrieval' },
    { key: 'write',    label: 'Write',    desc: 'LLM answer synthesis' },
    { key: 'critique', label: 'Critique', desc: 'Quality evaluation' },
    { key: 'refine',   label: 'Refine',   desc: 'Iterative improvement' },
  ];

  constructor() {
    // Configure marked for safe HTML output
    marked.setOptions({ breaks: true, gfm: true });
  }

  ngOnInit(): void {
    const jobId = this.route.snapshot.paramMap.get('jobId')!;

    this.researchService.getJobStatus(jobId).subscribe({
      next: (job) => {
        this.job.set(job);
        this.loading.set(false);

        if (job.status === 'CREATED' || job.status === 'IN_PROGRESS') {
          this.startLiveTracking(jobId);
        }
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Not found', 'This research job could not be loaded.');
        this.router.navigate(['/research/history']);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  setTab(tab: 'answer' | 'sources' | 'analysis'): void {
    this.activeTab.set(tab);
  }

  cancelJob(): void {
    const jobId = this.job()?.jobId;
    if (!jobId || this.cancelling()) return;
    this.cancelling.set(true);

    this.researchService.cancelJob(jobId).subscribe({
      next: () => {
        this.toastService.info('Job cancelled');
        this.job.update(j => j ? { ...j, status: 'CANCELLED' } : j);
        this.cancelling.set(false);
      },
      error: () => this.cancelling.set(false)
    });
  }

  scoreColor(score: number): string {
    if (score >= 0.8) return 'var(--color-success)';
    if (score >= 0.6) return 'var(--color-warning)';
    return 'var(--color-error)';
  }

  scoreLabel(score: number): string {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  copyAnswer(): void {
    const text = this.result()?.answer ?? '';
    navigator.clipboard.writeText(text).then(() =>
      this.toastService.success('Copied', 'Answer copied to clipboard.')
    );
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private startLiveTracking(jobId: string): void {
    const stream$ = this.researchService.streamJobEvents(jobId).pipe(
      catchError(() => {
        return this.researchService.pollJobUntilComplete(jobId);
      })
    );

    this.sub.add(
      stream$.subscribe({
        next: (eventOrJob: any) => {
          if ('result' in eventOrJob && eventOrJob.status) {
            this.job.update(j => j ? {
              ...j,
              status: eventOrJob.status,
              result: eventOrJob.result ?? j.result,
              completedAt: eventOrJob.timestamp ?? j.completedAt,
            } : j);
          } else {
            this.job.set(eventOrJob);
          }
        },
        error: () => {
          this.toastService.error('Connection lost', 'Could not track live progress.');
        }
      })
    );
  }
}
