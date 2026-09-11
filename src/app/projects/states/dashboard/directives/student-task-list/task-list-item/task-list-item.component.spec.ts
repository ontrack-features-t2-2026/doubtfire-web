import {beforeEach, describe, expect, it} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Task} from 'src/app/api/models/doubtfire-model';
import {GradeService} from 'src/app/common/services/grade.service';
import {TaskListItemComponent} from './task-list-item.component';

/**
 * The five task-list-item badges carry the only visual signal a student gets
 * that a task is due soon, due but not yet past its deadline, past its
 * deadline, has new comments or has similarities detected. Before this card
 * every one of those badges was silent: the glyph is aria-hidden by MatIcon,
 * the tooltip is not a name for a non-interactive element, and the
 * new-comments badge was announced as a bare number with no unit. The due-soon
 * and past-deadline badges were also the same colour-only clock face.
 *
 * These tests read the real rendered DOM rather than the component's fields,
 * because "what does a screen reader get" is a question about the markup. The
 * flag-based cases drive each badge visible on its own; the "only shown when"
 * case is the failure path, proving a badge that does not apply is hidden and
 * therefore absent from the accessibility tree.
 */
describe('TaskListItemComponent', () => {
  let component: TaskListItemComponent;
  let fixture: ComponentFixture<TaskListItemComponent>;

  // The component only reads grade names in the heading; the badge behaviour
  // under test never consults the service.
  const gradeServiceStub = {
    grades: {
      '-1': 'Fail',
      0: 'Pass',
      1: 'Credit',
      2: 'Distinction',
      3: 'High Distinction',
    },
  };

  /**
   * A Task stand-in with every badge condition switched off, so each test can
   * turn on exactly the state it is about. Only the members the template reads
   * are present.
   */
  const makeTask = (overrides: Record<string, unknown> = {}): Task =>
    ({
      status: 'not_started',
      numNewComments: 0,
      similaritiesDetected: false,
      qualityPts: 0,
      definition: {
        name: 'Test Task',
        abbreviation: '1.1P',
        targetGrade: 0,
        maxQualityPts: 0,
      },
      isGroupTask: () => false,
      isBeforeStartDate: () => false,
      inSubmittedState: () => false,
      timeToStart: () => '',
      isOverdue: () => false,
      timeToDue: () => '',
      hasGrade: () => false,
      gradeDesc: () => '',
      hasQualityPoints: () => false,
      isDueSoon: () => false,
      betweenDueDateAndDeadlineDate: () => false,
      isPastDeadline: () => false,
      inFinalState: () => false,
      ...overrides,
    }) as unknown as Task;

  const render = (task: Task): void => {
    component.task = task;
    fixture.detectChanges();
  };

  // The due-date and past-deadline badges share the `due-badge` class, so the
  // only way to tell them apart in the DOM is which one is not hidden. `hidden`
  // is a reflected attribute, so this selector is the visible one.
  const badge = (className: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`.${className}:not([hidden])`);

  const hiddenBadge = (className: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`.${className}[hidden]`);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskListItemComponent],
      providers: [{provide: GradeService, useValue: gradeServiceStub}],
      // The real template is rendered on purpose: the fix is in the markup.
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListItemComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Each badge's accessible name. Before the card none of these attributes
  // existed, so every case below failed; after it they pass.
  it.each([
    ['new comments', 'new-comments-badge', {numNewComments: 3}, '3 new comments'],
    [
      'similarities',
      'plagiarism-detected-badge',
      {similaritiesDetected: true},
      'Similarities detected',
    ],
    ['due soon', 'soon-badge', {isDueSoon: () => true}, 'Due soon'],
    [
      'due before the deadline',
      'due-badge',
      {betweenDueDateAndDeadlineDate: () => true},
      'Due, deadline not yet passed',
    ],
    ['past deadline', 'due-badge', {isPastDeadline: () => true}, 'Past deadline'],
  ])('gives the %s badge a role and an accessible name', (_name, className, overrides, label) => {
    render(makeTask(overrides));

    const span = badge(className);
    expect(span).not.toBeNull();
    expect(span!.getAttribute('role')).toBe('img');
    expect(span!.getAttribute('aria-label')).toBe(label);
  });

  it('puts the new-comment count in the accessible name, not just the visible number', () => {
    render(makeTask({numNewComments: 4}));

    const span = badge('new-comments-badge');
    expect(span!.textContent!.trim()).toBe('4');
    expect(span!.getAttribute('aria-label')).toBe('4 new comments');
  });

  it('hides the icon glyphs inside the badges from assistive technology', () => {
    render(
      makeTask({
        numNewComments: 2,
        similaritiesDetected: true,
        isDueSoon: () => true,
        betweenDueDateAndDeadlineDate: () => true,
        isPastDeadline: () => true,
      }),
    );

    const icons = fixture.nativeElement.querySelectorAll('.task-badges mat-icon');
    expect(icons.length).toBe(4);
    icons.forEach((icon: HTMLElement) => {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('uses a different glyph for the past-deadline badge so colour is not the only signal', () => {
    render(makeTask({isPastDeadline: () => true}));

    const pastDeadline = badge('due-badge');
    expect(pastDeadline!.getAttribute('aria-label')).toBe('Past deadline');
    expect(pastDeadline!.querySelector('mat-icon')!.textContent!.trim()).toBe('event_busy');
  });

  // Failure path: a badge whose condition is false must not be exposed at all,
  // so a student is never told about a deadline state that does not apply.
  it('leaves badges out of the accessibility tree when their condition is false', () => {
    render(makeTask());

    expect(hiddenBadge('new-comments-badge')).not.toBeNull();
    expect(hiddenBadge('plagiarism-detected-badge')).not.toBeNull();
    expect(hiddenBadge('soon-badge')).not.toBeNull();
    expect(badge('due-badge')).toBeNull();
  });
});
