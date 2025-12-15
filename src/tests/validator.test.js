// tests/validator.test.js

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Validator } from '@/core/validator'

describe('Validator — полный, подробный, изолированный тест с jsdom', () => {
  let container
  let form


  beforeEach(() => {
    container = document.createElement('div')
    form = document.createElement('form')
    container.appendChild(form)
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (container?.parentNode) {
      document.body.removeChild(container)
    }
    container = null
    form = null
  })

  // Хелперы — без innerHTML
  const input = (attrs = {}) => {
    const el = document.createElement('input')
    Object.assign(el, attrs)
    if (attrs.name) el.name = attrs.name
    form.appendChild(el)
    return el
  }

  const textarea = (attrs = {}) => {
    const el = document.createElement('textarea')
    Object.assign(el, attrs)
    form.appendChild(el)
    return el
  }

  const select = (attrs = {}, options = []) => {
    const el = document.createElement('select')
    Object.assign(el, attrs)
    options.forEach(([value, text, selected = false]) => {
      const opt = document.createElement('option')
      opt.value = value
      opt.textContent = text
      if (selected) opt.selected = true
      el.appendChild(opt)
    })
    form.appendChild(el)
    return el
  }

  const v = (element, name = 'test') => new Validator(element, form, name)

  // =======================================================================
  // 1. getValue() — все типы полей
  // =======================================================================
  describe('getValue() — корректно получает значение для всех типов полей', () => {
    it('text / password / email / tel / url → возвращает value', () => {
      const el = input({ type: 'text', value: 'hello' })
      expect(v(el).value).toBe('hello')
    })

    it('checkbox → возвращает checked', () => {
      const el = input({ type: 'checkbox', checked: true })
      expect(v(el).value).toBe(true)
      el.checked = false
      expect(v(el).getValue()).toBe(false)
    })

    it('radio → возвращает value выбранной кнопки в группе', () => {
      input({ type: 'radio', name: 'color', value: 'red' })
      input({ type: 'radio', name: 'color', value: 'blue', checked: true })

      const validator = v(form.querySelector('input[value="red"]'))
      expect(validator.value).toBe('blue')
    })

    it('radio → возвращает null, если ничего не выбрано', () => {
      const el = input({ type: 'radio', name: 'choice' })
      expect(v(el).value).toBe(null)
    })

    it('number / range → возвращает valueAsNumber', () => {
      const el = input({ type: 'number', value: '42' })
      expect(v(el).value).toBe(42)

      el.value = ''
      expect(v(el).getValue()).toBe(NaN)
    })

    it('file → возвращает files', () => {
      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' })
      const el = input({ type: 'file' })
      Object.defineProperty(el, 'files', { value: [file] })

      expect(v(el).value).toEqual([file])
    })

    it('textarea → возвращает value', () => {
      const el = textarea({ value: 'многострочный\nтекст' })
      expect(v(el).value).toBe('многострочный\nтекст')
    })

    it('select → возвращает выбранное value', () => {
      const el = select({ name: 'country' }, [
        ['ru', 'Россия', false],
        ['us', 'США', true],
        ['de', 'Германия', false],
      ])
      expect(v(el).value).toBe('us')
    })
  })

  // =======================================================================
  // 2. loadConstraintValidation() — все нативные атрибуты
  // =======================================================================
  describe('loadConstraintValidation() — автоматически добавляет правила из HTML-атрибутов', () => {
    it('required → добавляет правило required', () => {
      const el = input({ required: true })
      el.validationMessage = 'Поле обязательно!'
      const validator = v(el)
      expect(validator.config.rules).toContainEqual({
        type: 'required',
        error: 'Поле обязательно!',
      })
    })

    it('minLength / maxLength → добавляет min и max для текстовых полей', () => {
      const el = input({ type: 'text', minLength: 3, maxLength: 20 })
      const validator = v(el)
      const rules = validator.config.rules
      expect(rules).toContainEqual({ type: 'min', value: 3, error: expect.any(String) })
      expect(rules).toContainEqual({ type: 'max', value: 20, error: expect.any(String) })
    })

    it('pattern → создаёт RegExp из атрибута', () => {
      const el = input({ type: 'text', pattern: '\\d{4}' })
      const validator = v(el)
      const rule = validator.config.rules.find(r => r.type === 'pattern')
      expect(rule).toBeDefined()
      expect(rule.value).toBeInstanceOf(RegExp)
      expect(rule.value.test('1234')).toBe(true)
      expect(rule.value.test('abcd')).toBe(false)
    })

    it('type="email" → автоматически добавляет правило email', () => {
      const el = input({ type: 'email' })
      const validator = v(el)
      expect(validator.config.rules).toContainEqual({
        type: 'email',
        error: 'Некорректный email',
      })
    })

    it('min/max для number/range → добавляет minNumber / maxNumber', () => {
      const el = input({ type: 'number', min: '10', max: '100' })
      const validator = v(el)
      const rules = validator.config.rules
      expect(rules).toContainEqual({ type: 'minNumber', value: 10, error: expect.any(String) })
      expect(rules).toContainEqual({ type: 'maxNumber', value: 100, error: expect.any(String) })
    })
  })

  // =======================================================================
  // 3. Методы валидатора — цепочка и все правила
  // =======================================================================
  describe('Методы валидатора — подробная проверка всех правил', () => {
    it('.required() — ошибка при пустом, проходит при заполненном', () => {
      const el = input()
      const validator = v(el).required('Обязательно')
      expect(validator.validate()).toBe('Обязательно')
      el.value = 'ok'
      expect(validator.validate()).toBeNull()
    })

    it('.email() — проверяет формат email', () => {
      const el = input()
      const validator = v(el).email('Неверный email')
      el.value = 'bad'
      expect(validator.validate()).toBe('Неверный email')
      el.value = 'test@example.com'
      expect(validator.validate()).toBeNull()
    })

    it('.min() / .max() — проверка длины строки', () => {
      const el = input()
      const validator = v(el).min(3).max(10)

      el.value = 'ab'
      expect(validator.validate()).toBe('Минимальная длина не достигнута')

      el.value = 'abcdefghijk'
      expect(validator.validate()).toBe('Максимальная длина превышена')

      el.value = 'good'
      expect(validator.validate()).toBeNull()
    })

    it('.phone() — поддерживает ru, us, eu, any', () => {
      const el = input()

      const ruValidator = v(el).phone('ru')
      el.value = '+79123456789'
      expect(ruValidator.validate()).toBeNull()

      const usValidator = v(el).phone('us')
      el.value = '(555) 123-4567'
      expect(usValidator.validate()).toBeNull()

      const anyValidator = v(el).phone('any')
      el.value = '+1234567890'
      expect(anyValidator.validate()).toBeNull()
    })

    it('.confirm() — сравнивает с другим полем', () => {
      input({ name: 'password', value: '12345' })
      const confirmEl = input({ name: 'confirm' })

      const validator = v(confirmEl).confirm('password', 'Пароли не совпадают')

      confirmEl.value = 'wrong'
      expect(validator.validate()).toBe('Пароли не совпадают')

      confirmEl.value = '12345'
      expect(validator.validate()).toBeNull()
    })

    it('.custom() — произвольная логика', () => {
      const el = input()
      const validator = v(el).custom(value => value.length >= 5 || 'Минимум 5 символов')

      el.value = 'hi'
      expect(validator.validate()).toBe('Минимум 5 символов')

      el.value = 'hello'
      expect(validator.validate()).toBeNull()
    })

    it('.passwordStrong() — проверяет сложность пароля', () => {
      const el = input()
      const validator = v(el).passwordStrong(8)

      el.value = 'weakpass'
      expect(validator.validate()).toMatch(/Пароль должен содержать/)

      el.value = 'Ab1!cdEF'
      expect(validator.validate()).toBeNull()
    })

    it('.array(), .minLength(), .maxLength() — для file и массивов', () => {
      const el = input({ type: 'file' })
      const validator = v(el).array().minLength(1).maxLength(3)

      Object.defineProperty(el, 'files', { value: [] })
      expect(validator.validate()).toBe('Поле должно быть массивом')

      Object.defineProperty(el, 'files', { value: [1,2,3,4] })
      expect(validator.validate()).toBe('Максимальное количество элементов превышено')

      Object.defineProperty(el, 'files', { value: [1,2] })
      expect(validator.validate()).toBeNull()
    })
  })

  // =======================================================================
  // 4. validate() — fallback на нативную валидацию
  // =======================================================================
  it('validate() возвращает validationMessage при невалидном Constraint Validation', () => {
    const el = input({ type: 'email', required: true })
    el.value = 'это не email'

    const validator = v(el)
    const error = validator.validate()

    expect(typeof error).toBe('string')
    expect(error.length).toBeGreaterThan(0)
  })

  // =======================================================================
  // 5. Геттеры
  // =======================================================================
  describe('Геттеры', () => {
    it('getFieldName() — возвращает имя поля', () => {
      const el = input()
      expect(v(el, 'username').getFieldName()).toBe('username')
    })

    it('getElement() — возвращает DOM-элемент', () => {
      const el = input()
      expect(v(el).getElement()).toBe(el)
    })

    it('getValidity() — возвращает validity для input/textarea/select', () => {
      const el = input({ required: true })
      const validity = v(el).getValidity()
      expect(validity).toBeDefined()
      expect(validity.valid).toBe(false)
    })

    it('getValidity() — возвращает null для других элементов', () => {
      const el = document.createElement('div')
      expect(v(el).getValidity()).toBeNull()
    })
  })
})
