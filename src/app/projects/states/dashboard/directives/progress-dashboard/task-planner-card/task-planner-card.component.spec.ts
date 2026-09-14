import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatMenuHarness} from '@angular/material/menu/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Project} from 'src/app/api/models/project';
import {Task} from 'src/app/api/models/task';
import {TaskDefinition} from 'src/app/api/models/task-definition';
import {Unit} from 'src/app/api/models/unit';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {GradeService} from 'src/app/common/services/grade.service';
import {TaskPlannerCardComponent} from './task-planner-card.component';

function buildProjectWithTasks(
  tasks: {dueDate?: Date; targetGrade?: number}[],
  projectTargetGrade: number | undefined = 0,
  allowFlexibleDates = false,
): Project {
  const unit = new Unit();
  unit.id = 7;
  unit.code = 'COS10001';
  unit.allowFlexibleDates = allowFlexibleDates;

  const project = new Project(unit);
  project.targetGrade = projectTargetGrade;

  tasks.forEach(({dueDate, targetGrade}, index) => {
    const definition = new TaskDefinition(unit);
    definition.id = index + 1;
    definition.abbreviation = `${index + 1}.1P`;
    definition.name = `Task ${index + 1}`;
    definition.targetGrade = targetGrade ?? 0;
    definition.targetDate = dueDate;

    const task = new Task(unit);
    task.id = index + 1;
    task.definition = definition;
    task.dueDate = dueDate;
    task.project = project;

    project.taskCache.add(task);
  });

  return project;
}

const DUE = new Date(2026, 8, 15, 23, 59, 59, 999);

// The host below only projects a stand-in grade field into the card, so its short
// template belongs here rather than in a file of its own. It checks eagerly, like the
// dashboard, so a test can set a field and see the card re-render.
/* eslint-disable @angular-eslint/component-max-inline-declarations */
@Component({
  template: `
    <f-task-planner-card [project]="project" [showTips]="showTips">
      <span class="projected-grade-field">Target grade</span>
    </f-task-planner-card>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
class PlannerCardHostComponent {
  project: Project;
  showTips = true;
}

describe('TaskPlannerCardComponent', () => {
  let component: TaskPlannerCardComponent;
  let fixture: ComponentFixture<TaskPlannerCardComponent>;
  let fileDownloaderStub: {
    downloadBlobToFile: ReturnType<typeof vi.fn>;
    releaseBlob: ReturnType<typeof vi.fn>;
  };

  const menuItemTexts = async (): Promise<string[]> => {
    const menu = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatMenuHarness);
    await menu.open();
    const items = await menu.getItems();
    return Promise.all(items.map((item) => item.getText()));
  };

  beforeEach(async () => {
    fileDownloaderStub = {
      downloadBlobToFile: vi.fn(),
      releaseBlob: vi.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [TaskPlannerCardComponent, PlannerCardHostComponent],
      imports: [
        MatButtonModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        NoopAnimationsModule,
      ],
      providers: [{provide: FileDownloaderService, useValue: fileDownloaderStub}, GradeService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskPlannerCardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('disables the calendar menu until the tasks have loaded', () => {
    // Simulates the dashboard's progressive resolution (project.resolver.ts), where
    // project.tasks can still be empty on first render.
    component.project = buildProjectWithTasks([]);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.download-ics-link');

    expect(trigger).not.toBeNull();
    expect(trigger.disabled).toBe(true);
  });

  it('enables the calendar menu once tasks are present', () => {
    component.project = buildProjectWithTasks([{dueDate: DUE}]);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.download-ics-link');

    expect(trigger.disabled).toBe(false);
  });

  it('lists the target grade first and marks it, then the other grades lowest first', async () => {
    component.project = buildProjectWithTasks([{dueDate: DUE}], 1);
    fixture.detectChanges();

    expect(await menuItemTexts()).toEqual([
      'Tasks for Credit (your target)',
      'Tasks for Pass',
      'Tasks for Distinction',
      'Tasks for High Distinction',
    ]);
  });

  it('follows a target grade the student changes after the card first renders', async () => {
    component.project = buildProjectWithTasks([{dueDate: DUE}], 0);
    fixture.detectChanges();

    component.project.targetGrade = 2;
    fixture.detectChanges();

    const [first] = await menuItemTexts();
    expect(first).toBe('Tasks for Distinction (your target)');
  });

  it('lists every grade, with none marked, when the project has no target grade', async () => {
    const project = buildProjectWithTasks([{dueDate: DUE}]);
    project.targetGrade = undefined;
    component.project = project;
    fixture.detectChanges();

    expect(await menuItemTexts()).toEqual([
      'Tasks for Pass',
      'Tasks for Credit',
      'Tasks for Distinction',
      'Tasks for High Distinction',
    ]);
  });

  it('disables a grade in the menu when no task is at or below it', async () => {
    component.project = buildProjectWithTasks([{dueDate: DUE, targetGrade: 2}], 2);
    fixture.detectChanges();

    const menu = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatMenuHarness);
    await menu.open();
    const [target, pass] = await menu.getItems();

    expect(await target.isDisabled()).toBe(false);
    expect(await pass.isDisabled()).toBe(true);
  });

  it('does not call the file downloader when the grade has no tasks, guarding against an empty file', () => {
    component.project = buildProjectWithTasks([]);
    fixture.detectChanges();

    component.downloadIcs(0);

    expect(fileDownloaderStub.downloadBlobToFile).not.toHaveBeenCalled();
    expect(fileDownloaderStub.releaseBlob).not.toHaveBeenCalled();
  });

  it('downloads a blob named after the unit code and the chosen grade abbreviation', () => {
    component.project = buildProjectWithTasks([{dueDate: DUE}]);
    fixture.detectChanges();

    const createObjectURLSpy = vi
      .spyOn(window.URL, 'createObjectURL')
      .mockReturnValue('blob:mock-url');

    component.downloadIcs(0);

    expect(createObjectURLSpy).toHaveBeenCalledOnce();
    const [blobArg] = createObjectURLSpy.mock.calls[0];
    expect((blobArg as Blob).type).toBe('text/calendar;charset=utf-8');
    expect(fileDownloaderStub.downloadBlobToFile).toHaveBeenCalledWith(
      'blob:mock-url',
      'COS10001-tasks-P.ics',
    );
    expect(fileDownloaderStub.releaseBlob).toHaveBeenCalledWith('blob:mock-url');
  });

  it('uses the chosen grade, not the target, in the filename', () => {
    component.project = buildProjectWithTasks([{dueDate: DUE, targetGrade: 0}], 0);
    fixture.detectChanges();
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');

    component.downloadIcs(1); // Credit, abbreviation 'C'.

    expect(fileDownloaderStub.downloadBlobToFile).toHaveBeenCalledWith(
      'blob:mock-url',
      'COS10001-tasks-C.ics',
    );
  });

  it('puts only the tasks at or below the grade picked in the menu into the file', async () => {
    // Two tasks: one at grade 0 (Pass), one at grade 2 (Distinction). If the menu passed the
    // wrong grade, or the filter were ignored, both event UIDs would be in the file.
    component.project = buildProjectWithTasks(
      [
        {dueDate: DUE, targetGrade: 0},
        {dueDate: new Date(2026, 8, 20, 23, 59, 59, 999), targetGrade: 2},
      ],
      2,
    );
    fixture.detectChanges();
    const createObjectURLSpy = vi
      .spyOn(window.URL, 'createObjectURL')
      .mockReturnValue('blob:mock-url');

    const menu = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatMenuHarness);
    await menu.open();
    await menu.clickItem({text: 'Tasks for Pass'});

    const [blobArg] = createObjectURLSpy.mock.calls[0];
    const ics = await (blobArg as Blob).text();
    expect(ics).toContain('UID:E-1');
    expect(ics).not.toContain('UID:E-2');
    expect(fileDownloaderStub.downloadBlobToFile).toHaveBeenCalledWith(
      'blob:mock-url',
      'COS10001-tasks-P.ics',
    );
  });

  it('does not change the saved target grade when downloading another grade', () => {
    component.project = buildProjectWithTasks([{dueDate: DUE}], 1);
    fixture.detectChanges();
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');

    component.downloadIcs(3);

    expect(component.project.targetGrade).toBe(1);
  });

  describe('inside the dashboard', () => {
    let hostFixture: ComponentFixture<PlannerCardHostComponent>;

    beforeEach(() => {
      hostFixture = TestBed.createComponent(PlannerCardHostComponent);
    });

    it('puts the projected grade field first in the same row as the actions', () => {
      hostFixture.componentInstance.project = buildProjectWithTasks([{dueDate: DUE}]);
      hostFixture.detectChanges();

      const row: HTMLElement = hostFixture.nativeElement.querySelector('.task-planner-row');

      expect(row.firstElementChild?.classList.contains('projected-grade-field')).toBe(true);
      expect(row.querySelector('.task-planner-actions .download-ics-link')).not.toBeNull();
    });

    it('shows the tips for students and hides them when told to', () => {
      hostFixture.componentInstance.project = buildProjectWithTasks([]);
      hostFixture.detectChanges();

      expect(hostFixture.nativeElement.querySelector('.task-planner-tips')).not.toBeNull();

      hostFixture.componentInstance.showTips = false;
      hostFixture.detectChanges();

      expect(hostFixture.nativeElement.querySelector('.task-planner-tips')).toBeNull();
    });

    it('only says students can move their own dates on units that allow it', () => {
      const tipsText = () =>
        (hostFixture.nativeElement.querySelector('.task-planner-tips') as HTMLElement).textContent;

      hostFixture.componentInstance.project = buildProjectWithTasks([], 0, false);
      hostFixture.detectChanges();
      expect(tipsText()).not.toContain('change your own target dates');

      hostFixture.componentInstance.project = buildProjectWithTasks([], 0, true);
      hostFixture.detectChanges();
      expect(tipsText()).toContain('change your own target dates');
    });
  });
});
