import {beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {defer, of, throwError} from 'rxjs';
import {AlertService} from 'src/app/common/services/alert.service';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {FileDownloaderService} from 'src/app/common/file-downloader/file-downloader.service';
import {EditProfileDialogService} from 'src/app/common/modals/edit-profile-dialog/edit-profile-dialog.service';
import {UserService} from 'src/app/api/models/doubtfire-model';
import {FUsersComponent} from './users.component';

const emptyProvider = {};

describe('FUsersComponent', () => {
  let component: FUsersComponent;
  let fixture: ComponentFixture<FUsersComponent>;

  let fetchAllSubscribed: boolean;
  let userService: {
    query: ReturnType<typeof vi.fn>;
    fetchAll: ReturnType<typeof vi.fn>;
    csvURL: string;
  };
  let alerts: {
    error: ReturnType<typeof vi.fn>;
  };

  const uploadEvent = (): unknown => ({
    body: {success: ['a'], errors: [], ignored: []},
  });

  beforeEach(async () => {
    fetchAllSubscribed = false;

    userService = {
      // ngOnInit still calls query().subscribe() to populate the cache on load -
      // that path is untouched by this fix, so it just needs to not blow up.
      query: vi.fn().mockReturnValue(of([])),
      fetchAll: vi.fn(() =>
        defer(() => {
          fetchAllSubscribed = true;
          return of([]);
        }),
      ),
      csvURL: '/api/csv/users',
    };

    alerts = {
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [FUsersComponent],
      providers: [
        {provide: UserService, useValue: userService},
        {provide: EditProfileDialogService, useValue: emptyProvider},
        {provide: DoubtfireConstants, useValue: {ExternalName: of('Doubtfire')}},
        {provide: FileDownloaderService, useValue: emptyProvider},
        {provide: AlertService, useValue: alerts},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(FUsersComponent, {set: {template: ''}})
      .compileComponents();

    fixture = TestBed.createComponent(FUsersComponent);
    component = fixture.componentInstance;
  });

  it('refetches the user list from the server after a CSV upload succeeds', () => {
    component.ngOnInit();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).onUserUploadSuccess(uploadEvent());

    expect(userService.fetchAll).toHaveBeenCalledOnce();
    expect(fetchAllSubscribed).toBe(true);
  });

  it('surfaces an alert if the post-upload refetch fails, instead of failing silently', () => {
    userService.fetchAll = vi.fn(() => throwError(() => new Error('network error')));
    component.ngOnInit();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).onUserUploadSuccess(uploadEvent());

    expect(alerts.error).toHaveBeenCalledWith(expect.any(Error));
  });
});
