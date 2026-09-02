import {describe, expect, it} from 'vitest';
import {Task} from './task';

describe('Task submission history', () => {
  it('distinguishes a first submission from current and returned submission states', () => {
    const task = new Task();
    task.status = 'not_started';
    expect(task.hasSubmissionHistory()).toBe(false);

    task.status = 'ready_for_feedback';
    expect(task.hasSubmissionHistory()).toBe(true);

    task.status = 'redo';
    expect(task.hasSubmissionHistory()).toBe(true);
  });

  it('retains history while status changes when a timestamp or artifact exists', () => {
    const task = new Task();
    task.status = 'working_on_it';

    task.submissionDate = new Date('2026-08-31T00:00:00Z');
    expect(task.hasSubmissionHistory()).toBe(true);

    task.submissionDate = undefined;
    task.hasPdf = true;
    expect(task.hasSubmissionHistory()).toBe(true);

    task.hasPdf = false;
    task.processingPdf = true;
    expect(task.hasSubmissionHistory()).toBe(true);

    task.processingPdf = false;
    task.submissionProcessingState = 'failed';
    expect(task.hasSubmissionHistory()).toBe(true);
  });
});
