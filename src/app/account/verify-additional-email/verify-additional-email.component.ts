import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AdditionalNotificationEmailService} from 'src/app/api/services/additional-notification-email.service';
import {AuthenticationService} from 'src/app/api/services/authentication.service';
import {consumeAdditionalEmailVerificationToken} from 'src/app/security/additional-email-verification-callback';
import {AuthReturnUrlService} from 'src/app/security/auth-return-url.service';

type VerificationState = 'verifying' | 'verified' | 'error';

@Component({
  selector: 'f-verify-additional-email',
  templateUrl: './verify-additional-email.component.html',
  styleUrl: './verify-additional-email.component.scss',
  standalone: false,
})
export class VerifyAdditionalEmailComponent implements OnInit {
  public state: VerificationState = 'verifying';
  public message = 'Verifying your additional notification email…';

  constructor(
    private additionalEmailService: AdditionalNotificationEmailService,
    private authentication: AuthenticationService,
    private router: Router,
    private authReturnUrl: AuthReturnUrlService,
  ) {}

  public openProfile(): void {
    if (this.authentication.isAuthenticated()) {
      void this.router.navigateByUrl('/edit_profile');
    } else {
      this.authReturnUrl.remember('/edit_profile');
      void this.router.navigateByUrl('/sign_in');
    }
  }

  public ngOnInit(): void {
    const token = consumeAdditionalEmailVerificationToken();
    if (!token) {
      this.state = 'error';
      this.message = 'This verification link is incomplete.';
      return;
    }

    this.additionalEmailService.verify(token).subscribe({
      next: () => {
        this.state = 'verified';
        this.message = 'Your additional notification email is verified.';
      },
      error: () => {
        this.state = 'error';
        this.message = 'This verification link is invalid, expired, or has already been used.';
      },
    });
  }
}
