import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatTableModule} from '@angular/material/table';
import {Project} from 'src/app/api/models/project';
import {Unit} from 'src/app/api/models/unit';
import {TaskService} from 'src/app/api/services/task.service';
import {UnitService} from 'src/app/api/services/unit.service';
import {UserService} from 'src/app/api/services/user.service';
import {EmptyStateComponent} from 'src/app/common/empty-state/empty-state.component';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {SidekiqProgressModalService} from 'src/app/common/modals/sidekiq-progress-modal/sidekiq-progress-modal.service';
import {AlertService} from 'src/app/common/services/alert.service';
import {GradeService} from 'src/app/common/services/grade.service';
import {D2lTransferModal} from '../../d2l-transfer-modal/d2l-transfer.component';
import {PortfoliosListComponent} from './portfolios-list.component';

function projectStub(name: string): Project {
  return {
    student: {name, username: name.toLowerCase()},
    tutorNames: () => '',
    shortTutorialDescription: () => '',
    taskStats: [],
  } as unknown as Project;
}

describe('PortfoliosListComponent empty state', () => {
  afterEach(() => vi.restoreAllMocks());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PortfoliosListComponent],
      imports: [MatTableModule, EmptyStateComponent],
      providers: [
        {
          provide: TaskService,
          useValue: {statusColors: new Map(), statusLabels: new Map()},
        },
        {provide: UserService, useValue: {}},
        {provide: GradeService, useValue: {gradeValuesFor: () => [], gradeLabel: () => ''}},
        {provide: FileDownloaderService, useValue: {}},
        {provide: UnitService, useValue: {}},
        {provide: AlertService, useValue: {}},
        {provide: SidekiqProgressModalService, useValue: {}},
        {provide: D2lTransferModal, useValue: {}},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('renders the empty state only while the filtered list has no rows', () => {
    const fixture = TestBed.createComponent(PortfoliosListComponent);
    const component = fixture.componentInstance;
    component.unit = {hasD2lMapping: () => false} as unknown as Unit;
    component.displayedColumns = ['student', 'name', 'tutor', 'tutorial'];

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('f-empty-state')).toBeTruthy();

    component.dataSource.data = [projectStub('Cy Cole')];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('f-empty-state')).toBeFalsy();
  });
});
