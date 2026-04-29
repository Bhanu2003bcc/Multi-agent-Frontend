import { Component, inject } from '@angular/core';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}"
             (click)="toastService.dismiss(toast.id)">
          <div class="toast__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @switch (toast.type) {
                @case ('success') {
                  <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/>
                }
                @case ('error') {
                  <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
                }
                @case ('warning') {
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                }
                @case ('info') {
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                }
              }
            </svg>
          </div>
          <div class="toast__content">
            <span class="toast__title">{{ toast.title }}</span>
            @if (toast.message) {
              <span class="toast__message">{{ toast.message }}</span>
            }
          </div>
          <button class="toast__close">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      width: calc(100vw - 3rem);
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-modal);
      cursor: pointer;
      animation: slideIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
      backdrop-filter: blur(8px);

      &--success { border-color: var(--color-success); background: color-mix(in srgb, var(--color-bg-card) 92%, var(--color-success)); }
      &--error   { border-color: var(--color-error);   background: color-mix(in srgb, var(--color-bg-card) 92%, var(--color-error)); }
      &--warning { border-color: var(--color-warning); background: color-mix(in srgb, var(--color-bg-card) 92%, var(--color-warning)); }
      &--info    { border-color: var(--color-info);    background: color-mix(in srgb, var(--color-bg-card) 92%, var(--color-info)); }
    }

    .toast__icon {
      flex-shrink: 0;
      margin-top: 1px;
      .toast--success & { color: var(--color-success); }
      .toast--error &   { color: var(--color-error); }
      .toast--warning & { color: var(--color-warning); }
      .toast--info &    { color: var(--color-info); }
    }

    .toast__content { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .toast__title   { font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); }
    .toast__message { font-size: 0.8125rem; color: var(--text-secondary); }
    .toast__close   { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.25rem; line-height: 1; flex-shrink: 0; padding: 0; &:hover { color: var(--text-primary); } }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100%); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
