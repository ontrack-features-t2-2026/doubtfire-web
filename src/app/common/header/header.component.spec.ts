import {MediaObserver} from 'ng-flex-layout';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {of} from 'rxjs';
import {AuthenticationService} from 'src/app/api/models/doubtfire-model';
import {SidekiqJobService} from 'src/app/api/services/sidekiq-job.service';
import {UserService} from 'src/app/api/services/user.service';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {GlobalStateService} from 'src/app/projects/states/index/global-state.service';
import {CheckForUpdateService} from 'src/app/sessions/service-worker-updater/check-for-update.service';
import {AboutDoubtfireModal} from '../modals/about-doubtfire-modal/about-doubtfire-modal.component';
import {CalendarModalService} from '../modals/calendar-modal/calendar-modal.service';
import {QrModalService} from '../modals/qr-modal/qr-modal.service';
import {SidekiqJobsModalService} from '../modals/sidekiq-jobs-modal/sidekiq-jobs-modal.service';
import {TutorNotesModalService} from '../modals/tutor-notes-modal/tutor-notes-modal.service';
import {IsActiveUnitRole} from '../pipes/is-active-unit-role.pipe';
import {HeaderComponent} from './header.component';

const emptyProvider = {};

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      providers: [
        {provide: CalendarModalService, useValue: emptyProvider},
        {provide: AboutDoubtfireModal, useValue: emptyProvider},
        {provide: IsActiveUnitRole, useValue: emptyProvider},
        {provide: CheckForUpdateService, useValue: emptyProvider},
        {provide: GlobalStateService, useValue: emptyProvider},
        {provide: UserService, useValue: emptyProvider},
        {provide: AuthenticationService, useValue: emptyProvider},
        {provide: MediaObserver, useValue: emptyProvider},
        {provide: DoubtfireConstants, useValue: emptyProvider},
        {provide: SidekiqJobService, useValue: emptyProvider},
        {provide: SidekiqJobsModalService, useValue: emptyProvider},
        {provide: QrModalService, useValue: emptyProvider},
        {provide: Router, useValue: emptyProvider},
        {provide: TutorNotesModalService, useValue: emptyProvider},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(HeaderComponent, {set: {template: ''}})
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('calendar entry point', () => {
    const calendarButtonSelector = 'button[aria-label="Open your calendar subscription settings"]';
    let calendarModalServiceStub: {show: ReturnType<typeof vi.fn>};
    let mediaObserverStub: {isActive: ReturnType<typeof vi.fn>};

    beforeEach(async () => {
      TestBed.resetTestingModule();
      calendarModalServiceStub = {show: vi.fn()};
      mediaObserverStub = {isActive: vi.fn().mockReturnValue(false)};

      await TestBed.configureTestingModule({
        declarations: [HeaderComponent],
        imports: [
          MatButtonModule,
          MatIconModule,
          MatMenuModule,
          MatToolbarModule,
          MatTooltipModule,
          NoopAnimationsModule,
        ],
        providers: [
          {provide: CalendarModalService, useValue: calendarModalServiceStub},
          {provide: AboutDoubtfireModal, useValue: emptyProvider},
          {provide: IsActiveUnitRole, useValue: emptyProvider},
          {provide: CheckForUpdateService, useValue: emptyProvider},
          {
            provide: GlobalStateService,
            useValue: {
              showHideHeader: of(true),
              unitRolesSubject: of(null),
              projectsSubject: of(null),
              currentViewAndEntitySubject$: of(undefined),
            },
          },
          {provide: UserService, useValue: {currentUser: {role: 'Student', username: 'student_1'}}},
          {provide: AuthenticationService, useValue: emptyProvider},
          {provide: MediaObserver, useValue: mediaObserverStub},
          {
            provide: DoubtfireConstants,
            useValue: {
              ExternalName: of('Doubtfire'),
              LogoSettings: of({
                hasLogo: false,
                logoLinkUrl: '/assets/images/institution-logo.png',
                logoUrl: null,
              }),
            },
          },
          {provide: SidekiqJobService, useValue: {sidekiqJobsSubject: of([])}},
          {provide: SidekiqJobsModalService, useValue: emptyProvider},
          {provide: QrModalService, useValue: emptyProvider},
          {provide: Router, useValue: emptyProvider},
          {provide: TutorNotesModalService, useValue: emptyProvider},
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();

      fixture = TestBed.createComponent(HeaderComponent);
      component = fixture.componentInstance;
    });

    it('renders the calendar button in the header', () => {
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector(calendarButtonSelector);

      expect(button).not.toBeNull();
    });

    it('keeps the compact mobile toolbar clear and leaves calendar access in the account menu', () => {
      mediaObserverStub.isActive.mockImplementation((alias: string) => alias === 'xs');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector(calendarButtonSelector);

      expect(button).toBeNull();
    });

    it('clicking the calendar button invokes the same handler the avatar menu Calendar item uses', () => {
      const openCalendarSpy = vi.spyOn(component, 'openCalendar');
      fixture.detectChanges();

      const button: HTMLButtonElement = fixture.nativeElement.querySelector(calendarButtonSelector);
      button.click();

      expect(openCalendarSpy).toHaveBeenCalledOnce();
      expect(calendarModalServiceStub.show).toHaveBeenCalledOnce();
    });
  });
});
