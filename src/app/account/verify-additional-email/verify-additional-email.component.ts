import {Component, OnInit} from '@angular/core';
import {AdditionalNotificationEmailService} from 'src/app/api/services/additional-notification-email.service';
import {consumeAdditionalEmailVerificationToken} from 'src/app/security/additional-email-verification-callback';

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

  constructor(private additionalEmailService: AdditionalNotificationEmailService) {}

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
