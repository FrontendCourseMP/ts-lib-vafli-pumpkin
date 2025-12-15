import VDefault, * as CoreModule from './core';

import { Validator } from './core/validator';
import { FormConnector } from './core/form-connector';

import type { 
    ValidationRule, 
    ValidatorConfig, 
    ValidationResult,
    FieldOptions 
} from './types';

export const V = VDefault;
export const createValidator = (CoreModule as any).createValidator;

export type { 
    ValidationRule, 
    ValidatorConfig, 
    ValidationResult,
    FieldOptions 
};

export { Validator, FormConnector };

export const form = createValidator;

export default V;

export const utils = {
    isValidEmail: (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    isNumber: (value: any): boolean => typeof value === 'number' && !isNaN(value),
    isString: (value: any): boolean => typeof value === 'string',
    isArray: (value: any): boolean => Array.isArray(value),
    isObject: (value: any): boolean => typeof value === 'object' && value !== null && !Array.isArray(value),
    isEmpty: (value: any): boolean => {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }
};

export const constants = {
    VALIDATION_TYPES: {
        REQUIRED: 'required',
        STRING: 'isString',
        NUMBER: 'isNumber',
        EMAIL: 'email',
        MIN: 'min',
        MAX: 'max',
        MIN_NUMBER: 'minNumber',
        MAX_NUMBER: 'maxNumber',
        PATTERN: 'pattern',
        CONFIRM: 'confirm',
        ARRAY: 'isArray',
        MIN_LENGTH: 'minLength',
        MAX_LENGTH: 'maxLength',
        CUSTOM: 'custom'
    },
    
    DEFAULT_MESSAGES: {
        REQUIRED: 'Поле обязательно для заполнения',
        STRING: 'Поле должно быть строкой',
        NUMBER: 'Поле должно быть числом',
        EMAIL: 'Некорректный email',
        MIN: 'Минимальная длина не достигнута',
        MAX: 'Максимальная длина превышена',
        MIN_NUMBER: 'Значение слишком маленькое',
        MAX_NUMBER: 'Значение слишком большое',
        PATTERN: 'Неверный формат',
        CONFIRM: 'Пароли не совпадают',
        ARRAY: 'Поле должно быть массивом',
        MIN_LENGTH: 'Минимальное количество элементов не достигнуто',
        MAX_LENGTH: 'Максимальное количество элементов превышено'
    },
    
    CSS_CLASSES: {
        ERROR: 'error',
        VALID: 'valid',
        INVALID: 'invalid',
        ERROR_MESSAGE: 'error-message'
    }
};

if (typeof window !== 'undefined') {
    (window as any).V = V;
    (window as any).createValidator = createValidator;
    (window as any).Validator = Validator;
    (window as any).FormConnector = FormConnector;
}
