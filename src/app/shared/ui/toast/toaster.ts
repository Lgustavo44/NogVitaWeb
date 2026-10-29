import { Service, signal } from '@angular/core';

export type ToastTone = 'success' | 'danger' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

const DURATION_MS = 4000;

/** Avisos curtos que somem sozinhos ("Perfil salvo."). O container fica no App. */
@Service()
export class Toaster {
  private nextId = 0;
  readonly toasts = signal<Toast[]>([]);

  show(message: string, tone: ToastTone = 'success'): void {
    const toast: Toast = { id: this.nextId++, tone, message };
    this.toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), DURATION_MS);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }
}
