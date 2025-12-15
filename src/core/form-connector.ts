import type { FieldOptions } from '../types/index.ts';

export class FormConnector {
    private formElement: HTMLFormElement;
    private inputElements: Map<string, HTMLElement> = new Map();
    private labels: Map<string, HTMLLabelElement | null> = new Map();
    private errorContainers: Map<string, HTMLElement> = new Map();
    private options: FieldOptions;

    constructor(element: HTMLFormElement, options?: FieldOptions) {
        this.formElement = element;
        this.options = {
            errorContainer: '.error-message',
            ...options
        };
        this.collectFields();
        this.collectLabelsAndErrorContainers();
    }

    private collectFields() {
        this.inputElements.clear();
        
        this.formElement.querySelectorAll<HTMLElement>('[field-name]').forEach(element => {
        const fieldName = element.getAttribute('field-name');
        if (fieldName) {
            this.inputElements.set(fieldName, element);
        }
    });
        
        const formElements = [
            'input:not([type="submit"]):not([type="button"]):not([type="reset"])',
            'textarea',
            'select',
            'output'
        ].join(', ');
        
        this.formElement.querySelectorAll<HTMLElement>(formElements).forEach(element => {
        if (element.hasAttribute('field-name')) return;

        const name = element.getAttribute('name');
        const id = element.getAttribute('id');
        
        if (name && !this.inputElements.has(name)) {
            this.inputElements.set(name, element);
        } else if (id && !this.inputElements.has(id)) {
            this.inputElements.set(id, element);
        }
    });
    }

    private collectLabelsAndErrorContainers() {
        this.labels.clear();
        this.errorContainers.clear();

        for (const [fieldName, element] of this.inputElements) {
            let label: HTMLLabelElement | null = null;
            const id = element.getAttribute('id');
            
            if (id) {
                label = this.formElement.querySelector(`label[for="${id}"]`);
            }
            
            if (!label) {
                label = element.closest('label');
            }
            
            this.labels.set(fieldName, label);

            let errorContainer: HTMLElement | null = null;
            
            if (this.options.errorContainer) {
                if (this.options.errorContainer.startsWith('#')) {
                    errorContainer = document.querySelector(this.options.errorContainer);
                } else {
                    const container = element.closest(this.options.errorContainer) || 
                                     element.parentElement?.querySelector(this.options.errorContainer) ||
                                     element.nextElementSibling?.matches(this.options.errorContainer) ? 
                                     element.nextElementSibling as HTMLElement : null;
                    
                    errorContainer = container;
                }
            }
            
            if (!errorContainer) {
                const parent = element.parentElement;
                if (parent) {
                    errorContainer = parent.querySelector('.error-message') as HTMLElement;
                    
                    if (!errorContainer && element.nextElementSibling?.classList.contains('error-message')) {
                        errorContainer = element.nextElementSibling as HTMLElement;
                    }
                }
            }
            
            if (errorContainer) {
                this.errorContainers.set(fieldName, errorContainer);
            }
        }
    }

    field(fieldName: string): HTMLElement | null {
        return this.inputElements.get(fieldName) || null;
    }

    getLabel(fieldName: string): HTMLLabelElement | null {
        return this.labels.get(fieldName) || null;
    }

    getErrorContainer(fieldName: string): HTMLElement | null {
        const container = this.errorContainers.get(fieldName);
        if (container) return container;

        if (this.options.errorContainer && this.options.errorContainer.startsWith('#')) {
            const global = document.querySelector(this.options.errorContainer);
            return global as HTMLElement | null;
        }

        return null;
    }

    getFields(): Map<string, HTMLElement> {
        return new Map(this.inputElements);
    }

    getFormElement(): HTMLFormElement {
        return this.formElement;
    }
}
