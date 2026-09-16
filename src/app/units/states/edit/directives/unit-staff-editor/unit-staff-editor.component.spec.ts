import {beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatSelectChange} from '@angular/material/select';
import {UnitRole} from 'src/app/api/models/unit-role';
import {UnitRoleService} from 'src/app/api/services/unit-role.service';
import {UserService} from 'src/app/api/services/user.service';
import {ConfirmationModalService} from 'src/app/common/modals/confirmation-modal/confirmation-modal.service';
import {CsvResultModalService} from 'src/app/common/modals/csv-result-modal/csv-result-modal.service';
import {TutorNotesModalService} from 'src/app/common/modals/tutor-notes-modal/tutor-notes-modal.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {BulkImportStaffModalService} from './bulk-import-staff-modal/bulk-import-staff-modal.service';
import {UnitStaffEditorComponent} from './unit-staff-editor.component';

const emptyProvider = {};

describe('UnitStaffEditorComponent', () => {
  let component: UnitStaffEditorComponent;
  let fixture: ComponentFixture<UnitStaffEditorComponent>;
  let unitRoleService: {update: ReturnType<typeof vi.fn>};

  beforeEach(async () => {
    unitRoleService = {
      update: vi.fn().mockReturnValue({
        subscribe: vi.fn(),
      }),
    };

    await TestBed.configureTestingModule({
      declarations: [UnitStaffEditorComponent],
      providers: [
        {provide: AlertService, useValue: emptyProvider},
        {provide: UnitRoleService, useValue: unitRoleService},
        {provide: UserService, useValue: emptyProvider},
        {provide: ConfirmationModalService, useValue: emptyProvider},
        {provide: TutorNotesModalService, useValue: emptyProvider},
        {provide: BulkImportStaffModalService, useValue: emptyProvider},
        {provide: CsvResultModalService, useValue: emptyProvider},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(UnitStaffEditorComponent, {
        set: {template: ''},
      })
      .compileComponents();

    fixture = TestBed.createComponent(UnitStaffEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clears an assigned mentor when (None) is selected', () => {
    const staffRole = {
      id: 1,
      mentorId: 2,
      role: 'Tutor',
      user: {
        name: 'Tutor One',
      },
    } as UnitRole;

    component.selectMentor(staffRole, {
      value: null,
    } as MatSelectChange);

    expect(staffRole.mentorId).toBeNull();
    expect(unitRoleService.update).toHaveBeenCalledWith(staffRole);
  });
});
