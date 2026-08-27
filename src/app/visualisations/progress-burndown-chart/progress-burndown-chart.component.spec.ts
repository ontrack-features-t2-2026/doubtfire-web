import {describe, expect, it, vi} from 'vitest';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Project, Unit} from 'src/app/api/models/doubtfire-model';
import {ProgressBurndownChartComponent} from './progress-burndown-chart.component';

describe('ProgressBurndownChartComponent', () => {
  it('renders keyboard-accessible series controls outside the measured chart area', async () => {
    await TestBed.configureTestingModule({
      declarations: [ProgressBurndownChartComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProgressBurndownChartComponent);
    const component = fixture.componentInstance;
    const series = {name: 'Complete', series: [{name: '1 Jan', value: 50}]};
    component.project = {refreshBurndownChartData: vi.fn()} as unknown as Project;
    component.unit = {} as Unit;
    component.data = [series];
    component.temp = [series];
    vi.spyOn(component, 'updateData').mockImplementation(() => undefined);

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const chart = host.querySelector('.chart-container') as HTMLElement;
    const legend = host.querySelector('.burndown-legend') as HTMLElement;
    const button = legend.querySelector('button') as HTMLButtonElement;

    expect(legend).not.toBeNull();
    expect(chart.contains(legend)).toBe(false);
    expect(button.type).toBe('button');
    expect(button.textContent).toContain('Complete');
    expect(button.getAttribute('aria-pressed')).toBe('true');

    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-pressed')).toBe('false');
    // The hidden series leaves the chart data rather than being flattened to zero.
    expect(component.data).toEqual([]);
  });
});
