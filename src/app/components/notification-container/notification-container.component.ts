import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';
import { Notification } from '../../services/notification.service';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  template: `
    <div class="notification-container">
      <app-toast 
        *ngFor="let notification of notifications$ | async"
        [notification]="notification">
      </app-toast>
    </div>
  `,
  styleUrls: ['./notification-container.component.css']
})
export class NotificationContainerComponent {
  notifications$: Observable<Notification[]>;

  constructor(private notificationService: NotificationService) {
    this.notifications$ = notificationService.getNotifications();
  }
}
