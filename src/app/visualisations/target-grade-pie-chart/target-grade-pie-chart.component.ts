import {ChangeDetectionStrategy, Component, Input, OnChanges} from '@angular/core';
import {Unit} from 'src/app/api/models/unit';
import {TargetGradeStat} from 'src/app/api/services/unit.service';
import {GradeService} from 'src/app/common/services/grade.service';

@Component({
  selector: 'f-target-grade-pie-chart',
  templateUrl: './target-grade-pie-chart.component.html',
  styleUrls: ['../unit-analytics-chart.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class TargetGradePieChartComponent implements OnChanges {
  @Input() unit: Unit;
  @Input() data: TargetGradeStat[] = [];
  @Input() tutorialId: number | null = null;
  series: {name: string; value: number}[] = [];
  colors: {name: string; value: string}[] = [];
  total = 0;

  constructor(private grades: GradeService) {}

  ngOnChanges(): void {
    const counts: Map<number, number> = new Map();
    (this.data ?? []).forEach(({tutorial_id, grade, num}) => {
      if (
        (this.tutorialId === null || tutorial_id === this.tutorialId) &&
        Number.isFinite(num) &&
        num > 0
      ) {
        counts.set(grade, (counts.get(grade) ?? 0) + num);
      }
    });
    this.series = Array.from(counts)
      .sort(([a], [b]) => a - b)
      .map(([grade, value]) => ({
        name: this.grades.gradeLabel(grade, this.unit) ?? `Grade ${grade}`,
        value,
      }));
    this.colors = Array.from(counts.keys()).map((grade) => ({
      name: this.grades.gradeLabel(grade, this.unit) ?? `Grade ${grade}`,
      value: this.grades.gradeColors[grade] ?? '#808080',
    }));
    this.total = this.series.reduce((sum, row) => sum + row.value, 0);
  }

  percentage(value: number): number {
    return this.total ? Math.round((value / this.total) * 100) : 0;
  }
}
