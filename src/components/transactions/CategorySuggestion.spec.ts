import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CategorySuggestion from './CategorySuggestion.vue'

const categories = [{ id: 'food', name: 'Food & Dining', icon: '🍔', color: '#FF5733' }]

describe('CategorySuggestion', () => {
  it('presents a saved preference as personal, without AI wording or a similarity score', () => {
    const wrapper = mount(CategorySuggestion, {
      props: {
        categories,
        categorisation: {
          merchantId: 'merchant-1',
          merchantName: 'Coffee House',
          categoryId: 'food',
          source: 'USER_PREFERENCE',
          personalised: true,
          similarityScore: null,
          confidence: null,
        },
      },
    })

    expect(wrapper.text()).toContain('Your saved category')
    expect(wrapper.text()).toContain('remembered your previous choice')
    expect(wrapper.text()).not.toContain('AI Suggestion')
    expect(wrapper.text()).not.toContain('Score:')
    expect(wrapper.find('button[aria-label="Forget saved category for this merchant"]').exists()).toBe(true)
  })

  it('displays the real semantic similarity and confidence only for a semantic result', () => {
    const wrapper = mount(CategorySuggestion, {
      props: {
        categories,
        categorisation: {
          merchantId: 'merchant-2',
          merchantName: 'Similar Cafe',
          categoryId: 'food',
          source: 'SEMANTIC_SIMILARITY',
          personalised: false,
          similarityScore: 0.873,
          confidence: 'HIGH',
        },
      },
    })

    expect(wrapper.text()).toContain('Suggested from similar merchants')
    expect(wrapper.text()).toContain('HIGH')
    expect(wrapper.text()).toContain('Score: 87.3%')
    expect(wrapper.find('button[aria-label="Forget saved category for this merchant"]').exists()).toBe(false)
  })

  it('keeps controls keyboard-accessible and emits the selected category', async () => {
    const wrapper = mount(CategorySuggestion, {
      props: {
        categories,
        categorisation: {
          merchantId: 'merchant-1',
          merchantName: 'Coffee House',
          categoryId: 'food',
          source: 'USER_PREFERENCE',
          personalised: true,
          similarityScore: null,
          confidence: null,
        },
      },
    })

    const button = wrapper.get('button[aria-label="Use 🍔 Food & Dining category"]')
    await button.trigger('keydown.enter')
    await button.trigger('click')

    expect(wrapper.emitted('apply')).toEqual([['food']])
  })
})
