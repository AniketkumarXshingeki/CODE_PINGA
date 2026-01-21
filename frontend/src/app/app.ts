import { Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Navbar } from './navbar/navbar';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,Navbar,CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
showNavbar: boolean = true;

  constructor(private router: Router,private authService: AuthService, @Inject (PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {

if (isPlatformBrowser(this.platformId)) {
      this.authService.checkAuth().subscribe();
    }

    this.router.events.pipe(
      // Only listen for the end of a navigation cycle
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Define the routes where the navbar should be HIDDEN
      const hideOnRoutes = ['/login', '/play', '/register','/player'];
      
      // Check if current URL is in our list
      this.showNavbar = !hideOnRoutes.includes(event.urlAfterRedirects);
    });
  }
}
