import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BehaviorSubject} from 'rxjs';
import {MatCardModule} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

import {PeerProgressComponent} from './peer-progress.component';
import {GlobalStateService} from '../index/global-state.service';

describe('PeerProgressComponent', () => {
  let component: PeerProgressComponent;
  let fixture: ComponentFixture<PeerProgressComponent>;

  beforeEach(async () => {
    const globalStateServiceStub = {
      currentViewAndEntitySubject$: new BehaviorSubject<{viewType: string; entity: unknown} | null>(
        null,
      ),
    };

    await TestBed.configureTestingModule({
      declarations: [PeerProgressComponent],
      imports: [MatCardModule, MatProgressSpinnerModule, NoopAnimationsModule],
      providers: [{provide: GlobalStateService, useValue: globalStateServiceStub}],
    }).compileComponents();

    fixture = TestBed.createComponent(PeerProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
