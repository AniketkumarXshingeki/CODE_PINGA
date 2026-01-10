import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule,FormBuilder,FormGroup,Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Mail, User, Lock, ArrowRight, CheckCircle } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule,RouterModule,CommonModule,LucideAngularModule,HttpClientModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  errorMessage: string = '';
authForm!: FormGroup;
  currentStep: number = 1; // Step 1: Email/Pass, Step 2: Username
  isLoginMode = true;
  readonly icons = { Mail, Lock, User, ArrowRight, CheckCircle };

  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient, private authService: AuthService) {
    this.isLoginMode = this.router.url.includes('login');
  }

  ngOnInit(): void {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      username: ['', []] // Optional at first
    });
  }
  socialLogin(platform: string) {
    console.log(`Authenticating with ${platform}...`);
  }
  // Called when Step 1 is submitted
goToNextStep() {
  const emailControl = this.authForm.get('email');
  const passwordControl = this.authForm.get('password');

  if (emailControl?.valid && passwordControl?.valid) {
    this.errorMessage = ''; // Clear any previous errors

    // Call backend to check if email is available
    this.authService.checkEmail(emailControl.value).subscribe({
      next: (response) => {
        // If successful, the email is available
        this.currentStep = 2;
        
        // Now that we are in Step 2, make username required
        const usernameControl = this.authForm.get('username');
        usernameControl?.setValidators([Validators.required, Validators.minLength(3)]);
        usernameControl?.updateValueAndValidity();
      },
      error: (err) => {
        // If the backend returns a 409 Conflict (or similar), show error
        this.errorMessage = err.error.message || 'This email is already registered.';
        console.error('Email check failed', err);
      }
    });
  } else {
    this.errorMessage = 'Please provide a valid email and password.';
  }
}

onSubmit() {
  if (this.authForm.valid || (this.isLoginMode && this.authForm.get('email')?.valid && this.authForm.get('password')?.valid)) {
    this.errorMessage = '';

    // Create a clean data object
    let payload;
    
    if (this.isLoginMode) {
      // Send ONLY email and password for login
      payload = {
        email: this.authForm.value.email,
        password: this.authForm.value.password
      };
    } else {
      // Send all fields for registration
      payload = this.authForm.value;
    }

    const request = this.isLoginMode 
      ? this.authService.login(payload) 
      : this.authService.register(payload);

    request.subscribe({
      next: (response) => {
        console.log('Success:', response);
        localStorage.setItem('access_token', response.access_token);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Server Error:', err);
        this.errorMessage = err.error.message || 'Authentication failed.';
      }
    });
  }
}
}
