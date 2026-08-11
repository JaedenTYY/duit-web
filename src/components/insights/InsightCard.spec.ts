import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import InsightCard from './InsightCard.vue'

describe('InsightCard', () => {
  it('renders NEW as a semantic label instead of zero percent', () => {
    const wrapper = mount(InsightCard, {
      props: {
        insight: {
          id: 'insight-1', userId: 'user-1', periodStart: '2026-07-03', periodEnd: '2026-07-09',
          generatedAt: '2026-07-10T00:00:00Z',
          content: {
            headline: 'New week', summary: 'First spending week', totalSpent: '10.0000', currency: 'MYR',
            comparisonPercentage: null, topCategories: [], topMerchants: [], largestTransactions: [],
            unusualIncreases: [], spendingTrend: {
              direction: 'NEW', currentTotal: '10.00', previousTotal: '0.00', changePercentage: null,
            },
            billSplitSettlements: null, findings: [], recommendation: 'Keep tracking',
            recommendations: ['Keep tracking'], positiveNote: 'Good start', riskLevel: 'LOW',
          },
        },
      },
    })
    expect(wrapper.text()).toContain('New spending')
    expect(wrapper.text()).not.toContain('0%')
  })
})
