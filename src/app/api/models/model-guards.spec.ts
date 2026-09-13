import {describe, expect, it, vi} from 'vitest';
import {Injector} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Observable} from 'rxjs';
import {ProjectService} from 'src/app/api/services/project.service';
import {setAppInjector} from 'src/app/app-injector';
import {AlertService} from 'src/app/common/services/alert.service';
import {Project} from './project';
import {Tutorial} from './tutorial/tutorial';
import {Unit} from './unit';

describe('Project.isEnrolledIn', () => {
  it('is false for a group left without a tutorial, instead of throwing', () => {
    const project = new Project(new Unit());

    expect(project.isEnrolledIn(undefined)).toBe(false);
  });
});

describe('Tutorial.description', () => {
  it('still describes a tutorial saved without a meeting day', () => {
    const tutorial = new Tutorial(new Unit());
    tutorial.meetingTime = '10:00';
    tutorial.meetingLocation = 'Room 4';

    expect(tutorial.description).toBe('No day set at 10:00 by  in Room 4');
  });
});

describe('Unit.refreshStudents', () => {
  it('sends the request, which it used to build and never subscribe to', () => {
    let subscribed = false;
    const loadStudents = vi.fn(
      () =>
        new Observable<Project[]>(() => {
          subscribed = true;
        }),
    );

    TestBed.configureTestingModule({
      providers: [
        {provide: ProjectService, useValue: {loadStudents}},
        {provide: AlertService, useValue: {error: vi.fn()}},
      ],
    });
    setAppInjector(TestBed.inject(Injector));

    const unit = new Unit();
    unit.refreshStudents(true);

    expect(loadStudents).toHaveBeenCalledWith(unit, true, true);
    expect(subscribed).toBe(true);
  });
});
