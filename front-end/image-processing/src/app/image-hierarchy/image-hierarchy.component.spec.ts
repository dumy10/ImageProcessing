import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageHierarchyComponent } from './image-hierarchy.component';

describe('ImageHierarchyComponent', () => {
  let component: ImageHierarchyComponent;
  let fixture: ComponentFixture<ImageHierarchyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageHierarchyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImageHierarchyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
