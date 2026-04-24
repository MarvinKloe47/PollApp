import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PollDetailComponent } from './poll-detail.component';

describe('PollDetailComponent', () => {
  let component: PollDetailComponent;
  let fixture: ComponentFixture<PollDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PollDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PollDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
