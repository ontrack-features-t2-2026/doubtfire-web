import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {of} from 'rxjs';
import {ProjectService, Webcal, WebcalService} from 'src/app/api/models/doubtfire-model';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {FileDownloaderService} from '../../file-downloader/file-downloader.service';
import {AlertService} from '../../services/alert.service';
import {ConfirmationModalService} from '../confirmation-modal/confirmation-modal.service';
import {CalendarModalComponent} from './calendar-modal.component';

const emptyProvider = {};

describe('CalendarModalComponent', () => {
  let component: CalendarModalComponent;
  let fixture: ComponentFixture<CalendarModalComponent>;
  let fileDownloaderStub: {downloadFile: ReturnType<typeof vi.fn>};

  beforeEach(async () => {
    fileDownloaderStub = {downloadFile: vi.fn()};

    await TestBed.configureTestingModule({
      declarations: [CalendarModalComponent],
      providers: [
        {provide: WebcalService, useValue: emptyProvider},
        {provide: DoubtfireConstants, useValue: {API_URL: 'https://doubtfire.test/api'}},
        {provide: AlertService, useValue: emptyProvider},
        {provide: ProjectService, useValue: emptyProvider},
        {provide: MAT_DIALOG_DATA, useValue: emptyProvider},
        {provide: ConfirmationModalService, useValue: emptyProvider},
        {provide: FileDownloaderService, useValue: fileDownloaderStub},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(CalendarModalComponent, {set: {template: ''}})
      .compileComponents();

    fixture = TestBed.createComponent(CalendarModalComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads the feed as an .ics file when the webcal is enabled', () => {
    const webcal = new Webcal();
    webcal.enabled = true;
    webcal.guid = 'abc-123';
    component.webcal = webcal;

    component.downloadCalendar();

    expect(fileDownloaderStub.downloadFile).toHaveBeenCalledOnce();
    expect(fileDownloaderStub.downloadFile).toHaveBeenCalledWith(
      'https://doubtfire.test/api/webcal/abc-123',
      'ontrack-calendar.ics',
    );
  });

  it('does not download when the webcal is disabled', () => {
    const webcal = new Webcal();
    webcal.enabled = false;
    webcal.guid = 'abc-123';
    component.webcal = webcal;

    component.downloadCalendar();

    expect(fileDownloaderStub.downloadFile).not.toHaveBeenCalled();
  });

  it('does not download when the webcal is enabled but has no guid', () => {
    const webcal = new Webcal();
    webcal.enabled = true;
    webcal.guid = undefined;
    component.webcal = webcal;

    component.downloadCalendar();

    expect(fileDownloaderStub.downloadFile).not.toHaveBeenCalled();
  });

  it('does not download when there is no webcal loaded yet', () => {
    component.webcal = null;

    component.downloadCalendar();

    expect(fileDownloaderStub.downloadFile).not.toHaveBeenCalled();
  });
});

describe('CalendarModalComponent accessible URL controls', () => {
  let fixture: ComponentFixture<CalendarModalComponent>;

  beforeEach(async () => {
    const webcal = Object.assign(new Webcal(), {
      enabled: true,
      guid: 'synthetic-calendar',
      reminder: null,
      unitExclusions: [],
    });
    await TestBed.configureTestingModule({
      declarations: [CalendarModalComponent],
      imports: [MatIconModule, MatSlideToggleModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {provide: MAT_DIALOG_DATA, useValue: {}},
        {provide: WebcalService, useValue: {get: () => of(webcal)}},
        {provide: ProjectService, useValue: {query: () => of([])}},
        {provide: DoubtfireConstants, useValue: {API_URL: 'https://example.test/api'}},
        {provide: AlertService, useValue: {}},
        {provide: ConfirmationModalService, useValue: {}},
        {provide: FileDownloaderService, useValue: {}},
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CalendarModalComponent);
    fixture.detectChanges();
  });

  it('renders a named subscription link with the complete ICS URL', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector(
      'a[aria-label^="Subscribe"]',
    );
    expect(link.href).toBe('https://example.test/api/webcal/synthetic-calendar.ics');
    expect(link.getAttribute('aria-label')).toContain(link.href);
    expect(link.querySelector('mat-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('gives the adjacent icon-only copy and regenerate buttons separate accessible names', () => {
    const root: HTMLElement = fixture.nativeElement;
    const copy = root.querySelector<HTMLButtonElement>('button[matTooltip="Copy URL"]')!;
    const regenerate = root.querySelector<HTMLButtonElement>(
      'button[matTooltip="Regenerate URL"]',
    )!;
    expect(copy.getAttribute('aria-label')).toBe('Copy web calendar URL');
    expect(regenerate.getAttribute('aria-label')).toBe('Regenerate web calendar URL');
    expect(copy.disabled).toBe(false);
    expect(regenerate.disabled).toBe(false);
    expect(
      copy.compareDocumentPosition(regenerate) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
