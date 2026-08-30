import {describe, expect, it} from 'vitest';
import type {Sort} from '@angular/material/sort';
import {UnitStudentsEditorComponent} from './unit-students-editor.component';

// sortTableData sorted the four name/email columns by a[sort.active], but those keys
// live on the nested student, not on Project, so every key was undefined and V8 got an
// inconsistent comparator and returned an arbitrary permutation. It now reads through
// student, keeps enrolled on the project, and sortCompare returns 0 for equal values.
type Row = {
  student?: {username?: string; firstName?: string; lastName?: string; email?: string};
  enrolled?: boolean;
};

function editorWith(rows: Row[]): UnitStudentsEditorComponent {
  const component = Object.create(
    UnitStudentsEditorComponent.prototype,
  ) as UnitStudentsEditorComponent;
  (component as unknown as {dataSource: {data: Row[]}}).dataSource = {data: rows};
  return component;
}

const lastNames = (c: UnitStudentsEditorComponent) =>
  (c as unknown as {dataSource: {data: Row[]}}).dataSource.data.map((r) => r.student.lastName);

describe('UnitStudentsEditorComponent sortTableData', () => {
  it('sorts by last name through the nested student', () => {
    const c = editorWith([
      {student: {lastName: 'Charlie'}},
      {student: {lastName: 'Alpha'}},
      {student: {lastName: 'Bravo'}},
    ]);

    c.sortTableData({active: 'lastName', direction: 'asc'} as Sort);

    expect(lastNames(c)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('sorts by username descending', () => {
    const c = editorWith([
      {student: {username: 'aaa'}},
      {student: {username: 'ccc'}},
      {student: {username: 'bbb'}},
    ]);

    c.sortTableData({active: 'username', direction: 'desc'} as Sort);

    const order = (c as unknown as {dataSource: {data: Row[]}}).dataSource.data.map(
      (r) => r.student.username,
    );
    expect(order).toEqual(['ccc', 'bbb', 'aaa']);
  });

  it('still sorts enrolled off the project', () => {
    const c = editorWith([{enrolled: true}, {enrolled: false}, {enrolled: true}]);

    c.sortTableData({active: 'enrolled', direction: 'asc'} as Sort);

    const order = (c as unknown as {dataSource: {data: Row[]}}).dataSource.data.map(
      (r) => r.enrolled,
    );
    expect(order).toEqual([false, true, true]);
  });

  it('sortCompare returns 0 for equal values so the sort is stable', () => {
    const c = editorWith([]);
    const sortCompare = (
      c as unknown as {sortCompare: (a: unknown, b: unknown, asc: boolean) => number}
    ).sortCompare.bind(c);

    expect(sortCompare('same', 'same', true)).toBe(0);
    expect(sortCompare('a', 'b', true)).toBe(-1);
    expect(sortCompare('a', 'b', false)).toBe(1);
  });
});
