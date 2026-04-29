import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, interval, switchMap, takeWhile, startWith } from 'rxjs';
import { environment } from '@env/environment';
import {
  ResearchRequest, JobSubmittedResponse, JobStatusResponse,
  PageResponse, JobEvent, AdminStats
} from '@core/models/models';

@Injectable({ providedIn: 'root' })
export class ResearchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/research`;

  submitResearch(request: ResearchRequest): Observable<JobSubmittedResponse> {
    return this.http.post<JobSubmittedResponse>(this.baseUrl, request);
  }

  getJobStatus(jobId: string): Observable<JobStatusResponse> {
    return this.http.get<JobStatusResponse>(`${this.baseUrl}/${jobId}`);
  }

  getJobHistory(page = 0, size = 20): Observable<PageResponse<JobStatusResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');
    return this.http.get<PageResponse<JobStatusResponse>>(
      `${this.baseUrl}/history`, { params }
    );
  }

  cancelJob(jobId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${jobId}`);
  }

  /**
   * Poll job status until terminal state.
   * Fallback when SSE is not available.
   */
  pollJobUntilComplete(jobId: string): Observable<JobStatusResponse> {
    return interval(environment.pollingInterval).pipe(
      startWith(0),
      switchMap(() => this.getJobStatus(jobId)),
      takeWhile(
        job => job.status === 'CREATED' || job.status === 'IN_PROGRESS',
        true  // emit the terminal state too
      )
    );
  }

  /**
   * Subscribe to SSE stream for real-time job updates.
   */
  streamJobEvents(jobId: string): Observable<JobEvent> {
    return new Observable<JobEvent>(observer => {
      const token = localStorage.getItem('rai_access_token');
      const url = `${environment.apiBaseUrl}/v1/research/${jobId}/stream`;

      // EventSource doesn't support custom headers natively.
      // We append token as query param; Spring Security must allow this.
      const source = new EventSource(`${url}?token=${token}`);

      source.addEventListener('in_progress', (e: MessageEvent) => {
        observer.next(JSON.parse(e.data) as JobEvent);
      });

      source.addEventListener('completed', (e: MessageEvent) => {
        observer.next(JSON.parse(e.data) as JobEvent);
        source.close();
        observer.complete();
      });

      source.addEventListener('failed', (e: MessageEvent) => {
        observer.next(JSON.parse(e.data) as JobEvent);
        source.close();
        observer.complete();
      });

      source.addEventListener('cancelled', (e: MessageEvent) => {
        observer.next(JSON.parse(e.data) as JobEvent);
        source.close();
        observer.complete();
      });

      source.onerror = () => {
        source.close();
        observer.error(new Error('SSE connection failed'));
      };

      return () => source.close();
    });
  }

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(
      `${environment.apiBaseUrl}/v1/admin/stats`
    );
  }
}
