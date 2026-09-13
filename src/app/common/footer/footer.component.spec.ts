import {beforeEach, describe, expect, it} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Task} from 'src/app/api/models/task';
import {Unit} from 'src/app/api/models/unit';
import {UnitRole} from 'src/app/api/models/unit-role';
import {User} from 'src/app/api/models/user/user';
import {ProjectService} from 'src/app/api/services/project.service';
import {TaskService} from 'src/app/api/services/task.service';
import {UserService} from 'src/app/api/services/user.service';
import {SelectedTaskService} from 'src/app/projects/states/dashboard/selected-task.service';
import {FileDownloaderService} from '../file-downloader/file-downloader.service';
import {ConfirmationModalService} from '../modals/confirmation-modal/confirmation-modal.service';
import {DiscussedInClassReasonModalService} from '../modals/discussed-in-class-reason-modal/discussed-in-class-reason-modal.service';
import {TaskAssessmentModalService} from '../modals/task-assessment-modal/task-assessment-modal.service';
import {AlertService} from '../services/alert.service';
import {FooterComponent} from './footer.component';

const emptyProvider = {};

function staffedUnit(...roles: {id: number; userId: number}[]): Unit {
  const unit = new Unit();
  for (const {id, userId} of roles) {
    const unitRole = new UnitRole();
    unitRole.id = id;
    unitRole.user = {id: userId} as User;
    unit.staffCache.add(unitRole);
  }
  return unit;
}

function taskIn(unit: Unit, claimedByUnitRoleId: number | null = null): Task {
  const task = new Task(unit);
  task.claimedByUnitRoleId = claimedByUnitRoleId;
  return task;
}

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let currentUser: User | null;

  beforeEach(async () => {
    currentUser = {id: 1} as User;

    await TestBed.configureTestingModule({
      declarations: [FooterComponent],
      providers: [
        {provide: SelectedTaskService, useValue: emptyProvider},
        {provide: TaskService, useValue: emptyProvider},
        {provide: FileDownloaderService, useValue: emptyProvider},
        {provide: TaskAssessmentModalService, useValue: emptyProvider},
        {
          provide: UserService,
          useValue: {
            get currentUser() {
              return currentUser;
            },
          },
        },
        {provide: ProjectService, useValue: emptyProvider},
        {provide: ConfirmationModalService, useValue: emptyProvider},
        {provide: DiscussedInClassReasonModalService, useValue: emptyProvider},
        {provide: AlertService, useValue: emptyProvider},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(FooterComponent, {set: {template: ''}})
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has no staff role and no tutor notes before a task is selected', () => {
    component.selectedTask = null;

    expect(component.currentUnitRole).toBeUndefined();
    expect(component.canAccessTutorNotes).toBe(false);
    expect(component.actionButtonEnabled).toBe(false);
  });

  // An admin can open the overflow queue without holding a role in the unit, and the
  // bar used to throw reading the id of that missing role.
  it('keeps the marking buttons off, without throwing, for someone with no role in the unit', () => {
    currentUser = {id: 99} as User;
    component.viewType = 'overflow';
    component.selectedTask = taskIn(staffedUnit({id: 10, userId: 1}));

    expect(() => component.actionButtonEnabled).not.toThrow();
    expect(component.actionButtonEnabled).toBe(false);
  });

  it('turns the marking buttons on for the tutor who claimed the task', () => {
    component.viewType = 'overflow';
    component.selectedTask = taskIn(staffedUnit({id: 10, userId: 1}), 10);

    expect(component.actionButtonEnabled).toBe(true);
  });

  it('keeps the marking buttons off when another tutor holds the claim', () => {
    component.viewType = 'inbox';
    component.selectedTask = taskIn(staffedUnit({id: 10, userId: 1}, {id: 11, userId: 2}), 11);

    expect(component.actionButtonEnabled).toBe(false);
  });
});
