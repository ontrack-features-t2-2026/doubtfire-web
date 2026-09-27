import {beforeEach, describe, expect, it} from 'vitest';
import {Directive, Input, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';
import {GroupSet, Unit} from 'src/app/api/models/doubtfire-model';
import {GroupSetService} from 'src/app/api/services/group-set.service';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {ConfirmationModalService} from 'src/app/common/modals/confirmation-modal/confirmation-modal.service';
import {CsvResultModalService} from 'src/app/common/modals/csv-result-modal/csv-result-modal.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {UnitGroupSetEditorComponent} from './unit-group-set-editor.component';

@Directive({selector: 'f-file-uploader'})
class FileUploaderStub {
  @Input() onComplete: unknown;
  @Input() onSuccess: unknown;
}

describe('UnitGroupSetEditorComponent field names', () => {
  let fixture: ComponentFixture<UnitGroupSetEditorComponent>;
  let groupSet: GroupSet;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UnitGroupSetEditorComponent],
      imports: [
        FileUploaderStub,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTableModule,
      ],
      providers: [
        GroupSetService,
        AlertService,
        FileDownloaderService,
        CsvResultModalService,
        ConfirmationModalService,
      ].map((provide) => ({provide, useValue: {}})),
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    groupSet = {
      id: 1,
      name: 'Project teams',
      capacity: 4,
      groupCSVUploadUrl: () => '',
      groupStudentCSVUploadUrl: () => '',
    } as unknown as GroupSet;
    fixture = TestBed.createComponent(UnitGroupSetEditorComponent);
    fixture.componentRef.setInput('unit', {groupSets: [groupSet]} as unknown as Unit);
    fixture.componentInstance.startEditGroupSet(groupSet);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('names every editable table field without adding floating labels to the row', () => {
    const controls: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input, mat-select'),
    );
    expect(controls.map((control) => control.getAttribute('aria-label'))).toEqual([
      'Name',
      'Capacity',
      'Create Groups',
      'Manage Groups',
      'Restrict to Tutorials',
    ]);
    expect(fixture.nativeElement.querySelector('mat-label')).toBeNull();
  });

  it('preserves names when an empty name and unlimited capacity are edited', async () => {
    fixture.componentInstance.cancelEditGroupSet();
    groupSet.name = '';
    groupSet.capacity = null;
    fixture.componentInstance.startEditGroupSet(groupSet);
    fixture.detectChanges();
    await fixture.whenStable();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[aria-label="Name"]');
    const capacity: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[aria-label="Capacity"]',
    );
    expect(input.value).toBe('');
    expect(capacity.value).toBe('');
  });
});
