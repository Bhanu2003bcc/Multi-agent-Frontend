import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ResearchService } from '@core/services/research.service';
import { ToastService } from '@core/services/toast.service';
import { SidebarComponent } from '@shared/components/sidebar/sidebar.component';
import { JobStatusResponse, PageResponse } from '@core/models/models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [RouterLink, SidebarComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit {
  private readonly researchService = inject(ResearchService);
  private readonly toastService = inject(ToastService);

  page = signal<PageResponse<JobStatusResponse> | null>(null);
  loading = signal(true);
  currentPage = signal(0);
  readonly pageSize = 20;

  ngOnInit(): void { this.loadPage(0); }

  loadPage(pageNum: number): void {
    this.loading.set(true);
    this.researchService.getJobHistory(pageNum, this.pageSize).subscribe({
      next: (p) => {
        this.page.set(p);
        this.currentPage.set(pageNum);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Failed to load history');
      }
    });
  }

  prevPage(): void { if (this.currentPage() > 0) this.loadPage(this.currentPage() - 1); }
  nextPage(): void {
    const p = this.page();
    if (p && !p.last) this.loadPage(this.currentPage() + 1);
  }

  get pages(): number[] {
    const total = this.page()?.totalPages ?? 0;
    return Array.from({ length: Math.min(total, 7) }, (_, i) => i);
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  elapsedLabel(ms?: number): string {
    if (!ms) return '—';
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  trackById(_: number, job: JobStatusResponse): string { return job.jobId; }

  confidenceColor(score: number): string {
    if (score >= 0.8) return "var(--color-success)";
    if (score >= 0.6) return "var(--color-warning)";
    return "var(--color-error)";
  }
}
