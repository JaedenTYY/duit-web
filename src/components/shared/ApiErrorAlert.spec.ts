import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ApiErrorAlert from './ApiErrorAlert.vue'

describe('ApiErrorAlert', () => {
  it('shows a compact support reference without replacing the public message', () => {
    const wrapper = mount(ApiErrorAlert, {
      props: {
        message: 'An unexpected error occurred',
        referenceId: 'f64651f2-c852-4dd7-869a-c20a5a434534',
      },
    })

    expect(wrapper.text()).toContain('An unexpected error occurred')
    expect(wrapper.text()).toContain(
      'Reference ID: f64651f2-c852-4dd7-869a-c20a5a434534'
    )
  })

  it('does not show request IDs for ordinary controlled failures', () => {
    const wrapper = mount(ApiErrorAlert, {
      props: {
        message: 'Invalid email or password',
        referenceId: null,
      },
    })

    expect(wrapper.text()).toBe('Invalid email or password')
    expect(wrapper.text()).not.toContain('Reference ID')
  })
})
