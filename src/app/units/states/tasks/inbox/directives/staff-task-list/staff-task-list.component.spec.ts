import '@angular/compiler';
import {HotkeysService} from '@ngneat/hotkeys';
import {beforeEach, describe, expect, it} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {EMPTY} from 'rxjs';
import {UserService} from 'src/app/api/models/doubtfire-model';
import {TaskDefinitionService} from 'src/app/api/services/task-definition.service';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {CsvResultModalService} from 'src/app/common/modals/csv-result-modal/csv-result-modal.service';
import {CsvUploadModalService} from 'src/app/common/modals/csv-upload-modal/csv-upload-modal.service';
import {SidekiqProgressModalService} from 'src/app/common/modals/sidekiq-progress-modal/sidekiq-progress-modal.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {SelectedTaskService} from 'src/app/projects/states/dashboard/selected-task.service';
import {StaffTaskListComponent} from './staff-task-list.component';

const hotkeysServiceStub = {
  removeShortcuts: () => {},
  getHotkeys: () => [],
  addShortcut: () => ({subscribe: () => {}}),
};
const userServiceStub = {
  currentUser: {name: 'Test User'},
};
const emptyProvider = {};

const EMPTY_STATE_TEMPLATE = `
  <div class="center-task-list" [hidden]="loading || filteredTasks?.length !== 0 || isNarrow">
    <mat-icon aria-hidden="true">done_all</mat-icon>
    <p>No tasks match these filters.</p>
  </div>
`;

describe('StaffTaskListComponent', () => {
  let component: StaffTaskListComponent;
  let fixture: ComponentFixture<StaffTaskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StaffTaskListComponent],
      providers: [
        {provide: SelectedTaskService, useValue: emptyProvider},
        {provide: AlertService, useValue: emptyProvider},
        {provide: FileDownloaderService, useValue: emptyProvider},
        {provide: MatDialog, useValue: emptyProvider},
        {provide: CsvUploadModalService, useValue: emptyProvider},
        {provide: CsvResultModalService, useValue: emptyProvider},
        {provide: UserService, useValue: userServiceStub},
        {provide: HotkeysService, useValue: hotkeysServiceStub},
        {provide: Router, useValue: emptyProvider},
        {provide: ActivatedRoute, useValue: emptyProvider},
        {provide: TaskDefinitionService, useValue: emptyProvider},
        {provide: SidekiqProgressModalService, useValue: emptyProvider},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(StaffTaskListComponent, {set: {template: ''}})
      .compileComponents();
  });

  const setupComponentInputs = () => {
    component.unit = {
      tutorialsForUserName: () => [],
      staff: [],
      tutorials: [],
    } as any;
    component.unitRole = {role: 'Tutor', id: 1} as any;
    component.taskData = {
      source: () => EMPTY,
      selectedTask: null,
      taskKey: null,
      onSelectedTaskChange: () => {},
      taskDefMode: false,
    } as any;
    component.tasks = [];
  };

  it('should create', () => {
    fixture = TestBed.createComponent(StaffTaskListComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('renders empty-state text when filtered task list is empty', () => {
    TestBed.overrideComponent(StaffTaskListComponent, {
      set: {template: EMPTY_STATE_TEMPLATE},
    });
    fixture = TestBed.createComponent(StaffTaskListComponent);
    component = fixture.componentInstance;
    setupComponentInputs();
    fixture.detectChanges();

    component.filteredTasks = [];
    component.loading = false;
    component.isNarrow = false;
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.center-task-list');
    expect(container.hidden).toBe(false);

    const emptyText = fixture.nativeElement.querySelector('.center-task-list p');
    expect(emptyText.textContent).toContain('No tasks match these filters.');
  });

  it('does not render empty-state text when tasks are present', () => {
    TestBed.overrideComponent(StaffTaskListComponent, {
      set: {template: EMPTY_STATE_TEMPLATE},
    });
    fixture = TestBed.createComponent(StaffTaskListComponent);
    component = fixture.componentInstance;
    setupComponentInputs();
    fixture.detectChanges();

    component.filteredTasks = [{} as any];
    component.loading = false;
    component.isNarrow = false;
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.center-task-list');
    expect(container.hidden).toBe(true);
  });
});