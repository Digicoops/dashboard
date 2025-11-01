import { CommonModule } from '@angular/common';
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {Option, SelectComponent} from "../../form/select/select.component";
import {PhoneInputComponent} from "../../form/group-input/phone-input/phone-input.component";
import countries from "@amcharts/amcharts5-geodata/data/countries";


@Component({
  selector: 'app-signup-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    SelectComponent,
    PhoneInputComponent,
  ],
  templateUrl: './signup-form.component.html',
  styles: ``
})
export class SignupFormComponent implements OnInit{

  showPassword = false;
  isChecked = false;

  fname = '';
  lname = '';
  email = '';
  password = '';


  @Input() options: Option[] = [
    { value: 'personal', label: 'Personnel' },
    { value: 'cooperative', label: 'Cooperative' },
  ];
  @Input() placeholder: string = 'Select an option';
  @Input() className: string = '';
  @Input() defaultValue: string = '';
  @Input() value: string = '';
  @Input() selectedValue: string = '';

  @Output() valueChange = new EventEmitter<string>();

  ngOnInit() {
    if (!this.value && this.defaultValue) {
      this.value = this.defaultValue;
    }
  }

  onChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.value = value;
    this.valueChange.emit(value);
  }

  handleSelectChange(value: string) {
    console.log('Selected value:', value);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    console.log('First Name:', this.fname);
    console.log('Last Name:', this.lname);
    console.log('Email:', this.email);
    console.log('Password:', this.password);
    console.log('Remember Me:', this.isChecked);
  }
  countries = [
    { code: 'US', label: '+1' },
    { code: 'GB', label: '+44' },
    { code: 'CA', label: '+1' },
    { code: 'AU', label: '+61' },
  ];

  handlePhoneNumberChange(phoneNumber: string) {
    console.log('Updated phone number:', phoneNumber);
  }
}
