import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {SkeletonLoaderComponent} from './skeleton-loader.component';

describe('SkeletonLoaderComponent', () => {
  let component: SkeletonLoaderComponent;
  let fixture: ComponentFixture<SkeletonLoaderComponent>;

  const placeholders = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('ngx-skeleton-loader'));

  // The element ngx-skeleton-loader itself renders the theme onto, as an
  // inline style. Reaching one level past the host is what makes the shape
  // test below discriminating rather than a check of our own template.
  const renderedHeight = (index: number): string =>
    (placeholders()[index].querySelector('.skeleton-loader') as HTMLElement).style.height;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonLoaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonLoaderComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to three row placeholders', () => {
    fixture.detectChanges();

    expect(placeholders()).toHaveLength(3);
  });

  it('renders the configured number of placeholders', () => {
    component.count = 5;
    fixture.detectChanges();

    expect(placeholders()).toHaveLength(5);
  });

  it('renders nothing for a count of zero', () => {
    component.count = 0;
    fixture.detectChanges();

    expect(placeholders()).toHaveLength(0);
  });

  // Discriminating: a shape-blind implementation could satisfy the count
  // tests above by rendering the same markup for every placeholder
  // regardless of `shape`. This fails unless the two shapes actually render
  // a visibly different placeholder height.
  it('renders a taller placeholder for the card shape than for the row shape', () => {
    component.shape = 'row';
    component.count = 1;
    fixture.detectChanges();
    const rowHeight = renderedHeight(0);

    component.shape = 'card';
    fixture.detectChanges();
    const cardHeight = renderedHeight(0);

    expect(rowHeight).toBe('48px');
    expect(cardHeight).toBe('120px');
    expect(cardHeight).not.toEqual(rowHeight);
  });

  it('hides the placeholders from assistive technology, since they carry no content', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
