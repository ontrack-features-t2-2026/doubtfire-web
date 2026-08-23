import {beforeEach, describe, expect, it, vi} from 'vitest';
import {HttpErrorResponse} from '@angular/common/http';
import {SimpleChange} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Observable, Subject, of, throwError} from 'rxjs';
import {PeerProgressIndicator} from 'src/app/api/models/peer-progress-indicator';
import {Task} from 'src/app/api/models/task';
import {TaskDefinition} from 'src/app/api/models/task-definition';
import {
  DISABLED_STATE,
  NORMAL_STATE,
  STALE_STATE,
  SUPPRESSED_STATE,
  UNAVAILABLE_STATE,
  ZERO_PERCENT_STATE,
} from 'src/app/api/services/mock';
import {PeerProgressIndicatorService} from 'src/app/api/services/peer-progress-indicator.service';
import {PpiWidgetComponent} from './ppi-widget.component';

describe('PpiWidgetComponent', () => {
  let component: PpiWidgetComponent;
  let fixture: ComponentFixture<PpiWidgetComponent>;
  let getIndicator: ReturnType<typeof vi.fn>;

  const mockTask = {project: {id: 7, unit: {id: 1}, targetGrade: 2}} as unknown as Task;
  const mockTaskDef = {id: 99} as unknown as TaskDefinition;

  beforeEach(async () => {
    getIndicator = vi.fn();

    await TestBed.configureTestingModule({
      declarations: [PpiWidgetComponent],
      imports: [MatIconModule, MatProgressSpinnerModule, MatButtonModule],
      providers: [{provide: PeerProgressIndicatorService, useValue: {getIndicator}}],
    }).compileComponents();

    fixture = TestBed.createComponent(PpiWidgetComponent);
    component = fixture.componentInstance;
    component.task = mockTask;
    component.taskDef = mockTaskDef;
  });

  function load(response$: Observable<PeerProgressIndicator>) {
    getIndicator.mockReturnValue(response$);
    component.ngOnChanges({task: new SimpleChange(null, mockTask, true)});
    fixture.detectChanges();
  }

  it('should create', () => {
    load(of(NORMAL_STATE));
    expect(component).toBeTruthy();
  });

  it('shows the peer percentage on a normal response', () => {
    load(of(NORMAL_STATE));
    expect(getIndicator).toHaveBeenCalledWith(7, 99);
    expect(component.view.state).toBe('success');
    expect(fixture.nativeElement.textContent).toContain('42%');
  });

  it('shows a rounded zero as data rather than unavailable', () => {
    load(of(ZERO_PERCENT_STATE));
    expect(component.view.state).toBe('no-data');
    expect(fixture.nativeElement.textContent).toContain(
      'Peer submission progress rounds to 0% for your target grade',
    );
  });

  it('shows the API-provided hidden message for a suppressed response', () => {
    load(of(SUPPRESSED_STATE));
    expect(component.view.state).toBe('hidden');
    expect(fixture.nativeElement.textContent).toContain(SUPPRESSED_STATE.unavailableMessage);
    expect(fixture.nativeElement.textContent).not.toMatch(/\d+ students?/);
  });

  it('shows the API-provided unavailable message', () => {
    load(of(UNAVAILABLE_STATE));
    expect(component.view.state).toBe('unavailable');
    expect(fixture.nativeElement.textContent).toContain(UNAVAILABLE_STATE.unavailableMessage);
  });

  it('shows the API-provided disabled message when the feature is turned off', () => {
    load(of(DISABLED_STATE));
    expect(component.view.state).toBe('disabled');
    expect(fixture.nativeElement.textContent).toContain(DISABLED_STATE.unavailableMessage);
  });

  it('shows a distinct visible stale state when data is outdated', () => {
    load(of(STALE_STATE));
    expect(component.view.state).toBe('stale');
    expect(component.view.data?.submittedPercentage).toBeNull();
    expect(component.view.message).toBe(STALE_STATE.unavailableMessage);
    expect(fixture.nativeElement.textContent).toContain('Peer progress is currently unavailable.');
    expect(fixture.nativeElement.textContent).not.toContain('55%');
  });

  it('transitions from loading to success once the request resolves', () => {
    const subject: Subject<PeerProgressIndicator> = new Subject();
    getIndicator.mockReturnValue(subject.asObservable());

    component.ngOnChanges({task: new SimpleChange(null, mockTask, true)});
    expect(component.view.state).toBe('loading');

    subject.next(NORMAL_STATE);
    expect(component.view.state).toBe('success');
  });

  it.each([404, 503])(
    'shows a generic error for HTTP %s without leaking server details',
    (status) => {
      const subject: Subject<PeerProgressIndicator> = new Subject();
      getIndicator.mockReturnValue(subject.asObservable());

      component.ngOnChanges({task: new SimpleChange(null, mockTask, true)});
      expect(component.view.state).toBe('loading');

      subject.error(
        new HttpErrorResponse({
          status,
          error: {error: 'Peer progress is unavailable for this project or task.'},
        }),
      );
      fixture.detectChanges();

      expect(component.view.state).toBe('error');
      expect(component.view.data).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Could not load peer progress.');
      expect(fixture.nativeElement.textContent).not.toContain(
        'unavailable for this project or task',
      );
    },
  );

  it('does not render a stale value if a request fails after a new one has already started', () => {
    load(of(NORMAL_STATE));
    expect(fixture.nativeElement.textContent).toContain('42%');

    load(throwError(() => new Error('network down')));
    fixture.detectChanges();
    expect(component.view.state).toBe('error');
    expect(fixture.nativeElement.textContent).not.toContain('42%');
  });

  it('cancels a previous in-flight request when the task changes before it resolves', () => {
    const first: Subject<PeerProgressIndicator> = new Subject();
    const second: Subject<PeerProgressIndicator> = new Subject();
    getIndicator
      .mockReturnValueOnce(first.asObservable())
      .mockReturnValueOnce(second.asObservable());

    component.ngOnChanges({task: new SimpleChange(null, mockTask, true)});
    component.ngOnChanges({task: new SimpleChange(null, mockTask, true)});

    first.next(NORMAL_STATE);
    expect(component.view.state).toBe('loading');

    second.next(SUPPRESSED_STATE);
    expect(component.view.state).toBe('hidden');
  });
});
