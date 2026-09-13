import {describe, expect, it, vi} from 'vitest';
import {of, throwError} from 'rxjs';
import {Unit} from 'src/app/api/models/unit';
import {StudentTutorialSelectComponent} from './student-tutorial-select/student-tutorial-select.component';
import {UnitStudentsEditorComponent} from './unit-students-editor.component';

function project(id: number, firstName: string, lastName: string, extra: object = {}) {
  return {
    id,
    key: id,
    enrolled: true,
    campus: null,
    student: {
      username: `${firstName.toLowerCase()}${id}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}@uni.edu`,
      name: `${firstName} ${lastName}`,
    },
    updateUnitEnrolment: vi.fn(),
    matches: () => true,
    ...extra,
  };
}

function editorFor(loadStudents: () => unknown = () => of([])) {
  const unit = Object.assign(new Unit(), {id: 3, code: 'SIT101'});
  const projectService = {loadStudents: vi.fn(loadStudents)};

  const component = new UnitStudentsEditorComponent(
    {} as never, // httpClient
    {} as never, // enrolModal
    {} as never, // alerts
    {} as never, // csvUploadModal
    {} as never, // csvResultModal
    {} as never, // fileDownloader
    {navigate: vi.fn()} as never, // router
    projectService as never,
    {} as never, // specConModalService
    {} as never, // sidekiqProgressModalService
  );
  component.unit = unit;
  return {component, unit, projectService};
}

const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('UnitStudentsEditorComponent', () => {
  // The name and email columns are on the student, not the project, so sorting on
  // them compared undefined and scrambled the list.
  it('sorts on the student details each column shows', () => {
    const {component} = editorFor();
    const zoe = project(1, 'Zoe', 'Adams');
    const amy = project(2, 'amy', 'Young', {enrolled: false, campus: {name: 'Burwood'}});

    expect(component.sortValue(zoe as never, 'firstName')).toBe('zoe');
    expect(component.sortValue(amy as never, 'firstName')).toBe('amy');
    expect(component.sortValue(zoe as never, 'lastName')).toBe('adams');
    expect(component.sortValue(amy as never, 'email')).toBe('amy@uni.edu');
    expect(component.sortValue(amy as never, 'campus')).toBe('burwood');
    expect(component.sortValue(amy as never, 'enrolled')).toBe(0);

    component.ngOnInit();
    component.dataSource.data = [zoe, amy] as never;
    const sorted = component.dataSource.sortData(component.dataSource.data, {
      active: 'firstName',
      direction: 'asc',
    } as never);
    expect(sorted.map((row) => row.id)).toEqual([2, 1]);
  });

  it('saves the enrolment when the box changes', () => {
    const {component} = editorFor();
    const zoe = project(1, 'Zoe', 'Adams');

    component.enrolmentChanged(zoe as never);

    expect(zoe.updateUnitEnrolment).toHaveBeenCalledTimes(1);
  });

  it('says when the students cannot be loaded, and can try again', async () => {
    const {component, projectService} = editorFor(() => throwError(() => 'offline'));

    component.ngOnInit();
    await settle();

    expect(component.loadingStudents).toBe(false);
    expect(component.loadError).toBe(true);

    projectService.loadStudents.mockReturnValue(of([]));
    component.reloadStudents();
    expect(component.loadError).toBe(false);
    await settle();
    expect(component.loadingStudents).toBe(false);
    expect(component.loadError).toBe(false);
    component.ngOnDestroy();
  });

  it('tells a search with no matches apart from an empty unit', () => {
    const {component} = editorFor();
    component.ngOnInit();

    expect(component.filtering).toBe(false);
    component.applyFilter({target: {value: '  Zo '}} as never);
    expect(component.filtering).toBe(true);
    expect(component.dataSource.filter).toBe('zo');
    component.ngOnDestroy();
  });
});

describe('StudentTutorialSelectComponent', () => {
  // Tutorials were changed on click, so picking one with the keyboard did nothing.
  it('moves the student when they pick a tutorial, however it was picked', () => {
    const select = new StudentTutorialSelectComponent();
    const student = {switchToTutorial: vi.fn()};
    select.student = student as never;
    const tutorial = {id: 4};

    select.tutorialPicked({isUserInput: true} as never, tutorial as never);
    expect(student.switchToTutorial).toHaveBeenCalledWith(tutorial);

    // The list redrawing after an enrolment is not the user picking anything.
    select.tutorialPicked({isUserInput: false} as never, tutorial as never);
    expect(student.switchToTutorial).toHaveBeenCalledTimes(1);
  });
});
