import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError, Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PpiWidgetComponent } from './ppi-widget.component';
import { PeerProgressIndicatorService } from 'src/app/api/services/peer-progress-indicator.service';
import { PeerProgressIndicator } from 'src/app/api/models/peer-progress-indicator';
import { Task } from 'src/app/api/models/task';
import { TaskDefinition } from 'src/app/api/models/task-definition';
import {
  NORMAL_STATE,
  ZERO_PERCENT_STATE,
  SUPPRESSED_STATE,
  UNAVAILABLE_STATE,
  STALE_STATE,
  DISABLED_STATE,
} from 'src/app/api/services/mock/peer-progress-indicator.mock';

describe('PpiWidgetComponent', () => {
  let component: PpiWidgetComponent;
  let fixture: ComponentFixture<PpiWidgetComponent>;
  let getIndicator: ReturnType<typeof vi.fn>;

  const mockTask = { project: { unit: { id: 1 }, targetGrade: 2 } } as unknown as Task;
  const mockTaskDef = { id: 99 } as unknown as TaskDefinition;

  beforeEach(async () => {
    getIndicator = vi.fn();

    await TestBed.configureTestingModule({
      declarations: [PpiWidgetComponent],
      imports: [MatIconModule, MatProgressSpinnerModule, MatButtonModule, NoopAnimationsModule],
      providers: [{ provide: PeerProgressIndicatorService, useValue: { getIndicator } }],
    }).compileComponents();

    fixture = TestBed.createComponent(PpiWidgetComponent);
    component = fixture.componentInstance;
    component.task = mockTask;
    component.taskDef = mockTaskDef;
  });

  function load(response$: Observable<PeerProgressIndicator>) {
    getIndicator.mockReturnValue(response$);
    component.ngOnChanges({ task: {} as any });
    fixture.detectChanges();
  }

  it('should create', () => {
    load(of(NORMAL_STATE));
    expect(component).toBeTruthy();
  });

  it('shows the peer percentage on a normal response', () => {
    load(of(NORMAL_STATE));
    expect(component.view.state).toBe('success');
    expect(fixture.nativeElement.textContent).toContain('42%');
  });

  it('shows no-data when nobody has submitted yet', () => {
    load(of(ZERO_PERCENT_STATE));
    expect(component.view.state).toBe('no-data');
  });

  it('shows the hidden message for a suppressed response, without saying why', () => {
    load(of(SUPPRESSED_STATE));
    expect(component.view.state).toBe('hidden');
    expect(fixture.nativeElement.textContent).toContain('Not enough students to show progress.');
    expect(fixture.nativeElement.textContent).not.toMatch(/\d+ students?/);
  });

  it('shows the unavailable message when data is unavailable', () => {
    load(of(UNAVAILABLE_STATE));
    expect(component.view.state).toBe('unavailable');
  });

  it('shows the disabled message when the feature is turned off for the unit', () => {
    load(of(DISABLED_STATE));
    expect(component.view.state).toBe('disabled');
    expect(fixture.nativeElement.textContent).toContain('Peer Progress Indicator is disabled for this unit.');
  });

  it('shows the stale message when the response is marked stale', () => {
    load(of(STALE_STATE));
    expect(component.view.state).toBe('stale');
    expect(fixture.nativeElement.textContent).toContain('may be outdated');
  });

  it('transitions from loading to success once the request resolves', () => {
    const subject = new Subject<PeerProgressIndicator>();
    getIndicator.mockReturnValue(subject.asObservable());

    component.ngOnChanges({ task: {} as any });
    expect(component.view.state).toBe('loading');

    subject.next(NORMAL_STATE);
    expect(component.view.state).toBe('success');
  });

  it('transitions from loading to error on failure, with no stale data shown', () => {
    const subject = new Subject<PeerProgressIndicator>();
    getIndicator.mockReturnValue(subject.asObservable());

    component.ngOnChanges({ task: {} as any });
    expect(component.view.state).toBe('loading');

    subject.error(new Error('network down'));
    expect(component.view.state).toBe('error');
    expect(component.view.data).toBeNull();
  });

  it('does not render a stale value if a request fails after a new one has already started', () => {
    load(of(NORMAL_STATE));
    expect(fixture.nativeElement.textContent).toContain('42%');

    load(throwError(() => new Error('network down')));
    fixture.detectChanges();
    expect(component.view.state).toBe('error');
    expect(fixture.nativeElement.textContent).not.toContain('42%');
  });

  it('cancels a previous in-flight request when the task changes before it resolves', () => {
    const first = new Subject<PeerProgressIndicator>();
    const second = new Subject<PeerProgressIndicator>();
    getIndicator.mockReturnValueOnce(first.asObservable()).mockReturnValueOnce(second.asObservable());

    component.ngOnChanges({ task: {} as any });
    component.ngOnChanges({ task: {} as any });

    first.next(NORMAL_STATE);
    expect(component.view.state).toBe('loading');

    second.next(SUPPRESSED_STATE);
    expect(component.view.state).toBe('hidden');
  });
});