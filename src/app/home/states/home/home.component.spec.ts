import {beforeEach, describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {Project, UnitRole, UserService} from 'src/app/api/models/doubtfire-model';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {GlobalStateService} from 'src/app/projects/states/index/global-state.service';
import {HomeComponent} from './home.component';

function projectIn(myRole: string, id: number): Project {
  return {id, unit: {myRole}} as unknown as Project;
}

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let unitRoles$: BehaviorSubject<UnitRole[]>;
  let projects$: BehaviorSubject<Project[]>;

  beforeEach(async () => {
    unitRoles$ = new BehaviorSubject<UnitRole[]>([]);
    projects$ = new BehaviorSubject<Project[]>([]);

    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [
        {provide: DoubtfireConstants, useValue: {ExternalName: {value: 'OnTrack'}}},
        {
          provide: GlobalStateService,
          useValue: {
            showHeader: vi.fn(),
            setView: vi.fn(),
            isLoadingSubject: new BehaviorSubject(false),
            unitRolesSubject: unitRoles$,
            projectsSubject: projects$,
          },
        },
        {provide: UserService, useValue: {currentUser: {role: 'Tutor', firstName: 'Ada'}}},
        {provide: Router, useValue: {navigateByUrl: vi.fn()}},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(HomeComponent, {set: {template: ''}})
      .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // A sign out, or a project that is still being mapped, left a project with no unit in
  // the cache, and the unguarded filter threw "reading 'myRole'" out of the subscription.
  it('skips a project that has no unit instead of throwing', () => {
    const studying = projectIn('Student', 1);

    expect(() =>
      projects$.next([{id: 2} as Project, studying, projectIn('Tutor', 3), null]),
    ).not.toThrow();

    expect(component.projects).toEqual([studying]);
  });
});
