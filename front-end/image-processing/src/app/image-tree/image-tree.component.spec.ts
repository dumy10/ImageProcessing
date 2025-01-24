import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageTreeComponent } from './image-tree.component';

describe('ImageTreeComponent', () => {
  let component: ImageTreeComponent;
  let fixture: ComponentFixture<ImageTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageTreeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImageTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
