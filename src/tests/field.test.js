import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createValidator } from '@/core/fields'

describe('fields.ts — полный тест V, Validator, FormConnector и createValidator', () => {
  let container
  let form

  const setup = () => {
    container = document.createElement('div')
    form = document.createElement('form')
    container.appendChild(form)
    document.body.appendChild(container)
  }

  const teardown = () => {
    if (container?.parentNode) {
      document.body.removeChild(container)
    }
  }

  beforeEach(setup)
  afterEach(teardown)

  const input = (attrs = {}) => {
    const el = document.createElement('input')
    Object.assign(el, attrs)
    if (attrs.name) el.name = attrs.name
    if (attrs['field-name']) el.setAttribute('field-name', attrs['field-name'])
    form.appendChild(el)
    return el
  }

  const wrapper = (child) => {
    const div = document.createElement('div')
    div.appendChild(child)
    form.appendChild(div)
    return div
  }

  //  createValidator()
  it('createValidator() возвращает экземпляр V', () => {
    const v = createValidator(form)
    expect(v).toBeDefined()
    expect(typeof v.field).toBe('function')
    expect(typeof v.validate).toBe('function')
  })


  // . FormConnector
  describe('FormConnector — поиск полей', () => {
    it('находит поля по name', () => {
      input({ name: 'username' })
      const v = createValidator(form)
      expect(v.field('username')).toBeDefined()
    })

    it('находит поля по field-name', () => {
      input({ 'field-name': 'custom-age' })
      const v = createValidator(form)
      expect(v.field('custom-age')).toBeDefined()
    })

    it('field-name имеет приоритет над name', () => {
      input({ name: 'email', 'field-name': 'user-email' })
      const v = createValidator(form)
      expect(v.field('user-email')).toBeDefined()
      expect(() => v.field('email')).toThrow('Поле "email" не найдено в форме')
    })

    it('выбрасывает ошибку, если поле не найдено', () => {
      const v = createValidator(form)
      expect(() => v.field('unknown')).toThrow('Поле "unknown" не найдено в форме')
    })
  })


  //  Validator
  describe('Validator — правила валидации', () => {
    it('required — ошибка при пустом', () => {
      const el = input({ name: 'name' })
      const v = createValidator(form)
      v.field('name').required('Обязательно')

      expect(v.validate().errors.name).toBe('Обязательно')

      el.value = 'John'
      expect(v.validate().errors.name).toBeNull()
    })

    it('string — проверяет тип string', () => {
      const el = input({ name: 'text' })
      const v = createValidator(form)
      v.field('text').string()

      el.value = '123'
      expect(v.validate().errors.text).toBeNull()
    })

    it('email — проверяет формат', () => {
      const el = input({ name: 'email' })
      const v = createValidator(form)
      v.field('email').email('Неверный email')

      el.value = 'bad'
      expect(v.validate().errors.email).toBe('Неверный email')

      el.value = 'good@example.com'
      expect(v.validate().errors.email).toBeNull()
    })

    it('min / max — длина строки', () => {
      const el = input({ name: 'pass' })
      const v = createValidator(form)
      v.field('pass').min(3).max(10)

      el.value = 'ab'
      expect(v.validate().errors.pass).toBe('Минимальная длина не достигнута')

      el.value = 'abcdefghijk'
      expect(v.validate().errors.pass).toBe('Максимальная длина превышена')

      el.value = 'good'
      expect(v.validate().errors.pass).toBeNull()
    })

    it('number / minNumber / maxNumber', () => {
      const el = input({ name: 'age', type: 'number' })
      const v = createValidator(form)
      v.field('age').number().minNumber(18).maxNumber(100)

      el.value = 'abc'
      expect(v.validate().errors.age).toBe('Поле должно быть числом')

      el.value = '15'
      expect(v.validate().errors.age).toBe('Значение слишком маленькое')

      el.value = '150'
      expect(v.validate().errors.age).toBe('Значение слишком большое')

      el.value = '25'
      expect(v.validate().errors.age).toBeNull()
    })

    it('confirm — сравнивает с другим полем', () => {
      input({ name: 'password', value: '12345' })
      const confirmEl = input({ name: 'confirm' })

      const v = createValidator(form)
      v.field('confirm').confirm('password')

      confirmEl.value = 'wrong'
      expect(v.validate().errors.confirm).toBe('Пароли не совпадают')

      confirmEl.value = '12345'
      expect(v.validate().errors.confirm).toBeNull()
    })

    it('array / minLength / maxLength — для file (упрощённо)', () => {
      const el = input({ type: 'file', name: 'files' })
      const v = createValidator(form)
      v.field('files').array().minLength(1).maxLength(3)


      el.files = null
      expect(v.validate().errors.files).toBe('Поле должно быть массивом')

      el.files = { length: 0 }
      expect(v.validate().errors.files).toBe('Минимальное количество элементов не достигнуто')

      el.files = { length: 4 }
      expect(v.validate().errors.files).toBe('Максимальное количество элементов превышено')

      el.files = { length: 2 }
      expect(v.validate().errors.files).toBeNull()
    })
  })

  // V.validate()
  it('V.validate() — возвращает { isValid, errors }', () => {
    input({ name: 'name' })
    input({ name: 'email' })

    const v = createValidator(form)
    v.field('name').required()
    v.field('email').email()

    let result = v.validate()
    expect(result.isValid).toBe(false)
    expect(result.errors.name).toBe('Поле обязательно для заполнения')
    expect(result.errors.email).toBe('Некорректный email')

    form.querySelector('[name="name"]').value = 'John'
    form.querySelector('[name="email"]').value = 'john@example.com'

    result = v.validate()
    expect(result.isValid).toBe(true)
    expect(result.errors.name).toBeNull()
    expect(result.errors.email).toBeNull()
  })

  it('showError / clearError — добавляет/удаляет класс error и сообщение', () => {
    const fieldWrapper = wrapper(input({ name: 'email' }))
    const v = createValidator(form)
    v.field('email').required()

    //  При ошибке
    v.validate()
    const el = form.querySelector('[name="email"]')
    expect(el.classList.contains('error')).toBe(true)
    const msg = fieldWrapper.querySelector('.error-message')
    expect(msg).toBeDefined()
    expect(msg.textContent).toBe('Поле обязательно для заполнения')

    // при Успехе
    el.value = 'test@example.com'
    v.validate()
    expect(el.classList.contains('error')).toBe(false)
    expect(fieldWrapper.querySelector('.error-message')).toBeNull()
  })
})
