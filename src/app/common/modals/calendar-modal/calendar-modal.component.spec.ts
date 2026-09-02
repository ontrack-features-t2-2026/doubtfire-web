import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ClipboardModule} from '@angular/cdk/clipboard';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTooltipModule} from '@angular/material/tooltip';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of, throwError} from 'rxjs';
import {Project, Webcal} from 'src/app/api/models/doubtfire-model';
import {ProjectService} from 'src/app/api/services/project.service';
import {WebcalService} from 'src/app/api/services/webcal.service';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {AlertService} from '../../services/alert.service';
import {ConfirmationModalService} from '../confirmation-modal/confirmation-modal.service';
import {CalendarModalComponent} from './calendar-modal.component';

function buildWebcal(): Webcal {
  const webcal = new Webcal();
  webcal.enabled = true;
  webcal.guid = 'calendar-guid';
  webcal.includeStartDates = false;
  webcal.reminder = {time: 1, unit: 'W'};
  webcal.unitExclusions = [];
  return webcal;
}

function buildProject(id: number, code: string, name: string): Project {
  return {
    id,
    unit: {
      id,
      code,
      name,
      teachingPeriod: {active: true},
    },
  } as Project;
}

describe('CalendarModalComponent', () => {
  let fixture: ComponentFixture<CalendarModalComponent>;
  let component: CalendarModalComponent;
  let webcalService: {
    get: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let projectService: {query: ReturnType<typeof vi.fn>};
  let fileDownloader: {downloadFileWithFeedback: ReturnType<typeof vi.fn>};

  beforeEach(async () => {
    webcalService = {
      get: vi.fn(() => of(buildWebcal())),
      update: vi.fn((webcal: Webcal) => of(webcal)),
    };
    projectService = {
      query: vi.fn(() =>
        of([
          buildProject(1, 'COS10001', 'Introduction to Programming'),
          buildProject(2, 'COS20007', 'Object Oriented Programming'),
        ]),
      ),
    };
    fileDownloader = {downloadFileWithFeedback: vi.fn()};

    await TestBed.configureTestingModule({
      declarations: [CalendarModalComponent],
      imports: [
        ClipboardModule,
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatCheckboxModule,
        MatChipsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatTabsModule,
        MatTooltipModule,
        NoopAnimationsModule,
      ],
      providers: [
        {provide: MAT_DIALOG_DATA, useValue: {}},
        {provide: WebcalService, useValue: webcalService},
        {provide: ProjectService, useValue: projectService},
        {provide: FileDownloaderService, useValue: fileDownloader},
        {provide: DoubtfireConstants, useValue: {API_URL: 'https://api.example.test/api'}},
        {provide: AlertService, useValue: {success: vi.fn(), error: vi.fn()}},
        {provide: ConfirmationModalService, useValue: {show: vi.fn()}},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarModalComponent);
    component = fixture.componentInstance;
  });

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('renders wrapped unit controls and one grammatical reminder group', async () => {
    await render();

    const chips: HTMLElement = fixture.nativeElement.querySelector('.calendar-unit-chips');
    const reminder: HTMLElement = fixture.nativeElement.querySelector('.calendar-reminder-group');
    const reminderText = reminder.textContent.replace(/\s+/g, ' ').trim();

    expect(chips.textContent).toContain('COS10001 Introduction to Programming');
    expect(chips.textContent).toContain('COS20007 Object Oriented Programming');
    expect(reminder.querySelector('legend')?.textContent).toContain('Event reminder');
    expect(reminderText).toMatch(/Remind me.*Amount.*Time unit.*before each event\./);
    expect(reminder.querySelector('input[aria-label="Reminder amount"]')).not.toBeNull();
    expect(reminder.querySelector('[aria-label="Reminder time unit"]')).not.toBeNull();
  });

  it('keeps all provider tabs visible and switches to provider-specific instructions', async () => {
    await render();

    const host: HTMLElement = fixture.nativeElement;
    const tabLabels = Array.from(host.querySelectorAll<HTMLElement>('.mat-mdc-tab')).map((tab) =>
      tab.textContent.trim(),
    );

    expect(tabLabels).toEqual(['Google', 'Apple', 'Outlook']);

    component.selectedCalendarProviderIndex = 2;
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.calendar-provider-help__instructions').textContent,
    ).toContain('Subscribe from web');
  });

  it('uses the shared download feedback helper with a useful ICS filename', async () => {
    await render();

    component.downloadCalendar();

    expect(fileDownloader.downloadFileWithFeedback).toHaveBeenCalledWith(
      'https://api.example.test/api/webcal/calendar-guid',
      'OnTrack-calendar.ics',
      {requestKey: 'web-calendar-ics'},
    );
  });

  it('does not start an ICS download before a calendar URL exists', () => {
    component.webcal = null;

    component.downloadCalendar();

    expect(fileDownloader.downloadFileWithFeedback).not.toHaveBeenCalled();
  });

  it('finishes a failed initial load with a retry action instead of a permanent spinner', async () => {
    webcalService.get.mockReturnValue(throwError(() => new Error('offline')));

    await render();

    expect(component.working).toBe(false);
    expect(component.loadError).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Calendar settings could not be loaded',
    );
    expect(
      fixture.nativeElement.querySelector('.calendar-dialog__error button').textContent,
    ).toContain('Retry');
  });

  it('gives a newly-enabled reminder complete default values before saving', async () => {
    const webcal = buildWebcal();
    webcal.reminder = null;
    webcalService.get.mockReturnValue(of(webcal));
    await render();

    component.newReminderActive = true;
    component.onToggleReminderActive();

    expect(component.newReminderTime).toBe(1);
    expect(component.newReminderUnit).toBe('W');
  });
});
