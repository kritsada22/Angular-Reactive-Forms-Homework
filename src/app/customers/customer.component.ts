import { Component, OnInit, Type } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidatorFn,
  FormArray,
} from '@angular/forms';

import { debounceTime } from 'rxjs/operators';

import { Customer } from './customer';

function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null {
  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');

  if (emailControl?.pristine || confirmControl?.pristine) {
    return null;
  }

  if (emailControl?.value === confirmControl?.value) {
    return null;
  }

  return { match: true };
}

function compareDate(c: AbstractControl): { [key: string]: boolean } | null {
  const startControl = c.get('start');
  const endControl = c.get('end');

  if (startControl?.value > endControl?.value && endControl?.value) {
    return { dateInvalid: true };
  }

  return null;
}

function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (
      c.value !== null &&
      (isNaN(c.value) || c.value < min || c.value > max)
    ) {
      return { range: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
})
export class CustomerComponent implements OnInit {
  customerForm!: FormGroup;
  customer = new Customer();
  emailMessage = '';

  get addresses(): FormArray {
    return this.customerForm.get('addresses') as FormArray;
  }

  getResidents(form: any) {
    // console.log(form);
    return form.controls.residents.controls;
  }

  private validationMessages: any = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.',
  };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group(
        {
          email: ['', [Validators.required, Validators.email]],
          confirmEmail: ['', Validators.required],
        },
        { validators: emailMatcher }
      ),
      dateGroup: this.fb.group(
        {
          start: ['', [Validators.required]],
          end: ['', [Validators.required]],
        },
        { validators: compareDate }
      ),
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1, 5)],
      sendCatalog: true,
      addresses: this.fb.array([this.buildAddress()]),
    });
    // console.log(this.customerForm.controls['dateGroup']);

    this.customerForm
      .get('notification')
      ?.valueChanges.subscribe((value) => this.setNotification(value));

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl?.valueChanges
      .pipe(debounceTime(1000))
      .subscribe((value) => this.setMessage(emailControl));
  }

  addAddress(): void {
    this.addresses.push(this.buildAddress());
  }

  addResidents(i: number): void {
    const customer = this.customerForm.get('addresses') as FormArray;
    const residents = customer.at(i).get('residents') as FormArray;
    residents.push(this.buildResidents());
  }

  buildAddress(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: ['', Validators.required],
      street2: '',
      city: '',
      state: '',
      zip: '',
      residents: this.fb.array([this.buildResidents()]),
    });
  }

  buildResidents(): FormGroup {
    return this.fb.group({
      residentsName: '',
      residentsGender: 'male',
    });
  }

  deleteAddress(i: number) {
    const customer = this.customerForm.get('addresses') as FormArray;
    // console.log(i);
    // console.log(this.customerForm.get('addresses'));
    customer.removeAt(i);
  }

  populateTestData(): void {
    this.customerForm.patchValue({
      firstName: 'Jack',
      lastName: 'Harkness',
      emailGroup: {
        email: 'jack@torchwood.com',
        confirmEmail: 'jack@torchwood.com',
      },
    });
    const addressGroup = this.fb.group({
      addressType: 'work',
      street1: 'Mermaid Quay',
      street2: '',
      city: 'Cardiff Bay',
      state: 'CA',
      zip: '',
    });
    this.customerForm.setControl('addresses', this.fb.array([addressGroup]));
  }

  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors)
        .map((key) => this.validationMessages[key])
        .join(' ');
    }
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia === 'text') {
      phoneControl?.setValidators(Validators.required);
    } else {
      phoneControl?.clearValidators();
    }
    phoneControl?.updateValueAndValidity();
  }
}
