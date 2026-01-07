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
export class Navbar implements OnInit {
  // Added X and AlertTriangle icons
  readonly icons = { LogOut, User, LayoutGrid, X, AlertTriangle };
  
  isLoggedIn = false;
  username = '';
  showLogoutConfirm = false; // Controls the modal visibility

  constructor(
    private authService: AuthService, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
      if (status) {
        this.username = this.authService.getUsername();
      }
    });
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
    this.showLogoutConfirm = false;
    this.authService.logout();
    this.router.navigate(['/']);
  }
}