import {beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {EMPTY, of, throwError} from 'rxjs';
import {UserService} from 'src/app/api/models/doubtfire-model';
import {StaffNote} from 'src/app/api/models/staff-note';
import {StaffNoteService} from 'src/app/api/services/staff-note.service';
import {EmptyStateComponent} from 'src/app/common/empty-state/empty-state.component';
import {ConfirmationModalService} from 'src/app/common/modals/confirmation-modal/confirmation-modal.service';
import {HumanizedDatePipe} from 'src/app/common/pipes/humanized-date.pipe';
import {LocalizedDatePipe} from 'src/app/common/pipes/localized-date.pipe';
import {MarkedPipe} from 'src/app/common/pipes/marked.pipe';
import {AlertService} from 'src/app/common/services/alert.service';
import {StaffNotesComponent} from './staff-notes.component';

const emptyProvider = {};
const staffNoteServiceStub = {
  loadStaffNotes: () => EMPTY,
  updateStaffNoteReplies: () => undefined,
};

describe('StaffNotesComponent', () => {
  let component: StaffNotesComponent;
  let fixture: ComponentFixture<StaffNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StaffNotesComponent, HumanizedDatePipe, LocalizedDatePipe, MarkedPipe],
      providers: [
        {provide: UserService, useValue: emptyProvider},
        {provide: StaffNoteService, useValue: staffNoteServiceStub},
        {provide: AlertService, useValue: emptyProvider},
        {provide: ConfirmationModalService, useValue: emptyProvider},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(StaffNotesComponent, {set: {template: ''}})
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StaffNotesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('StaffNotesComponent note actions', () => {
  let component: StaffNotesComponent;
  let fixture: ComponentFixture<StaffNotesComponent>;
  let note: StaffNote;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StaffNotesComponent, HumanizedDatePipe, LocalizedDatePipe, MarkedPipe],
      providers: [
        {provide: UserService, useValue: emptyProvider},
        {provide: StaffNoteService, useValue: staffNoteServiceStub},
        {provide: AlertService, useValue: emptyProvider},
        {provide: ConfirmationModalService, useValue: emptyProvider},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StaffNotesComponent);
    component = fixture.componentInstance;
    note = {id: 7, replyToId: null, note: 'a note', user: {}, authorIsMe: true} as StaffNote;

    fixture.detectChanges();
    component.loadingStaffNotes = false;
    component.project = {
      student: {preferredName: 'Ada', lastName: 'Lovelace'},
      staffNoteCache: {currentValues: [note]},
    } as never;
    fixture.detectChanges();
  });

  function card(): HTMLElement {
    return fixture.nativeElement.querySelector('.note-card') as HTMLElement;
  }

  function editButton(): HTMLButtonElement {
    return card().querySelector('.note-actions button') as HTMLButtonElement;
  }

  it('renders the note actions instead of gating them behind a pointer flag', () => {
    const actions = card().querySelector('.note-actions') as HTMLElement;

    expect(actions).toBeTruthy();
    expect(actions.hasAttribute('hidden')).toBe(false);
  });

  it('builds the actions out of real buttons rather than bare icons', () => {
    const buttons = card().querySelectorAll('.note-actions button');

    expect(buttons.length).toBe(3);
    expect(editButton().getAttribute('aria-label')).toBe('Edit this note');
  });

  it('does not meet the reveal condition while nothing in the note has focus', () => {
    expect(card().matches(':focus-within')).toBe(false);
  });

  it('meets the reveal condition once the keyboard reaches the actions', () => {
    editButton().focus();

    expect(document.activeElement).toBe(editButton());
    expect(card().matches(':focus-within')).toBe(true);
  });

  it('opens the editor through the button the pointer uses, not through injected state', () => {
    const button = editButton();
    button.focus();
    button.click();
    fixture.detectChanges();

    expect(component.editingNote).toBe(note);
    expect(card().querySelector('textarea')).toBeTruthy();
  });
});

describe('StaffNotesComponent states', () => {
  let component: StaffNotesComponent;
  let fixture: ComponentFixture<StaffNotesComponent>;
  let loadStaffNotes: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loadStaffNotes = vi.fn(() => of([]));

    await TestBed.configureTestingModule({
      declarations: [StaffNotesComponent, HumanizedDatePipe, LocalizedDatePipe, MarkedPipe],
      imports: [EmptyStateComponent],
      providers: [
        {provide: UserService, useValue: emptyProvider},
        {
          provide: StaffNoteService,
          useValue: {loadStaffNotes, updateStaffNoteReplies: () => undefined},
        },
        {provide: AlertService, useValue: emptyProvider},
        {provide: ConfirmationModalService, useValue: emptyProvider},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  function render(): void {
    fixture = TestBed.createComponent(StaffNotesComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('project', {
      student: {name: 'Ada Lovelace'},
      staffNoteCache: {currentValues: []},
    } as never);
    fixture.detectChanges();
  }

  function text(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ');
  }

  function buttonLabelled(label: string): HTMLButtonElement | undefined {
    return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => button.textContent.trim() === label,
    );
  }

  it('says there are no notes yet once an empty list loads', () => {
    render();

    expect(text()).toContain('No notes yet');
    expect(text()).toContain('Notes you add below are only seen by staff.');
    expect(fixture.nativeElement.querySelector('.note-card')).toBeNull();
  });

  it('shows an error state with Try again when the notes fail to load', () => {
    loadStaffNotes.mockReturnValueOnce(throwError(() => new Error('offline')));
    render();

    expect(text()).toContain('The notes did not load');
    expect(text()).not.toContain('No notes yet');

    buttonLabelled('Try again').click();
    fixture.detectChanges();

    expect(loadStaffNotes).toHaveBeenCalledTimes(2);
    expect(text()).not.toContain('The notes did not load');
    expect(text()).toContain('No notes yet');
  });

  it('keeps Save note off until there is something to save', () => {
    render();
    const save = buttonLabelled('Save note');

    expect(save.getAttribute('type')).toBe('button');
    expect(save.disabled).toBe(true);

    component.noteText = '   ';
    fixture.detectChanges();
    expect(save.disabled).toBe(true);

    component.noteText = 'Talked about the extension';
    fixture.detectChanges();
    expect(save.disabled).toBe(false);
  });
});
