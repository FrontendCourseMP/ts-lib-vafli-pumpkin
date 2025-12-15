import type { ValidationRule, ValidatorConfig } from '../types/index';

type FieldValue = string | number | boolean | FileList | null | undefined;
type CustomValidator = (value: string) => boolean | string;

export class Validator {
    private element: HTMLElement;
    private config: ValidatorConfig;
    private value: FieldValue;
    private form: HTMLFormElement;

    constructor(element: HTMLElement, form: HTMLFormElement, fieldName: string) {
        this.element = element;
        this.form = form;
        
        this.config = { 
            rules: [],
            fieldName,
            element
        };

        this.value = this.getValue();
        this.loadConstraintValidation();
    }

    private getValue(): FieldValue {
        if (this.element instanceof HTMLInputElement) {
            if (this.element.type === 'checkbox') {
                return this.element.checked;
            }
            if (this.element.type === 'radio') {
                const name = this.element.getAttribute('name');
                const checkedRadio = this.form.querySelector(`input[type="radio"][name="${name}"]:checked`);
                return checkedRadio ? (checkedRadio as HTMLInputElement).value : null;
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

    private loadConstraintValidation() {
        if (this.element instanceof HTMLInputElement) {
            this.loadInputConstraints(this.element);
        } else if (this.element instanceof HTMLTextAreaElement) {
            this.loadTextAreaConstraints(this.element);
        }
        if (this.element instanceof HTMLInputElement || 
            this.element instanceof HTMLTextAreaElement ||
            this.element instanceof HTMLSelectElement) {
            
            const element = this.element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            if (element.required) {
                this.required(element.validationMessage || 'Поле обязательно для заполнения');
            }
        }
    }

    private loadInputConstraints(element: HTMLInputElement) {
        if (element.required) {
            this.required(element.validationMessage || 'Поле обязательно для заполнения');
        }
        
        if (element.type === 'text' || element.type === 'password' || element.type === 'email' || 
            element.type === 'search' || element.type === 'tel' || element.type === 'url') {
            
            if (element.minLength > 0) {
                this.min(element.minLength, element.validationMessage || 'Минимальная длина не достигнута');
            }
            
            if (element.maxLength > 0) {
                this.max(element.maxLength, element.validationMessage || 'Максимальная длина превышена');
            }
        }
        
        if (element.type === 'number' || element.type === 'range') {
            if (element.min) {
                this.minNumber(parseFloat(element.min), element.validationMessage || 'Значение слишком маленькое');
            }
            
            if (element.max) {
                this.maxNumber(parseFloat(element.max), element.validationMessage || 'Значение слишком большое');
            }
        }
        
        if ((element.type === 'text' || element.type === 'password' || element.type === 'email' || 
             element.type === 'search' || element.type === 'tel' || element.type === 'url') && 
            element.pattern) {
            
            const pattern = new RegExp(element.pattern);
            this.pattern(pattern, element.validationMessage || 'Неверный формат');
        }
        
        if (element.type === 'email') {
            this.email(element.validationMessage || 'Некорректный email');
        }
    }

    private loadTextAreaConstraints(element: HTMLTextAreaElement) {
        if (element.required) {
            this.required(element.validationMessage || 'Поле обязательно для заполнения');
        }
        
        if (element.minLength > 0) {
            this.min(element.minLength, element.validationMessage || 'Минимальная длина не достигнута');
        }
        
        if (element.maxLength > 0) {
            this.max(element.maxLength, element.validationMessage || 'Максимальная длина превышена');
        }
    }

    string(error: string = 'Поле должно быть строкой') {
        this.config.rules.push({
            type: 'isString',
            error
        });
        return this;
    }

    min(count: number, error: string = 'Минимальная длина не достигнута') {
        this.config.rules.push({
            type: 'min',
            value: count,
            error
        });
        return this;
    }

    max(count: number, error: string = 'Максимальная длина превышена') {
        this.config.rules.push({
            type: 'max',
            value: count,
            error
        });
        return this;
    }

    email(error: string = 'Некорректный email') {
        this.config.rules.push({
            type: 'email',
            error
        });
        return this;
    }

    required(error: string = 'Поле обязательно для заполнения') {
        this.config.rules.push({
            type: 'required',
            error
        });
        return this;
    }

    number(error: string = 'Поле должно быть числом') {
        this.config.rules.push({
            type: 'isNumber',
            error
        });
        return this;
    }

    minNumber(value: number, error: string = 'Значение слишком маленькое') {
        this.config.rules.push({
            type: 'minNumber',
            value,
            error
        });
        return this;
    }

    maxNumber(value: number, error: string = 'Значение слишком большое') {
        this.config.rules.push({
            type: 'maxNumber',
            value,
            error
        });
        return this;
    }

    pattern(regex: RegExp, error: string = 'Неверный формат') {
        this.config.rules.push({
            type: 'pattern',
            value: regex,
            error
        });
        return this;
    }

    phone(country: 'ru' | 'us' | 'eu' | 'any' = 'ru', error?: string) {
        const patterns = {
            ru: /^(\+7|7|8)?[s-]?\(?[489][0-9]{2}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/,
            us: /^(\+1)?[\s-]?\(?[2-9][0-8][0-9]\)?[\s-]?[2-9][0-9]{2}[\s-]?[0-9]{4}$/,
            eu: /^(\+[1-9]{1,3})?[s-]?\(?[0-9]{1,4}\)?[\s-]?[0-9]{1,15}$/,
            any: /^\+?[1-9][0-9]{7,14}$/
        };

        const defaultErrors = {
            ru: 'Введите российский номер телефона',
            us: 'Введите американский номер телефона',
            eu: 'Введите европейский номер телефона',
            any: 'Введите корректный номер телефона'
        };

        return this.pattern(
            patterns[country],
            error || defaultErrors[country]
        );
    }

    url(error: string = 'Введите корректный URL') {
        const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/;
        return this.pattern(urlPattern, error);
    }

    date(format: 'ru' | 'us' | 'iso' = 'ru', error?: string) {
        const patterns = {
            ru: /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.\d{4}$/,
            us: /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/,
            iso: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
        };

        const defaultErrors = {
            ru: 'Введите дату в формате ДД.ММ.ГГГГ',
            us: 'Введите дату в формате ММ/ДД/ГГГГ',
            iso: 'Введите дату в формате ГГГГ-ММ-ДД'
        };

        return this.pattern(patterns[format], error || defaultErrors[format]);
    }

    time(error: string = 'Введите время в формате ЧЧ:ММ') {
        const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return this.pattern(timePattern, error);
    }

    zipCode(country: 'ru' | 'us' | 'eu' = 'ru', error?: string) {
        const patterns = {
            ru: /^\d{6}$/,
            us: /^\d{5}(-\d{4})?$/,
            eu: /^\d{4,5}$/
        };

        const defaultErrors = {
            ru: 'Введите российский почтовый индекс (6 цифр)',
            us: 'Введите американский ZIP код (5 или 9 цифр)',
            eu: 'Введите европейский почтовый индекс'
        };

        return this.pattern(patterns[country], error || defaultErrors[country]);
    }

    creditCard(type: 'visa' | 'mastercard' | 'amex' | 'any' = 'any', error?: string) {
        const patterns = {
            visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
            mastercard: /^5[1-5][0-9]{14}$/,
            amex: /^3[47][0-9]{13}$/,
            any: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})$/
        };

        const defaultErrors = {
            visa: 'Введите номер карты Visa',
            mastercard: 'Введите номер карты MasterCard',
            amex: 'Введите номер карты American Express',
            any: 'Введите корректный номер кредитной карты'
        };

        return this.pattern(patterns[type], error || defaultErrors[type]);
    }

    ipAddress(version: 'v4' | 'v6' | 'any' = 'v4', error?: string) {
        const patterns = {
            v4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            v6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
            any: null
        } as const;

        const defaultErrors = {
            v4: 'Введите IPv4 адрес',
            v6: 'Введите IPv6 адрес',
            any: 'Введите IP адрес'
        };

        if (version === 'any') {
            return this.custom((value: string) => {
                const v4Pattern = patterns.v4!;
                const v6Pattern = patterns.v6!;
                return v4Pattern.test(value) || v6Pattern.test(value);
            }, error || defaultErrors.any);
        }

        return this.pattern(patterns[version]!, error || defaultErrors[version]);
    }

    inn(error: string = 'Введите корректный ИНН') {
        const innPattern = /^\d{10}$|^\d{12}$/;
        return this.pattern(innPattern, error);
    }

    snils(error: string = 'Введите корректный СНИЛС') {
        const snilsPattern = /^\d{3}-\d{3}-\d{3}\s\d{2}$/;
        return this.pattern(snilsPattern, error);
    }

    passwordStrong(minLength: number = 8, error?: string) {
        return this.custom((value: string) => {
            if (value.length < minLength) return false;
            
            const hasUpperCase = /[A-Z]/.test(value);
            const hasLowerCase = /[a-z]/.test(value);
            const hasNumbers = /\d/.test(value);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
            
            return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
        }, error || `Пароль должен содержать минимум ${minLength} символов, включая заглавные и строчные буквы, цифры и специальные символы`);
    }

    confirm(passwordField: string, error: string = 'Пароли не совпадают') {
        this.config.rules.push({
            type: 'confirm',
            value: passwordField,
            error
        });
        return this;
    }

    array(error: string = 'Поле должно быть массивом') {
        this.config.rules.push({
            type: 'isArray',
            error
        });
        return this;
    }

    minLength(count: number, error: string = 'Минимальное количество элементов не достигнуто') {
        this.config.rules.push({
            type: 'minLength',
            value: count,
            error
        });
        return this;
    }

    maxLength(count: number, error: string = 'Максимальное количество элементов превышено') {
        this.config.rules.push({
            type: 'maxLength',
            value: count,
            error
        });
        return this;
    }

    custom(validator: CustomValidator, error: string = 'Неверное значение') {
        this.config.rules.push({
            type: 'custom',
            value: validator,
            error
        });
        return this;
    }

    validate(): string | null {
        this.value = this.getValue();
        
        for (const rule of this.config.rules) {
            const error = this.checkRule(rule);
            if (error) return error;
        }

        if (this.element instanceof HTMLInputElement || 
            this.element instanceof HTMLTextAreaElement ||
            this.element instanceof HTMLSelectElement) {
            
            const element = this.element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            
            if (!element.validity.valid) {
                return element.validationMessage || 'Неверное значение';
            }
        }
        
        return null;
    }

    private checkRule(rule: ValidationRule): string | null {
        switch (rule.type) {
            case 'isString':
                return typeof this.value !== 'string' ? rule.error : null;
                
            case 'required': {
                if (this.value === null || this.value === undefined || this.value === '' || 
                    (Array.isArray(this.value) && this.value.length === 0) ||
                    (typeof this.value === 'boolean' && !this.value) ||
                    (this.value instanceof FileList && this.value.length === 0)) {
                    return rule.error;
                }
                return null;
            }
                
            case 'min': {
                const minValue = rule.value as number;
                return typeof this.value === 'string' && this.value.length < minValue ? rule.error : null;
            }
                
            case 'max': {
                const maxValue = rule.value as number;
                return typeof this.value === 'string' && this.value.length > maxValue ? rule.error : null;
            }
                
            case 'email': {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return typeof this.value === 'string' && !emailRegex.test(this.value) ? rule.error : null;
            }

            case 'isNumber': {
                return (typeof this.value !== 'number' || isNaN(this.value)) && 
                       (typeof this.value !== 'string' || isNaN(parseFloat(this.value))) ? rule.error : null;
            }
                
            case 'minNumber': {
                const minNumValue = rule.value as number;
                const numValMin = typeof this.value === 'string' ? parseFloat(this.value) : this.value;
                return typeof numValMin === 'number' && !isNaN(numValMin) && numValMin < minNumValue ? rule.error : null;
            }
                
            case 'maxNumber': {
                const maxNumValue = rule.value as number;
                const numValMax = typeof this.value === 'string' ? parseFloat(this.value) : this.value;
                return typeof numValMax === 'number' && !isNaN(numValMax) && numValMax > maxNumValue ? rule.error : null;
            }

            case 'pattern': {
                const pattern = rule.value as RegExp;
                return typeof this.value === 'string' && !pattern.test(this.value) ? rule.error : null;
            }
  
            case 'isArray': {
                return !Array.isArray(this.value) ? rule.error : null;
            }
                
            case 'minLength': {
                const minLengthValue = rule.value as number;
                return Array.isArray(this.value) && this.value.length < minLengthValue ? rule.error : null;
            }
 
            case 'maxLength': {
                const maxLengthValue = rule.value as number;
                return Array.isArray(this.value) && this.value.length > maxLengthValue ? rule.error : null;
            }
                
            case 'confirm': {
                const confirmFieldName = rule.value as string;
                const confirmField = this.form.querySelector(`[name="${confirmFieldName}"]`) as HTMLInputElement;
                if (confirmField) {
                    return confirmField.value !== this.value ? rule.error : null;
                }
                return null;
            }
                
            case 'custom': {
                const customValidator = rule.value as CustomValidator;
                if (typeof this.value !== 'string') {
                    return rule.error;
                }
                const result = customValidator(this.value);
                if (typeof result === 'string') return result;
                return result === false ? rule.error : null;
            }
                
            default:
                return null;
        }
    }

    getValidity() {
        if (this.element instanceof HTMLInputElement || 
            this.element instanceof HTMLTextAreaElement ||
            this.element instanceof HTMLSelectElement) {
            return this.element.validity;
        }
        return null;
    }

    getFieldName(): string {
        return this.config.fieldName;
    }

    getElement(): HTMLElement {
        return this.element;
    }
}
