import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmDialog } from '../../services/confirm.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-confirm-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-container">
      <div 
        *ngFor="let dialog of dialogs$ | async" 
        class="confirm-overlay show"
        [class.danger]="dialog.type === 'danger'"
        [class.warning]="dialog.type === 'warning'"
        [class.info]="dialog.type === 'info'">
        
        <div class="confirm-dialog">
          <div class="confirm-header" *ngIf="dialog.title">
            <h3>{{ dialog.title }}</h3>
          </div>
          
          <div class="confirm-body" [class.no-title]="!dialog.title">
            <p>{{ dialog.message }}</p>
          </div>
          
          <div class="confirm-actions">
            <button class="btn-cancel" (click)="dialog.onCancel?.()">
              {{ dialog.cancelText }}
            </button>
            <button class="btn-confirm" [class.danger]="dialog.type === 'danger'" (click)="dialog.onConfirm()">
              {{ dialog.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./confirm-container.component.css']
})
export class ConfirmContainerComponent {
  dialogs$: Observable<ConfirmDialog[]>;

  constructor(private confirmService: ConfirmService) {
    this.dialogs$ = confirmService.getDialogs();
  }
}
