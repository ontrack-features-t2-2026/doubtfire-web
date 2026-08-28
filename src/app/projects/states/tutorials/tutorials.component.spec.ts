import {beforeEach, describe, expect, it} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute} from '@angular/router';
import {TutorialsComponent} from './tutorials.component';

describe('TutorialsComponent', () => {
  let component: TutorialsComponent;
  let fixture: ComponentFixture<TutorialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialsComponent],
      providers: [{provide: ActivatedRoute, useValue: {}}],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(TutorialsComponent, {set: {template: ''}})
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TutorialsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Regression: shortTime used to call padStart on an undefined minutes value
  // and throw for any meeting time that was not in HH:mm form.
  it('pads a well-formed time', () => {
    expect(component.shortTime('09:05')).toBe('09:05');
    expect(component.shortTime('9:5')).toBe('09:05');
  });

  it('returns malformed or empty input without throwing', () => {
    expect(component.shortTime('9am')).toBe('9am');
    expect(component.shortTime('')).toBe('');
    expect(component.shortTime(undefined)).toBe('');
  });
});
