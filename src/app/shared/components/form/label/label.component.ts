import { CommonModule } from '@angular/common';
import { Component,Input } from '@angular/core';

@Component({
  selector: 'app-label',
  imports: [CommonModule],
  templateUrl: './label.component.html',
  styles: ``,
  standalone: true
})
export class LabelComponent {
  @Input() for?: string;
  @Input() className = '';
}
