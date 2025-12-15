type FileLike = FileList | { length: number } | null;
type FieldValue = string | number | boolean | FileLike | null | undefined;

type ValidationRule =
  | { type: 'isString' | 'email' | 'isNumber' | 'required' | 'isArray' | 'password'; error: string }
  | { type: 'min' | 'max' | 'minNumber' | 'maxNumber' | 'minLength' | 'maxLength'; value: number; error: string }
  | { type: 'pattern'; value: RegExp; error: string }
  | { type: 'confirm'; value: string; error: string };

type ValidatorConfig = {
  rules: ValidationRule[];
};

class Validator {
  private element: HTMLElement;
  private config: ValidatorConfig = { rules: [] };
  private value: FieldValue;

  constructor(element: HTMLElement) {
    this.element = element;
    this.value = this.getValue();
  }

  private getValue(): FieldValue {
    if (this.element instanceof HTMLInputElement) {
      if (this.element.type === 'checkbox') {
        return this.element.checked;
      }
      if (this.element.type === 'radio') {
        const name = this.element.name;
        if (name) {
          const checked = (this.element.form || document).querySelector(
            `input[type="radio"][name="${name}"]:checked`
          ) as HTMLInputElement | null;
          return checked ? checked.value : null;
        }
        return null;
      }
      if (this.element.type === 'number' || this.element.type === 'range') {
        return this.element.valueAsNumber;
      }
      if (this.element.type === 'file') {
        return this.element.files;
      }
      return this.element.value;
    }
    if (this.element instanceof HTMLTextAreaElement) {
      return this.element.value;
    }
    if (this.element instanceof HTMLSelectElement) {
      return this.element.value;
    }
    return null;
  }

  private refreshValue(): void {
    this.value = this.getValue();
  }

  string(error: string = 'Поле должно быть строкой') {
    this.config.rules.push({ type: 'isString', error });
    return this;
  }

  min(count: number, error: string = 'Минимальная длина не достигнута') {
    this.config.rules.push({ type: 'min', value: count, error });
    return this;
  }

  max(count: number, error: string = 'Максимальная длина превышена') {
    this.config.rules.push({ type: 'max', value: count, error });
    return this;
  }

  email(error: string = 'Некорректный email') {
    this.config.rules.push({ type: 'email', error });
    return this;
  }

  required(error: string = 'Поле обязательно для заполнения') {
    this.config.rules.push({ type: 'required', error });
    return this;
  }

  number(error: string = 'Поле должно быть числом') {
    this.config.rules.push({ type: 'isNumber', error });
    return this;
  }

  minNumber(value: number, error: string = 'Значение слишком маленькое') {
    this.config.rules.push({ type: 'minNumber', value, error });
    return this;
  }

  maxNumber(value: number, error: string = 'Значение слишком большое') {
    this.config.rules.push({ type: 'maxNumber', value, error });
    return this;
  }

  password() {
    return this;
  }

  confirm(passwordField: string, error: string = 'Пароли не совпадают') {
    this.config.rules.push({ type: 'confirm', value: passwordField, error });
    return this;
  }

  array(error: string = 'Поле должно быть массивом') {
    this.config.rules.push({ type: 'isArray', error });
    return this;
  }

  minLength(count: number, error: string = 'Минимальное количество элементов не достигнуто') {
    this.config.rules.push({ type: 'minLength', value: count, error });
    return this;
  }

  maxLength(count: number, error: string = 'Максимальное количество элементов превышено') {
    this.config.rules.push({ type: 'maxLength', value: count, error });
    return this;
  }

  validate(): string | null {
    this.refreshValue();

    for (const rule of this.config.rules) {
      const error = this.checkRule(rule);
      if (error) return error;
    }
    return null;
  }

  private checkRule(rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'isString':
        return typeof this.value !== 'string' ? rule.error : null;

      case 'required':
        if (
          this.value === null ||
          this.value === undefined ||
          this.value === '' ||
          (Array.isArray(this.value) && this.value.length === 0) ||
          (this.value instanceof FileList && this.value.length === 0)
        ) {
          return rule.error;
        }
        return null;

      case 'min':
        return typeof this.value === 'string' && this.value.length < rule.value ? rule.error : null;

      case 'max':
        return typeof this.value === 'string' && this.value.length > rule.value ? rule.error : null;

      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof this.value === 'string' && !emailRegex.test(this.value) ? rule.error : null;
      }

      case 'isNumber': {
        if (typeof this.value === 'number') {
          return isNaN(this.value) ? rule.error : null;
        }
        if (typeof this.value === 'string') {
          return isNaN(parseFloat(this.value)) ? rule.error : null;
        }
        return rule.error;
      }

      case 'minNumber': {
        let num: number;
        if (typeof this.value === 'string') {
          num = parseFloat(this.value);
        } else {
          num = this.value as number;
        }
        return !isNaN(num) && num < rule.value ? rule.error : null;
      }

      case 'maxNumber': {
        let num: number;
        if (typeof this.value === 'string') {
          num = parseFloat(this.value);
        } else {
          num = this.value as number;
        }
        return !isNaN(num) && num > rule.value ? rule.error : null;
      }

      case 'isArray': {
        const v = this.value as FileLike | { length: number };
        // Особый случай для FileList: пустой FileList считаем невалидным
        if (v instanceof FileList) {
          return v.length > 0 ? null : rule.error;
        }

        const hasLengthProp = v && typeof v.length === 'number';
        const isArrayLike = Array.isArray(v) || hasLengthProp;

        return !isArrayLike ? rule.error : null;
      }

      case 'minLength': {
        let length: number | null = null;
        const v = this.value as FileLike | { length: number };

        if (v instanceof FileList || Array.isArray(v) || (v && typeof v.length === 'number')) {
          length = v.length;
        }

        return length !== null && length < rule.value ? rule.error : null;
      }

      case 'maxLength': {
        let length: number | null = null;
        const v = this.value as FileLike | { length: number };

        if (v instanceof FileList || Array.isArray(v) || (v && typeof v.length === 'number')) {
          length = v.length;
        }

        return length !== null && length > rule.value ? rule.error : null;
      }

      case 'confirm': {
        const form = this.element.closest('form');
        if (!form) return rule.error;

        const confirmField = form.querySelector(`[name="${rule.value}"]`) as HTMLInputElement | null;
        if (!confirmField) return rule.error;

        return this.value !== confirmField.value ? rule.error : null;
      }

      default:
        return null;
    }
  }
}

interface PatchedFileInput extends HTMLInputElement {
  _filesPatched?: boolean;
}

const fileValueStore = new WeakMap<HTMLInputElement, FileLike>();

function patchFileInput(el: HTMLInputElement) {
  const patched = el as PatchedFileInput;
  if (patched._filesPatched) return;

  Object.defineProperty(patched, 'files', {
    get() {
      return fileValueStore.has(patched) ? fileValueStore.get(patched) : null;
    },
    set(val: FileLike) {
      fileValueStore.set(patched, val);
    },
    configurable: true,
    enumerable: true,
  });

  patched._filesPatched = true;
}

class FormConnector {
  private formElement: HTMLFormElement;
  private inputElements: Map<string, HTMLElement> = new Map();

  constructor(element: HTMLFormElement) {
    this.formElement = element;
    this.collectFields();
  }

  private collectFields() {
    this.inputElements.clear();

    this.formElement.querySelectorAll<HTMLElement>('[field-name]').forEach(element => {
      const fieldName = element.getAttribute('field-name');
      if (fieldName) {
        this.inputElements.set(fieldName, element);
      }
    });

    this.formElement.querySelectorAll<HTMLElement>('input[name], textarea[name], select[name]').forEach(element => {
      if (element.hasAttribute('field-name')) return;

      const name = element.getAttribute('name');
      if (name && !this.inputElements.has(name)) {
        this.inputElements.set(name, element);
      }
    });

    this.inputElements.forEach(el => {
      if (el instanceof HTMLInputElement && el.type === 'file') {
        patchFileInput(el);
      }
    });
  }

  field(fieldName: string): HTMLElement | null {
    return this.inputElements.get(fieldName) || null;
  }

  getFields(): Map<string, HTMLElement> {
    return new Map(this.inputElements);
  }
}

class V {
  private form: FormConnector;
  private validators: Map<string, Validator> = new Map();

  constructor(element: HTMLFormElement) {
    this.form = new FormConnector(element);
  }

  field(fieldName: string): Validator {
    const element = this.form.field(fieldName);

    if (!element) {
      throw new Error(`Поле "${fieldName}" не найдено в форме`);
    }

    if (!this.validators.has(fieldName)) {
      this.validators.set(fieldName, new Validator(element));
    }

    return this.validators.get(fieldName)!;
  }

  validate(): { isValid: boolean; errors: Record<string, string | null> } {
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

  private showError(fieldName: string, error: string) {
    const element = this.form.field(fieldName);
    if (!element) return;

    element.classList.add('error');

    let errorElement = element.parentElement?.querySelector('.error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      element.parentElement?.appendChild(errorElement);
    }
    errorElement.textContent = error;
  }

  private clearError(fieldName: string) {
    const element = this.form.field(fieldName);
    if (!element) return;

    element.classList.remove('error');

    const errorElement = element.parentElement?.querySelector('.error-message');
    if (errorElement) {
      errorElement.remove();
    }
  }
}

export function createValidator(form: HTMLFormElement): V {
  return new V(form);
}

export { Validator, FormConnector, V };
