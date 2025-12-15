import V, { createValidator } from './index';
import type { 
    ValidationRule, 
    ValidatorConfig, 
    ValidationResult,
    FieldOptions 
} from './types';

type ValidatorInstance = InstanceType<typeof V>;

export { V, createValidator };
export type { 
    ValidationRule, 
    ValidatorConfig, 
    ValidationResult,
    FieldOptions,
    ValidatorInstance 
};

if (typeof window !== 'undefined') {
    (window as any).V = V;
    (window as any).createValidator = createValidator;
}

export function useValidator(form: HTMLFormElement, options?: FieldOptions) {
    const validator = V.form(form, options);
    
    const example = {
        email: () => validator.field('email')
            .required('Email обязателен')
            .email('Некорректный email'),
            
        password: () => validator.field('password')
            .required('Пароль обязателен')
            .min(6, 'Минимум 6 символов'),
            
        confirmPassword: () => validator.field('confirmPassword')
            .required('Подтвердите пароль')
            .confirm('password', 'Пароли не совпадают'),
            
        age: () => validator.field('age')
            .number('Возраст должен быть числом')
            .minNumber(18, 'Минимум 18 лет')
            .maxNumber(100, 'Максимум 100 лет'),
            
        validate: () => validator.validate()
    };
    
    return example;
}

export function initDemo() {
    const form = document.querySelector('form');
    if (form) {
        const validator = V.form(form);
        
        const fields = form.querySelectorAll('[data-validate]');
        fields.forEach(field => {
            const name = field.getAttribute('name') || field.getAttribute('id');
            if (name) {
                setupFieldValidation(validator, name, field);
            }
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const result = validator.validate();
            
            if (result.isValid) {
                form.submit();
            } else {
                //
            }
        });
        
        form.addEventListener('blur', (e) => {
            const target = e.target as HTMLElement;
            const name = target.getAttribute('name') || target.getAttribute('id');
            if (name) {
                validator.validateField(name);
            }
        }, true);
    }
}

function setupFieldValidation(validator: ValidatorInstance, fieldName: string, element: Element) {
    const validateRules = element.getAttribute('data-validate');
    if (!validateRules) return;
    
    const rules = validateRules.split(',').map(r => r.trim());
    const field = validator.field(fieldName);
    
    rules.forEach(rule => {
        const [ruleName, ...params] = rule.split(':').map(p => p.trim());
        
        switch (ruleName) {
            case 'required': {
                const requiredMsg = params[0] || 'Поле обязательно';
                field.required(requiredMsg);
                break;
            }
                
            case 'email': {
                const emailMsg = params[0] || 'Некорректный email';
                field.email(emailMsg);
                break;
            }
                
            case 'min': {
                const minValue = parseInt(params[0], 10);
                const minMsg = params[1] || `Минимум ${minValue} символов`;
                if (!isNaN(minValue)) field.min(minValue, minMsg);
                break;
            }
                
            case 'max': {
                const maxValue = parseInt(params[0], 10);
                const maxMsg = params[1] || `Максимум ${maxValue} символов`;
                if (!isNaN(maxValue)) field.max(maxValue, maxMsg);
                break;
            }
                
            case 'number': {
                const numberMsg = params[0] || 'Должно быть числом';
                field.number(numberMsg);
                break;
            }
                
            case 'pattern': {
                if (params[0]) {
                    const pattern = new RegExp(params[0]);
                    const patternMsg = params[1] || 'Неверный формат';
                    field.pattern(pattern, patternMsg);
                }
                break;
            }
        }
    });
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initDemo();
    });
}
