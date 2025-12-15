import { Validator } from './validator';
import { FormConnector } from './form-connector';
import type { ValidationResult, FieldOptions } from '../types/index';

class V {
  private form: FormConnector;
  private validators: Map<string, Validator> = new Map();
  private options: FieldOptions = {};

  constructor(element: HTMLFormElement, options?: FieldOptions) {
    this.options = options || {};
    this.form = new FormConnector(element, this.options);
  }

  static form(element: HTMLFormElement, options?: FieldOptions): V {
    return new V(element, options);
  }

  field(fieldName: string): Validator {
    const element = this.form.field(fieldName);

    if (!element) {
      throw new Error(`Поле "${fieldName}" не найдено в форме`);
    }

    if (!this.validators.has(fieldName)) {
      this.validators.set(
        fieldName,
        new Validator(element, this.form.getFormElement(), fieldName)
      );
    }

    return this.validators.get(fieldName)!;
  }

  validate(): ValidationResult {
    const errors: Record<string, string | null> = {};
    let isValid = true;

    for (const [fieldName, validator] of this.validators) {
      const error = validator.validate();
      errors[fieldName] = error;

      if (error) {
        isValid = false;
        this.showError(fieldName, error);
      } else {
        this.clearError(fieldName);
      }
    }

    return { isValid, errors };
  }

  validateField(fieldName: string): string | null {
    const validator = this.validators.get(fieldName);
    if (!validator) {
      throw new Error(`Валидатор для поля "${fieldName}" не найден`);
    }

    const error = validator.validate();

    if (error) {
      this.showError(fieldName, error);
    } else {
      this.clearError(fieldName);
    }

    return error;
  }

  private showError(fieldName: string, error: string) {
    const element = this.form.field(fieldName);
    if (!element) return;

    if (this.options.validClass) {
      element.classList.remove(this.options.validClass);
    }
    if (this.options.invalidClass) {
      element.classList.add(this.options.invalidClass);
    }
    if (this.options.errorClass) {
      element.classList.add(this.options.errorClass);
    } else {
      element.classList.add('error');
    }

    let errorContainer = this.form.getErrorContainer(fieldName);

    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.className = 'error-message';
      errorContainer.setAttribute('data-field', fieldName);

      const label = this.form.getLabel(fieldName);
      const parent = element.parentNode;

      if (label && label.parentNode && label.nextSibling) {
        label.parentNode.insertBefore(errorContainer, label.nextSibling);
      } else if (parent) {
        parent.appendChild(errorContainer);
      }
    }

    errorContainer.textContent = error;
    errorContainer.style.display = 'block';
  }

  private clearError(fieldName: string) {
    const element = this.form.field(fieldName);
    if (!element) return;

    if (this.options.errorClass) {
      element.classList.remove(this.options.errorClass);
    } else {
      element.classList.remove('error');
    }
    if (this.options.invalidClass) {
      element.classList.remove(this.options.invalidClass);
    }
    if (this.options.validClass) {
      element.classList.add(this.options.validClass);
    } else {
      element.classList.add('valid');
    }

    const errorContainer = this.form.getErrorContainer(fieldName);
    if (errorContainer) {
      errorContainer.textContent = '';
      errorContainer.style.display = 'none';
    }
  }

  reset() {
    for (const [fieldName] of this.validators) {
      this.clearError(fieldName);
    }
  }

  getForm(): HTMLFormElement {
    return this.form.getFormElement();
  }
}

export default V;

export const createValidator = (form: HTMLFormElement, options?: FieldOptions): V => 
  V.form(form, options);
