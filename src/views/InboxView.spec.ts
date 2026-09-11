import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import InboxView from './InboxView.vue'

describe('InboxView import hub', () => {
  it('exposes active import routes without inactive goal or tax affordances', () => {
    const wrapper = mount(InboxView, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="typeof to === `string` ? to : to.path"><slot /></a>',
          },
          PageHeader: { template: '<header><slot name="actions" /></header>' },
          ReceiptUploadModal: true,
        },
      },
    })

    expect(wrapper.get('a[href="/statements"]').text()).toContain('Import statement')
    expect(wrapper.get('a[href="/gmail"]').text()).toContain('Gmail eReceipts')
    expect(wrapper.text()).not.toContain('Tax')
    expect(wrapper.text()).not.toContain('Goal')
  })
})
