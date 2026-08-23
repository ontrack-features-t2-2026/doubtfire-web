import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Project} from 'src/app/api/models/project';
import {Task} from 'src/app/api/models/task';
import {TaskDefinition} from 'src/app/api/models/task-definition';
import {Unit} from 'src/app/api/models/unit';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {TaskPlannerCardComponent} from './task-planner-card.component';

function buildProjectWithTasks(taskDueDates: (Date | undefined)[]): Project {
  const unit = new Unit();
  unit.id = 7;
  unit.code = 'COS10001';
  unit.allowFlexibleDates = false;

  const project = new Project(unit);
  project.targetGrade = 0;

  taskDueDates.forEach((dueDate, index) => {
    const definition = new TaskDefinition(unit);
    definition.id = index + 1;
    definition.abbreviation = `${index + 1}.1P`;
    definition.name = `Task ${index + 1}`;
    definition.targetGrade = 0;
    definition.targetDate = dueDate;

    const task = new Task(unit);
    task.definition = definition;
    task.dueDate = dueDate;
    task.project = project;

    project.taskCache.add(task);
  });

  return project;
}

describe('TaskPlannerCardComponent', () => {
  let component: TaskPlannerCardComponent;
  let fixture: ComponentFixture<TaskPlannerCardComponent>;
  let fileDownloaderStub: {
    downloadBlobToFile: ReturnType<typeof vi.fn>;
    releaseBlob: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    fileDownloaderStub = {
      downloadBlobToFile: vi.fn(),
      releaseBlob: vi.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [TaskPlannerCardComponent],
      imports: [MatButtonModule, MatIconModule, NoopAnimationsModule],
      providers: [{provide: FileDownloaderService, useValue: fileDownloaderStub}],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskPlannerCardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('disables the download button when there are no active tasks yet', () => {
    // Simulates the dashboard's progressive resolution (project.resolver.ts), where
    // project.tasks can still be empty on first render.
    component.project = buildProjectWithTasks([]);
    fixture.detectChanges();

    const downloadButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.download-ics-link');

    expect(downloadButton).not.toBeNull();
    expect(downloadButton.disabled).toBe(true);
  });

  it('enables the download button once active tasks are present', () => {
    component.project = buildProjectWithTasks([new Date(2026, 8, 15, 23, 59, 59, 999)]);
    fixture.detectChanges();

    const downloadButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.download-ics-link');

    expect(downloadButton.disabled).toBe(false);
  });

  it('does not call the file downloader when there are no active tasks, guarding against an empty file', () => {
    component.project = buildProjectWithTasks([]);
    fixture.detectChanges();

    component.downloadIcs();

    expect(fileDownloaderStub.downloadBlobToFile).not.toHaveBeenCalled();
    expect(fileDownloaderStub.releaseBlob).not.toHaveBeenCalled();
  });

  it('downloads a blob named after the unit code when active tasks are present', () => {
    component.project = buildProjectWithTasks([new Date(2026, 8, 15, 23, 59, 59, 999)]);
    fixture.detectChanges();

    const createObjectURLSpy = vi
      .spyOn(window.URL, 'createObjectURL')
      .mockReturnValue('blob:mock-url');

    component.downloadIcs();

    expect(createObjectURLSpy).toHaveBeenCalledOnce();
    const [blobArg] = createObjectURLSpy.mock.calls[0];
    expect((blobArg as Blob).type).toBe('text/calendar;charset=utf-8');
    expect(fileDownloaderStub.downloadBlobToFile).toHaveBeenCalledWith(
      'blob:mock-url',
      'COS10001-tasks.ics',
    );
    expect(fileDownloaderStub.releaseBlob).toHaveBeenCalledWith('blob:mock-url');
  });
});
