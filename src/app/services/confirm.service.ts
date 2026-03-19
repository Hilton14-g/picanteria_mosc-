import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmDialog {
  id: string;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private dialogs: BehaviorSubject<ConfirmDialog[]> = new BehaviorSubject<ConfirmDialog[]>([]);
  
  getDialogs(): Observable<ConfirmDialog[]> {
    return this.dialogs.asObservable();
  }

  confirm(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }): Promise<boolean> {
    return new Promise((resolve) => {
      const dialog: ConfirmDialog = {
        id: this.generateId(),
        title: options.title || '',
        message: options.message,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'warning',
        onConfirm: () => {
          this.removeDialog(dialog.id);
          resolve(true);
        },
        onCancel: () => {
          this.removeDialog(dialog.id);
          resolve(false);
        }
      };

      const currentDialogs = [...this.dialogs.value];
      currentDialogs.push(dialog);
      this.dialogs.next(currentDialogs);
    });
  }

  private removeDialog(id: string): void {
    const currentDialogs = this.dialogs.value.filter(d => d.id !== id);
    this.dialogs.next(currentDialogs);
  }

  private generateId(): string {
    return `confirm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
