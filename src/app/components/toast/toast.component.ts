import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Notification } from '../../services/notification.service';
import { NotificationService } from '../../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() notification!: Notification;
  isVisible = false;
  private removeTimer: any;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Trigger entrance animation
    setTimeout(() => {
      this.isVisible = true;
    }, 10);

    // Set auto-remove timer
    if (this.notification.duration && this.notification.duration > 0) {
      this.removeTimer = setTimeout(() => {
        this.close();
      }, this.notification.duration);
    }
  }

  ngOnDestroy(): void {
    if (this.removeTimer) {
      clearTimeout(this.removeTimer);
    }
  }

  close(): void {
    this.isVisible = false;
    // Allow exit animation to complete before removing
    setTimeout(() => {
      this.notificationService.removeNotification(this.notification.id);
    }, 300);
  }

  getIcon(): string {
    switch (this.notification.type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }

  getIconColor(): string {
    switch (this.notification.type) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196f3';
      default:
        return '#2196f3';
    }
  }

  getBorderColor(): string {
    switch (this.notification.type) {
      case 'success':
        return 'rgba(76, 175, 80, 0.3)';
      case 'error':
        return 'rgba(244, 67, 54, 0.3)';
      case 'warning':
        return 'rgba(255, 152, 0, 0.3)';
      case 'info':
        return 'rgba(33, 150, 243, 0.3)';
      default:
        return 'rgba(33, 150, 243, 0.3)';
    }
  }
}
