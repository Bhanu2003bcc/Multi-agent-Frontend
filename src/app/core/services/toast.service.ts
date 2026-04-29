import { Injectable, signal } from '@angular/core';
import { ToastMessage } from '@core/models/models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(type: ToastMessage['type'], title: string, message?: string, duration = 5000): void {
    const toast: ToastMessage = {
      id: crypto.randomUUID(),
      type, title, message, duration
    };
    this._toasts.update(t => [...t, toast]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(toast.id), duration);
    }
  }

  success(title: string, message?: string): void { this.show('success', title, message); }
  error(title: string, message?: string): void    { this.show('error', title, message, 8000); }
  warning(title: string, message?: string): void  { this.show('warning', title, message); }
  info(title: string, message?: string): void     { this.show('info', title, message); }

  dismiss(id: string): void {
    this._toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
