import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router, ActivatedRoute, NavigationEnd } from '@angular/router'; 
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { NotificationContainerComponent } from './components/notification-container/notification-container.component';
import { ConfirmContainerComponent } from './components/confirm-container/confirm-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, NotificationContainerComponent, ConfirmContainerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isLogged: boolean = false;
  title = 'picanteria-web';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.authService.loggedIn$.subscribe(loggedIn => {
      this.isLogged = loggedIn;
      this.updateRoles();
    });
    this.updateRoles();
  }

  updateRoles() {
    // No longer needed to manually update properties, getters handle it
  }

  get isAdmin(): boolean { return this.authService.isAdmin(); }
  get isCocinero(): boolean { return this.authService.isCocinero(); }
  get username(): string | null { return this.authService.getUsername(); }

  onLogOut(): void {
    this.authService.logout();
  }
}