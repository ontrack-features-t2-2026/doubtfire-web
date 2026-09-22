import {beforeEach, describe, expect, it, vi} from 'vitest';
import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RouterLink, provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {UserService} from 'src/app/api/models/doubtfire-model';
import {IsActiveUnitRole} from 'src/app/common/pipes/is-active-unit-role.pipe';
import {DateService} from 'src/app/common/services/date.service';
import {expectAccessible} from 'src/app/common/testing/accessibility';
import {DoubtfireConstants} from 'src/app/config/constants/doubtfire-constants';
import {GlobalStateService} from 'src/app/projects/states/index/global-state.service';
import {HomeComponent} from './home.component';

describe('Home unit navigation accessibility', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    const unit = {
      id: 8,
      active: true,
      isActive: true,
      name: 'Demonstration unit',
      code: 'DEMO',
      myRole: 'Student',
      teachingPeriodProgress: 50,
    };
    await TestBed.configureTestingModule({
      imports: [CommonModule, RouterLink],
      declarations: [HomeComponent, IsActiveUnitRole],
      providers: [
        provideRouter([]),
        {provide: DoubtfireConstants, useValue: {ExternalName: {value: 'OnTrack'}}},
        {provide: UserService, useValue: {currentUser: {role: 'Tutor', preferredName: 'Demo'}}},
        {provide: DateService, useValue: {showDate: () => '2026'}},
        {
          provide: GlobalStateService,
          useValue: {
            showHeader: vi.fn(),
            setView: vi.fn(),
            onLoad: (fn: () => void) => fn(),
            unitRolesSubject: of([{unit, role: 'Tutor'}]),
            projectsSubject: of([{id: 12, unit}]),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    Object.assign(fixture.componentInstance, {$safeNavigationMigration: (value: unknown) => value});
    fixture.detectChanges();
  });

  it('renders staff and student cards as named native links with actual route destinations', () => {
    const links = [
      ...fixture.nativeElement.querySelectorAll('a.removeStyle'),
    ] as HTMLAnchorElement[];
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/units/8/tasks/inbox',
      '/projects/12/dashboard',
    ]);
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
      'Demonstration unit - Tutor',
      'Demonstration unit',
    ]);
    for (const link of links) {
      expect(link.tabIndex).toBe(0);
      link.focus();
      expect(document.activeElement).toBe(link);
      expect(link.querySelector('button, a, input, [tabindex="0"]')).toBeNull();
    }
  });

  it('does not create navigation stops for inactive units', () => {
    fixture.componentInstance.unitRoles = [];
    fixture.componentInstance.projects = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a.removeStyle')).toBeNull();
  });

  it('passes automated accessibility checks for the student and staff entry points', async () => {
    await fixture.whenStable();
    await expectAccessible(fixture.nativeElement);
  });

  it('uses one control for each view-all destination', () => {
    expect(fixture.nativeElement.querySelector('a button')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/dashboard"]')).toBeTruthy();
  });
});
