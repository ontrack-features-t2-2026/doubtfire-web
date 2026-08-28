import {HotkeysService} from '@ngneat/hotkeys';
import {beforeEach, describe, expect, it} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from 'src/app/api/models/doubtfire-model';
import {Task} from 'src/app/api/models/task';
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
};
const emptyProvider = {};

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
        {provide: UserService, useValue: emptyProvider},
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

  beforeEach(() => {
    fixture = TestBed.createComponent(StaffTaskListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('row actions', () => {
    let task: Task;

    beforeEach(() => {
      task = {id: 4, hover: false, optionsOpened: false} as Task;
    });

    it('reveals the row actions when the pointer is over the row', () => {
      component.showTaskActionsForPointer(task);

      expect(component.rowActionsShown(task)).toBe(true);
    });

    it('leaves the row actions alone on a device that has opted out of hover', () => {
      component.allowHover = false;

      component.showTaskActionsForPointer(task);

      expect(component.rowActionsShown(task)).toBe(false);
    });

    it('reveals the row actions when the options button takes keyboard focus', () => {
      component.showTaskActionsForFocus(task);

      expect(component.rowActionsShown(task)).toBe(true);
    });

    it('still reveals the row actions on focus where hover is not available', () => {
      component.allowHover = false;

      component.showTaskActionsForFocus(task);

      expect(component.rowActionsShown(task)).toBe(true);
    });

    it('hides the row actions again once focus leaves', () => {
      component.showTaskActionsForFocus(task);
      component.hideTaskActionsForFocus(task);

      expect(component.rowActionsShown(task)).toBe(false);
    });

    it('keeps the row actions up while the overflow menu holds the focus', () => {
      component.showTaskActionsForFocus(task);
      task.optionsOpened = true;
      component.hideTaskActionsForFocus(task);

      expect(component.rowActionsShown(task)).toBe(true);
    });

    it('holds only one row open at a time', () => {
      const other = {id: 5, hover: false, optionsOpened: false} as Task;

      component.showTaskActionsForFocus(task);
      component.showTaskActionsForFocus(other);

      expect(component.rowActionsShown(task)).toBe(false);
      expect(component.rowActionsShown(other)).toBe(true);
    });

    it('does not let a late blur close a row another row already claimed', () => {
      const other = {id: 5, hover: false, optionsOpened: false} as Task;

      component.showTaskActionsForFocus(task);
      component.showTaskActionsForFocus(other);
      component.hideTaskActionsForFocus(task);

      expect(component.rowActionsShown(other)).toBe(true);
    });

    // The regression this pair guards: blur used to run the same handler as mouseout, so
    // tabbing off the options button faded it out from under a pointer still on the row.
    it('keeps the row actions up when focus leaves but the pointer is still on the row', () => {
      component.showTaskActionsForPointer(task);
      component.showTaskActionsForFocus(task);
      component.hideTaskActionsForFocus(task);

      expect(component.rowActionsShown(task)).toBe(true);
    });

    it('keeps the row actions up when the pointer leaves but focus is still on the button', () => {
      component.showTaskActionsForPointer(task);
      component.showTaskActionsForFocus(task);
      component.hideTaskActions(task);

      expect(component.rowActionsShown(task)).toBe(true);
    });

    it('closes the row only once both the pointer and the keyboard have left', () => {
      component.showTaskActionsForPointer(task);
      component.showTaskActionsForFocus(task);
      component.hideTaskActions(task);
      component.hideTaskActionsForFocus(task);

      expect(component.rowActionsShown(task)).toBe(false);
    });
  });
});
