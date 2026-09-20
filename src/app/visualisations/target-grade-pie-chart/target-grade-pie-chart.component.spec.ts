import {NgxChartsModule} from '@swimlane/ngx-charts';
import {TestBed} from '@angular/core/testing';
import {MatCardModule} from '@angular/material/card';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {Unit} from 'src/app/api/models/unit';
import {GradeService} from 'src/app/common/services/grade.service';
import {TargetGradePieChartComponent} from './target-grade-pie-chart.component';

const data = [
  {tutorial_id: 10, tutorial_stream_id: 1, grade: 0, num: 2},
  {tutorial_id: 20, tutorial_stream_id: 1, grade: 0, num: 1},
  {tutorial_id: 20, tutorial_stream_id: 1, grade: 3, num: 1},
];

describe('TargetGradePieChartComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideNoopAnimations()],
      declarations: [TargetGradePieChartComponent],
      imports: [MatCardModule, NgxChartsModule],
    }),
  );

  it('renders grade counts, colours and rounded percentages', () => {
    const fixture = TestBed.createComponent(TargetGradePieChartComponent);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    const chart = fixture.componentInstance;
    expect(chart.series).toEqual([
      {name: 'Pass', value: 3},
      {name: 'High Distinction', value: 1},
    ]);
    expect(chart.percentage(3)).toBe(75);
    expect(chart.colors[0].value).toBe(new GradeService().gradeColors[0]);
    expect(fixture.nativeElement.querySelector('ngx-charts-pie-chart svg')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('75%');
  });

  it('respects tutorial filters and configured grade labels', () => {
    const chart = new TargetGradePieChartComponent(new GradeService());
    chart.unit = {
      gradeDefinitions: [{id: 'pass', value: 0, label: 'Satisfactory', abbreviation: 'S'}],
    } as Unit;
    chart.data = data;
    chart.tutorialId = 10;
    chart.ngOnChanges();
    expect(chart.series).toEqual([{name: 'Satisfactory', value: 2}]);
  });

  it('clears stale values and never divides by zero', () => {
    const chart = new TargetGradePieChartComponent(new GradeService());
    chart.data = data;
    chart.ngOnChanges();
    chart.data = [];
    chart.ngOnChanges();
    expect(chart.series).toEqual([]);
    expect(chart.percentage(0)).toBe(0);
  });
});
