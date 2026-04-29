import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ResearchService } from '@core/services/research.service';
import { AuthService } from '@core/services/auth.service';
import { SidebarComponent } from '@shared/components/sidebar/sidebar.component';
import { JobStatusResponse, PageResponse } from '@core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly researchService = inject(ResearchService);
  private readonly authService = inject(AuthService);

  recentJobs = signal<JobStatusResponse[]>([]);
  loading = signal(true);

  readonly currentUser = this.authService.currentUser;

  stats = signal({ total: 0, completed: 0, inProgress: 0, failed: 0 });

  ngOnInit(): void {
    this.researchService.getJobHistory(0, 5).subscribe({
      next: (page) => {
        this.recentJobs.set(page.content);
        this.computeStats(page);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private computeStats(page: PageResponse<JobStatusResponse>): void {
    const jobs = page.content;
    this.stats.set({
      total: page.totalElements,
      completed: jobs.filter(j => j.status === 'COMPLETED').length,
      inProgress: jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'CREATED').length,
      failed: jobs.filter(j => j.status === 'FAILED').length,
    });
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }

  elapsedLabel(job: JobStatusResponse): string {
    if (!job.elapsedMs) return '—';
    const s = Math.round(job.elapsedMs / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  }
}
