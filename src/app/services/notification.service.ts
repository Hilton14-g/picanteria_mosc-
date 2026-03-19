import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: BehaviorSubject<Notification[]> = new BehaviorSubject<Notification[]>([]);
  
  constructor() {}

  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }

  showSuccess(title: string, message?: string, duration: number = 4000): void {
    this.addNotification('success', title, message, duration);
  }

  showError(title: string, message?: string, duration: number = 5000): void {
    this.addNotification('error', title, message, duration);
  }

  showWarning(title: string, message?: string, duration: number = 4000): void {
    this.addNotification('warning', title, message, duration);
  }

  showInfo(title: string, message?: string, duration: number = 3000): void {
    this.addNotification('info', title, message, duration);
  }

  private addNotification(type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string, duration?: number): void {
    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      message,
      duration,
      timestamp: Date.now()
    };

    const currentNotifications = [...this.notifications.value];
    currentNotifications.push(notification);
    this.notifications.next(currentNotifications);

    // Auto-remove after duration
    const notificationDuration = duration || 4000;
    if (notificationDuration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notificationDuration);
    }
  }

  removeNotification(id: string): void {
    const currentNotifications = this.notifications.value.filter(n => n.id !== id);
    this.notifications.next(currentNotifications);
  }

  clearAll(): void {
    this.notifications.next([]);
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
