import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Option, SelectComponent } from "../../form/select/select.component";
import { PhoneInputComponent } from "../../form/group-input/phone-input/phone-input.component";
import {AuthManagementService} from "../../../../core/services/auth/auth-managment.service";

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
export class SignupFormComponent implements OnInit {

  showPassword = false;
  isChecked = false;

  // Champs pré-remplis
  fname = 'John';
  lname = 'Doe';
  shopName = 'Ma Boutique';
  email = 'yofabo5628@hh7f.com';
  password = 'yofabo5628@hh7f.com';
  phone = '221776606106';

  @Input() options: Option[] = [
    { value: 'personal', label: 'Personnel' },
    { value: 'cooperative', label: 'Cooperative' },
  ];
  @Input() placeholder: string = 'Select an option';
  @Input() className: string = '';
  @Input() defaultValue: string = '';
  selectedValue: string = 'personal'; // Pré-sélectionné

  @Output() valueChange = new EventEmitter<string>();

  countries = [
    { code: 'SN', label: '+221' },
  ];

  constructor(private authManagement: AuthManagementService, private router: Router) {}

  ngOnInit() {
    if (!this.selectedValue && this.defaultValue) {
      this.selectedValue = this.defaultValue;
    }
  }

  handleSelectChange(value: string) {
    console.log('Selected value:', value);
    this.selectedValue = value;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  handlePhoneNumberChange(phoneNumber: string) {
    console.log('Updated phone number:', phoneNumber);
    this.phone = phoneNumber;
  }
  async onSubmit() {
    const signUpData = {
      first_name: this.fname,
      last_name: this.lname,
      shop_name: this.shopName,
      profile: this.selectedValue,
      email: this.email,
      password: this.password,
      phone: this.phone
    };

    const result = await this.authManagement.register(signUpData);

    if (result.success) {
      this.router.navigate(['/login']);
    } else {
      console.error('Erreur inscription:', result.error);
    }
  }
}