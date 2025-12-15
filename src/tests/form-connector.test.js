import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FormConnector } from '@/core/form-connector' 

describe('FormConnector — полный и подробный тест', () => {
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

  const createInput = (attrs = {}) => {
    const el = document.createElement('input')
    Object.assign(el, attrs)
    if (attrs.name) el.name = attrs.name
    if (attrs.id) el.id = attrs.id
    if (attrs['field-name']) el.setAttribute('field-name', attrs['field-name'])
    form.appendChild(el)
    return el
  }

  const createLabel = (forId, text) => {
    const label = document.createElement('label')
    label.htmlFor = forId
    label.textContent = text
    form.appendChild(label)
    return label
  }

  const createErrorContainer = (className = 'error-message') => {
    const div = document.createElement('div')
    div.className = className
    return div
  }
  it('собирает поля по field-name, name и id', () => {
    createInput({ 'field-name': 'custom-field' })
    createInput({ name: 'username' })
    createInput({ id: 'age-field' })

    const connector = new FormConnector(form)

    expect(connector.field('custom-field')).toBeDefined()
    expect(connector.field('username')).toBeDefined()
    expect(connector.field('age-field')).toBeDefined()
  })

  it('field-name имеет приоритет над name и id', () => {
    createInput({ name: 'email', id: 'email', 'field-name': 'user-email' })

    const connector = new FormConnector(form)

    expect(connector.field('user-email')).toBeDefined()
    expect(connector.field('email')).toBeNull()
  })

  it('собирает только валидные элементы (input, textarea, select, output)', () => {
    createInput({ type: 'submit' })
    createInput({ type: 'button' })
    createInput({ type: 'text', name: 'text' })
    const textarea = document.createElement('textarea')
    textarea.name = 'desc'
    form.appendChild(textarea)
    const select = document.createElement('select')
    select.name = 'country'
    form.appendChild(select)
    const output = document.createElement('output')
    output.name = 'result'
    form.appendChild(output)

    const connector = new FormConnector(form)

    expect(connector.field('text')).toBeDefined()
    expect(connector.field('desc')).toBeDefined()
    expect(connector.field('country')).toBeDefined()
    expect(connector.field('result')).toBeDefined()
    expect(connector.field('submit')).toBeNull()
  })

   describe('getLabel() — сбор лейблов', () => {
    it('находит лейбл по for=id', () => {
      createInput({ id: 'username' })
      createLabel('username', 'Имя пользователя')

      const connector = new FormConnector(form)
      const label = connector.getLabel('username')

      expect(label).toBeDefined()
      expect(label?.textContent).toBe('Имя пользователя')
    })

    it('находит вложенный лейбл (input внутри label)', () => {
      const label = document.createElement('label')
      label.textContent = 'Согласие'
      const agreeInput = createInput({ name: 'agree' })
      label.appendChild(agreeInput)
      form.appendChild(label)

      const connector = new FormConnector(form)
      const foundLabel = connector.getLabel('agree')

      expect(foundLabel).toBe(label)
    })

    it('возвращает null, если лейбл не найден', () => {
      createInput({ name: 'no-label' })

      const connector = new FormConnector(form)
      expect(connector.getLabel('no-label')).toBeNull()
    })
  })

  describe('getErrorContainer() — сбор контейнеров ошибок', () => {
    it('по умолчанию ищет .error-message в parent или next sibling', () => {
      const wrapper = document.createElement('div')
      const emailInput = createInput({ name: 'email' })
      const errorDiv = createErrorContainer()
      wrapper.appendChild(emailInput)
      wrapper.appendChild(errorDiv)
      form.appendChild(wrapper)

      const connector = new FormConnector(form)
      const errorContainerEl = connector.getErrorContainer('email')

      expect(errorContainerEl).toBe(errorDiv)
    })

    it('ищет nextElementSibling с классом .error-message', () => {
      const passwordInput = createInput({ name: 'password' })
      const errorDiv = createErrorContainer()
      form.appendChild(passwordInput)
      form.appendChild(errorDiv)

      const connector = new FormConnector(form)
      const errorContainerEl = connector.getErrorContainer('password')

      expect(errorContainerEl).toBe(errorDiv)
    })

    it('поддерживает кастомный селектор через options', () => {
      const wrapper = document.createElement('div')
      wrapper.className = 'field'
      const ageInput = createInput({ name: 'age' })
      const customError = document.createElement('span')
      customError.className = 'msg-error'
      wrapper.appendChild(ageInput)
      wrapper.appendChild(customError)
      form.appendChild(wrapper)

      const connector = new FormConnector(form, { errorContainer: '.msg-error' })
      const errorContainerEl = connector.getErrorContainer('age')

      expect(errorContainerEl).toBe(customError)
    })

    it('поддерживает глобальный контейнер по ID через #selector', () => {
      const globalError = document.createElement('div')
      globalError.id = 'global-errors'
      document.body.appendChild(globalError)

      const connector = new FormConnector(form, { errorContainer: '#global-errors' })
      const errorContainerEl = connector.getErrorContainer('any-field')

      expect(errorContainerEl).toBe(globalError)

      document.body.removeChild(globalError)
    })

    it('возвращает null, если контейнер не найден', () => {
      createInput({ name: 'no-error' })

      const connector = new FormConnector(form)
      expect(connector.getErrorContainer('no-error')).toBeNull()
    })
  })

  
  describe('геттеры', () => {
    it('getFields() возвращает копию карты полей', () => {
      createInput({ name: 'one' })
      createInput({ name: 'two' })

      const connector = new FormConnector(form)
      const fields = connector.getFields()

      expect(fields.size).toBe(2)
      expect(fields.has('one')).toBe(true)
      expect(fields.has('two')).toBe(true)
      expect(fields).not.toBe(connector['inputElements'])
    })

    it('getFormElement() возвращает форму', () => {
      const connector = new FormConnector(form)
      expect(connector.getFormElement()).toBe(form)
    })
  })
})
