import {beforeEach, describe, expect, it} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Task} from 'src/app/api/models/task';
import {TaskDefinition} from 'src/app/api/models/task-definition';
import {Unit} from 'src/app/api/models/unit';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {MarkedPipe} from 'src/app/common/pipes/marked.pipe';
import {GradeService} from 'src/app/common/services/grade.service';
import {TaskDescriptionCardComponent} from './task-description-card.component';

function buildTask(overrides: {
  unitCode?: string;
  abbreviation?: string;
  name?: string;
  taskDefId?: number;
  dueDate?: Date;
}): Task {
  const unit = new Unit();
  unit.code = overrides.unitCode ?? 'COS10001';
  unit.allowFlexibleDates = false;

  const definition = new TaskDefinition(unit);
  definition.id = overrides.taskDefId ?? 42;
  definition.abbreviation = overrides.abbreviation ?? '1.1P';
  definition.name = overrides.name ?? 'Hello World';
  definition.description = '';
  definition.targetDate = undefined;
  definition.startDate = new Date(2026, 8, 1);
  definition.targetGrade = 0;
  definition.hasTaskSheet = true;
  definition.hasTaskResources = false;

  const task = new Task(unit);
  task.definition = definition;
  task.dueDate = overrides.dueDate;

  return task;
}

describe('TaskDescriptionCardComponent', () => {
  let component: TaskDescriptionCardComponent;
  let fixture: ComponentFixture<TaskDescriptionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskDescriptionCardComponent, MarkedPipe],
      imports: [NoopAnimationsModule, MatButtonModule, MatIconModule],
      providers: [
        GradeService,
        {provide: FileDownloaderService, useValue: {downloadFile: () => undefined}},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDescriptionCardComponent);
    component = fixture.componentInstance;
  });

  it('renders the Add to Google Calendar button when the task has a due date', () => {
    const dueDate = new Date(2026, 8, 15);
    const task = buildTask({dueDate});
    component.task = task;
    component.taskDef = task.definition;
    component.unit = task.unit;
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector(
      'a.add-to-google-calendar-link',
    );

    expect(link).not.toBeNull();
    expect(link.hidden).toBe(false);
  });

  it('hides the Add to Google Calendar button when the task has no resolvable due date', () => {
    const task = buildTask({dueDate: undefined});
    component.task = task;
    component.taskDef = task.definition;
    component.unit = task.unit;
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector(
      'a.add-to-google-calendar-link',
    );

    expect(link).not.toBeNull();
    expect(link.hidden).toBe(true);
  });

  it('builds the exact Google Calendar URL, with an exclusive end date one day after the due date', () => {
    const dueDate = new Date(2026, 8, 15);
    const task = buildTask({
      unitCode: 'COS10001',
      abbreviation: '1.1P',
      name: 'Hello World',
      taskDefId: 42,
      dueDate,
    });
    component.task = task;

    const url = component.googleCalendarUrl();

    expect(url).toBe(
      'https://calendar.google.com/calendar/render?' +
        'action=TEMPLATE&' +
        'text=COS10001%3A%201.1P%3A%20Hello%20World&' +
        'dates=20260915%2F20260916',
    );
  });
});
