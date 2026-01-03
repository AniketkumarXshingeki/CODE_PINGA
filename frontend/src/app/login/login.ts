import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule,FormBuilder,FormGroup,Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Mail, User, Lock, ArrowRight, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule,RouterModule,CommonModule,LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
authForm!: FormGroup;
  currentStep: number = 1; // Step 1: Email/Pass, Step 2: Username
  isLoginMode = true;
  readonly icons = { Mail, Lock, User, ArrowRight, CheckCircle };

  constructor(private fb: FormBuilder, private router: Router) {
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
    // window.location.href = `http://localhost:3000/auth/${platform}`;
  }
  // Called when Step 1 is submitted
  goToNextStep() {
    if (this.authForm.get('email')?.valid && this.authForm.get('password')?.valid) {
      // Here you could call NestJS to check if email already exists
      // this.authService.checkEmail(this.authForm.value.email).subscribe(...)
      
      this.currentStep = 2;
      this.authForm.get('username')?.setValidators([Validators.required, Validators.minLength(3)]);
      this.authForm.get('username')?.updateValueAndValidity();
    }
  }

  onSubmit() {
    if (this.authForm.valid) {
      console.log('Final Registration:', this.authForm.value);
      // Final call to NestJS to create the user
    }
  }
}
