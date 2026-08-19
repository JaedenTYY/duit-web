import {
  categorise,
  deleteCategoryPreference,
} from '@/api/generated/merchant-controller/merchant-controller'
import type { CategorisationResult } from '@/types'

export function useMerchantCategorisation() {
  async function categoriseMerchant(name: string): Promise<CategorisationResult> {
    const response = await categorise({ name })
    return response.data as CategorisationResult
  }

  async function forgetMerchantCategoryPreference(merchantId: string): Promise<void> {
    await deleteCategoryPreference(merchantId)
  }

  return {
    categoriseMerchant,
    forgetMerchantCategoryPreference,
  }
}
