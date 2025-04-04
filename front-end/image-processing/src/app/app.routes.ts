import { Routes } from '@angular/router';
import { EditImageComponent } from './edit-image/edit-image.component';
import { GalleryComponent } from './gallery/gallery.component';
import { HomeComponent } from './home/home.component';
import { ImageTreeViewComponent } from './image-tree-view/image-tree-view.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'edit/:id', component: EditImageComponent },
  { path: 'image-tree/:id', component: ImageTreeViewComponent },
];
