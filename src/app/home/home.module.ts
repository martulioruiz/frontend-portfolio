import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { ViewHomeComponent } from './view-home/view-home.component';
import { SceneComponent } from './components/scene/scene.component';


@NgModule({
  declarations: [
    ViewHomeComponent,
    SceneComponent
  ],
  imports: [
    CommonModule,
    HomeRoutingModule
  ]
})
export class HomeModule { }
