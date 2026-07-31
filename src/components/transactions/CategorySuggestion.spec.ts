import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CategorySuggestion from './CategorySuggestion.vue'

const categories = [{ id: 'food', name: 'Food & Dining', icon: '🍔', color: '#FF5733' }]

describe('CategorySuggestion', () => {
  it('presents an omitted-score saved preference as personal and owner scoped', async () => {
    const wrapper = mount(CategorySuggestion, {
      props: {
        categories,
        categorisation: {
          merchantId: 'merchant-1',
          merchantName: 'Coffee House',
          categoryId: 'food',
      source: 'USER_PREFERENCE',
      personalised: true,
      isAutomaticCategory: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Your saved category')
    expect(wrapper.text()).toContain('remembered your previous choice')
    expect(wrapper.text()).not.toContain('AI Suggestion')
    expect(wrapper.text()).not.toContain('Score:')
    const forget = wrapper.get('button[aria-label="Forget saved category for this merchant"]')
    await forget.trigger('click')
    expect(wrapper.emitted('forget')).toEqual([['merchant-1']])
  })

  it('does not render a score for an omitted-score system baseline', () => {
    const wrapper = mount(CategorySuggestion, {
      props: {
        categories,
        categorisation: {
          merchantId: 'merchant-1',
          merchantName: 'Coffee House',
          categoryId: 'food',
      source: 'SYSTEM_MERCHANT',
      personalised: false,
      isAutomaticCategory: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Merchant category')
    expect(wrapper.text()).not.toContain('Score:')
  })

  it('renders nothing for NONE when optional fields are omitted', () => {
    const wrapper = mount(CategorySuggestion, {
      props: {
        categories,
        categorisation: {
          merchantName: 'Unknown',
      source: 'NONE',
      personalised: false,
      isAutomaticCategory: false,
        },
      },
    })

    expect(wrapper.text()).toBe('')
  })

  it('displays the real finite semantic similarity and confidence', () => {
    const wrapper = mount(CategorySuggestion, {
      props: {
        categories,
        categorisation: {
          merchantId: 'merchant-2',
          merchantName: 'Similar Cafe',
          categoryId: 'food',
      source: 'SEMANTIC_SIMILARITY',
      personalised: false,
      isAutomaticCategory: true,
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

  it.each([
    ['undefined', undefined],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('does not display a semantic score when it is %s', (_, similarityScore) => {
    const wrapper = mount(CategorySuggestion, {
      props: {
        categories,
        categorisation: {
          merchantId: 'merchant-2',
          merchantName: 'Similar Cafe',
          categoryId: 'food',
      source: 'SEMANTIC_SIMILARITY',
      personalised: false,
      isAutomaticCategory: false,
          similarityScore,
          confidence: 'MEDIUM',
        },
      },
    })

    expect(wrapper.text()).not.toContain('Score:')
    expect(wrapper.text()).not.toContain('NaN%')
    expect(wrapper.text()).not.toContain('undefined%')
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
      isAutomaticCategory: true,
        },
      },
    })

    const button = wrapper.get('button[aria-label="Use 🍔 Food & Dining category"]')
    await button.trigger('keydown.enter')
    await button.trigger('click')

    expect(wrapper.emitted('apply')).toEqual([['food']])
  })
})
