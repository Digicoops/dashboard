import { CommonModule } from '@angular/common';
import {Component } from '@angular/core';
import {  RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-coming-soon-shared',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './coming-soon-shared.component.html',

})
export class ComingSoonComponentShared {


}