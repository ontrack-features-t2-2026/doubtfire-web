import {beforeEach, describe, expect, it} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Project} from 'src/app/api/models/doubtfire-model';
import {TaskVisualisationComponent} from './task-visualisation.component';

describe('TaskVisualisationComponent', () => {
  let fixture: ComponentFixture<TaskVisualisationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskVisualisationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskVisualisationComponent);
    fixture.componentInstance.project = {
      activeTasks: () => [{status: 'complete'}, {status: 'not_started'}],
    } as unknown as Project;
    fixture.detectChanges();
  });

  it('renders complete status labels without chart ellipsis or a false click affordance', () => {
    const host = fixture.nativeElement as HTMLElement;
    const cards = Array.from(host.querySelectorAll<HTMLElement>('[role="listitem"]'));
    const awaitingFeedback = cards.find((card) => card.textContent.includes('Awaiting Feedback'));

    expect(awaitingFeedback).toBeTruthy();
    expect(awaitingFeedback?.textContent).not.toContain('...');
    expect(awaitingFeedback?.getAttribute('aria-label')).toBe('Awaiting Feedback: 0');
    expect(awaitingFeedback?.tagName).toBe('DIV');
    expect(host.querySelector('ngx-charts-number-card')).toBeNull();
    expect(host.querySelector('button')).toBeNull();
  });
});
