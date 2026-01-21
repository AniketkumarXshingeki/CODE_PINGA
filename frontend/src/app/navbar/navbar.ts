import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core'; // Added Inject & PLATFORM_ID
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, LogOut, User, LayoutGrid, X, AlertTriangle } from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, LucideAngularModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar {
  // Added X and AlertTriangle icons
  readonly icons = { LogOut, User, LayoutGrid, X, AlertTriangle };
  

  showLogoutConfirm = false; // Controls the modal visibility

  constructor(
    private authService: AuthService, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  get username(): string {
    return this.authService.username;
  }

  // Opens the modal
  onLogoutClick(): void {
    this.showLogoutConfirm = true;
  }

  // Closes the modal
  cancelLogout(): void {
    this.showLogoutConfirm = false;
  }

  // The actual logout logic
confirmLogout(): void {
    // We must subscribe because it sends a POST request to the backend now
    this.authService.logout().subscribe({
      next: () => {
        this.showLogoutConfirm = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Logout failed', err);
        this.showLogoutConfirm = false; // Close modal anyway
      }
    });
  }
}