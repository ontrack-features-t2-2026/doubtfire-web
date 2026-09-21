import {HttpClient} from '@angular/common/http';
import '@angular/compiler';
import {Component, inject} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {Router, RouterOutlet, provideRouter} from '@angular/router';
import {BehaviorSubject, of} from 'rxjs';
import {AuthenticationService} from './src/app/api/services/authentication.service';
import {UserService} from './src/app/api/services/user.service';
import {DoubtfireConstants} from './src/app/config/constants/doubtfire-constants';
import {GlobalStateService} from './src/app/projects/states/index/global-state.service';
import {StudentOnboardingComponent} from './src/app/student-onboarding/student-onboarding.component';
import {StudentOnboardingService} from './src/app/student-onboarding/student-onboarding.service';

const params = new URLSearchParams(location.search);
const user = {id: 100001, role: params.get('role') ?? 'Student', hasRunFirstTimeSetup: false};
const globals = {
  isLoadingSubject: new BehaviorSubject(true),
  currentUserProjects: {currentValues: params.has('noUnits') ? [] : [{}]},
};
const settings = {IsTutorialEnabled: new BehaviorSubject(!params.has('disabled'))};
@Component({selector: 'preview-page', template: ''})
class PreviewPage {}
@Component({
  selector: 'preview-root',
  imports: [StudentOnboardingComponent, RouterOutlet],
  template: ` <header class="qa-toolbar">
      <button
        data-onboarding-target="unit-selector"
        (click)="router.navigateByUrl('/projects/1/dashboard')"
      >
        Select Unit (demo)
      </button>
      @if (router.url.includes('/projects')) {
        <button
          data-onboarding-target="task-dashboard"
          (click)="router.navigateByUrl('/projects/1/dashboard')"
        >
          Dashboard
        </button>
      }
      <button data-onboarding-target="calendar" (click)="calendarOpen = !calendarOpen">
        Calendar
      </button>
      <button
        data-onboarding-target="account-menu"
        [disabled]="!tour.available"
        (click)="tour.replay()"
      >
        Tutorial and Help
      </button>
    </header>
    <main class="qa-main" tabindex="-1">
      <h1>Synthetic OnTrack tutorial QA</h1>
      <p>
        This harness mounts the production tutorial component and state service with synthetic
        account and enrolment responses. Surrounding controls are demo targets. It does not exercise
        the full application or a real API.
      </p>
      <div class="qa-controls">
        <button (click)="completeProfile()">Complete profile setup</button
        ><button (click)="settings.IsTutorialEnabled.next(false)">Disable tutorial</button
        ><button (click)="router.navigateByUrl('/home')">Home</button
        ><button (click)="reset()">Reset demo progress</button>
      </div>
      @if (router.url.includes('/projects') && !missing) {
        <h2>Demo dashboard</h2>
        <p>Task list and progress would be shown here.</p>
        <label
          >Target grade
          <select data-onboarding-target="target-grade">
            <option>Demo target</option>
            <option>Other demo target</option>
          </select></label
        >
      }
      @if (calendarOpen) {
        <h2>Calendar options (synthetic)</h2>
        <p>No subscriptions are created.</p>
      }
      <p>
        Use browser Back to test route changes. Query options: noUnits, missing, role=Tutor,
        disabled, history, storageFailure.
      </p>
    </main>
    <router-outlet /><f-student-onboarding />`,
})
class PreviewRoot {
  router = inject(Router);
  tour = inject(StudentOnboardingService);
  settings = settings;
  missing = params.has('missing');
  calendarOpen = false;
  completeProfile() {
    user.hasRunFirstTimeSetup = true;
    globals.isLoadingSubject.next(false);
    this.router.navigateByUrl('/home');
  }
  reset() {
    localStorage.removeItem('ontrack:student-onboarding:100001');
    location.reload();
  }
}
if (params.has('storageFailure')) {
  Object.defineProperty(window, 'localStorage', {
    get() {
      throw new Error('Synthetic blocked storage');
    },
  });
}
bootstrapApplication(PreviewRoot, {
  providers: [
    provideRouter([{path: '**', component: PreviewPage}]),
    provideAnimationsAsync(),
    {provide: UserService, useValue: {currentUser: user}},
    {provide: AuthenticationService, useValue: {isAuthenticated: () => true}},
    {provide: GlobalStateService, useValue: globals},
    {provide: DoubtfireConstants, useValue: settings},
    {provide: HttpClient, useValue: {get: () => of({hasProjects: params.has('history')})}},
  ],
});
