import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ImageHierarchyComponent } from './image-hierarchy.component';

describe('ImageHierarchyComponent', () => {
  let component: ImageHierarchyComponent;
  let fixture: ComponentFixture<ImageHierarchyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageHierarchyComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: jasmine.createSpy('close') },
        },
        { provide: MAT_DIALOG_DATA, useValue: [] },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageHierarchyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close the dialog', () => {
    component.closeDialog();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it('should handle image error', () => {
    const imageModel = { url: 'invalid-url' } as any;
    component.onImageError(imageModel);
    expect(imageModel.url).toBe('assets/images/notfound.jpg');
  });
});
