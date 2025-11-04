import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

export interface CountryCode {
  code: string;
  label: string;
}

@Component({
  selector: 'app-phone-input',
  imports: [
    CommonModule,
  ],
  templateUrl: './phone-input.component.html',
  styles: ``
})
export class PhoneInputComponent {

  @Input() countries: CountryCode[] = [];
  @Input() placeholder: string = '+1 (555) 000-0000';
  @Input() selectPosition: 'start' | 'end' = 'start';
  @Output() phoneChange = new EventEmitter<string>();

  selectedCountry: string = '';
  phoneNumber: string = '';

  countryCodes: { [key: string]: string } = {};

  ngOnInit() {
    if (this.countries.length > 0) {
      this.selectedCountry = this.countries[0].code;
      this.countryCodes = this.countries.reduce(
          (acc, { code, label }) => ({ ...acc, [code]: label }),
          {}
      );
    }
  }

  handleCountryChange(event: Event) {
    const newCountry = (event.target as HTMLSelectElement).value;
    this.selectedCountry = newCountry;
    this.emitFullPhoneNumber();
  }

  handlePhoneInputChange(event: Event) {
    const newPhoneNumber = (event.target as HTMLInputElement).value;
    this.phoneNumber = newPhoneNumber;
    this.emitFullPhoneNumber();
  }

  private emitFullPhoneNumber() {
    const countryCode = this.countryCodes[this.selectedCountry] || '';
    const fullPhoneNumber = countryCode + this.phoneNumber;

    console.log('PhoneInput - Emission du numéro:', fullPhoneNumber);
    this.phoneChange.emit(fullPhoneNumber); // Émet avec le +
  }
}