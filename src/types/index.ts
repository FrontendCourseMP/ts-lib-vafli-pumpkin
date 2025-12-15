export type ValidationRule = {
    type: string;
    value?: any;
    error: string;
};

export type ValidatorConfig = {
    rules: ValidationRule[];
    fieldName: string;
    element: HTMLElement;
};

export type ValidationResult = {
    isValid: boolean;
    errors: Record<string, string | null>;
};

export type ConstraintValidation = {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number | string;
    max?: number | string;
    pattern?: string;
    step?: number;
};

export type FieldOptions = {
    label?: string;
    errorContainer?: string;
    errorClass?: string;
    fieldClass?: string;
    validClass?: string;
    invalidClass?: string;
};
