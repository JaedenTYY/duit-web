import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createFromReceipt as createFromReceiptContract,
  getBill as getBillContract,
  getParticipants as getParticipantsContract,
  markPaid as markPaidContract,
  setPaymentQrProfile as setPaymentQrProfileContract,
} from '@/api/generated/bill-controller/bill-controller'
import {
  getGuestBill as getGuestBillContract,
  join as joinGuestBillContract,
  selectItems as selectGuestItemsContract,
  summary as getGuestSummaryContract,
} from '@/api/generated/guest-bill-controller/guest-bill-controller'
import {
  createProfile as createPaymentProfileContract,
  deleteProfile as deletePaymentProfileContract,
  listProfiles as listPaymentProfilesContract,
  updateProfile as updatePaymentProfileContract,
} from '@/api/generated/payment-qr-profile-controller/payment-qr-profile-controller'
import type { Bill, GuestBill, GuestBillSummary, PaymentQrProfile } from '@/types'
import type {
  CreatePaymentQrProfileRequest,
  UpdatePaymentQrProfileRequest,
} from '@/api/generated/model'
import { normalizeReceiptUploadError, validateReceiptImageFile } from '@/utils/receiptFile'
import { apiFailureMessage, extractApiFailure } from '@/lib/apiError'

export type CreatePaymentQrProfilePayload = CreatePaymentQrProfileRequest
export type UpdatePaymentQrProfilePayload = UpdatePaymentQrProfileRequest
export type BillTerminalCode = 'ERR_BILL_EXPIRED_410' | 'ERR_BILL_CLOSED_410'

interface BillTerminalState {
  code: BillTerminalCode
  message: string
}

export const useBillStore = defineStore('bill', () => {
  const bill = ref<Bill | null>(null)
  const guestBill = ref<GuestBill | null>(null)
  const guestSummary = ref<GuestBillSummary | null>(null)
  const paymentProfiles = ref<PaymentQrProfile[]>([])
  const participantToken = ref<string | null>(null)
  const guestShareToken = ref<string | null>(null)
  const ownerTerminalState = ref<BillTerminalState | null>(null)
  const guestTerminalState = ref<BillTerminalState | null>(null)
  const loading = ref(false)
  const uploading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const shareUrl = computed(() => {
    if (!bill.value?.shareToken) return ''
    return `${window.location.origin}/guest/bills/${bill.value.shareToken}`
  })

  async function createFromReceipt(file: File): Promise<Bill> {
    uploading.value = true
    error.value = null

    try {
      const validationError = validateReceiptImageFile(file)
      if (validationError) {
        throw new Error(validationError)
      }

      const response = await createFromReceiptContract({ file })
      bill.value = response.data
      return bill.value
    } catch (requestError: unknown) {
      error.value = extractError(requestError, 'Bill creation failed')
      throw requestError
    } finally {
      uploading.value = false
    }
  }

  async function fetchBill(id: string): Promise<Bill> {
    if (bill.value?.id !== id) {
      bill.value = null
    }
    loading.value = true
    error.value = null
    ownerTerminalState.value = null
    try {
      const response = await getBillContract(id)
      bill.value = response.data
      return bill.value
    } catch (requestError: unknown) {
      ownerTerminalState.value = billTerminalState(requestError)
      error.value = ownerTerminalState.value?.message ?? extractError(requestError, 'Failed to load bill')
      throw requestError
    } finally {
      loading.value = false
    }
  }

  async function fetchParticipants(id: string): Promise<void> {
    const response = await getParticipantsContract(id)
    if (bill.value && bill.value.id === id) {
      bill.value.participants = response.data
      const latestVersion = response.data[0]?.allocationVersion
      if (latestVersion !== undefined) {
        bill.value.allocationVersion = latestVersion
      }
    }
  }

  async function markPaid(billId: string, participantId: string, isPaid: boolean): Promise<void> {
    const expectedAllocationVersion = bill.value?.allocationVersion
    if (expectedAllocationVersion === undefined) {
      throw new Error('Load the latest bill before updating paid status')
    }
    saving.value = true
    error.value = null
    try {
      const response = await markPaidContract(billId, {
        participantId,
        isPaid,
        expectedAllocationVersion
      })
      if (bill.value?.id === billId) {
        bill.value.allocationVersion = response.data.allocationVersion
        const index = bill.value.participants.findIndex(p => p.id === participantId)
        if (index >= 0) {
          bill.value.participants[index] = response.data
        }
      }
    } catch (requestError: unknown) {
      await refetchOnStaleBill(billId, requestError)
      error.value = billMutationError(requestError, 'Failed to update paid status')
      throw requestError
    } finally {
      saving.value = false
    }
  }

  async function setBillPaymentProfile(billId: string, paymentQrProfileId: string | null): Promise<void> {
    const expectedAllocationVersion = bill.value?.allocationVersion
    if (expectedAllocationVersion === undefined) {
      throw new Error('Load the latest bill before updating payment QR')
    }
    saving.value = true
    error.value = null
    try {
      const response = await setPaymentQrProfileContract(billId, {
        paymentQrProfileId: paymentQrProfileId ?? undefined,
        expectedAllocationVersion
      })
      bill.value = response.data
    } catch (requestError: unknown) {
      await refetchOnStaleBill(billId, requestError)
      error.value = billMutationError(requestError, 'Failed to update payment QR')
      throw requestError
    } finally {
      saving.value = false
    }
  }

  async function fetchPaymentProfiles(): Promise<void> {
    const response = await listPaymentProfilesContract()
    paymentProfiles.value = response.data
  }

  async function createPaymentProfile(payload: CreatePaymentQrProfilePayload): Promise<void> {
    saving.value = true
    error.value = null
    try {
      const response = await createPaymentProfileContract(payload)
      const profile = response.data
      paymentProfiles.value = [profile, ...paymentProfiles.value.filter(p => p.id !== profile.id)]
    } catch (requestError: unknown) {
      error.value = extractError(requestError, 'Failed to save payment QR')
      throw requestError
    } finally {
      saving.value = false
    }
  }

  async function updatePaymentProfile(id: string, payload: UpdatePaymentQrProfilePayload): Promise<void> {
    saving.value = true
    error.value = null
    try {
      const response = await updatePaymentProfileContract(id, payload)
      const index = paymentProfiles.value.findIndex(p => p.id === id)
      if (index >= 0) {
        paymentProfiles.value[index] = response.data
      }
    } catch (requestError: unknown) {
      error.value = extractError(requestError, 'Failed to update payment QR')
      throw requestError
    } finally {
      saving.value = false
    }
  }

  async function deletePaymentProfile(id: string): Promise<void> {
    saving.value = true
    error.value = null
    try {
      await deletePaymentProfileContract(id)
      paymentProfiles.value = paymentProfiles.value.filter(p => p.id !== id)
    } catch (requestError: unknown) {
      error.value = extractError(requestError, 'Failed to delete payment QR')
      throw requestError
    } finally {
      saving.value = false
    }
  }

  async function fetchGuestBill(shareToken: string): Promise<GuestBill> {
    if (guestShareToken.value !== shareToken) {
      resetGuestBill()
    }
    guestShareToken.value = shareToken
    loading.value = true
    error.value = null
    guestTerminalState.value = null
    participantToken.value = loadParticipantToken(shareToken)
    try {
      const refreshedBill = await refreshGuestBillSnapshot(shareToken)
      if (participantToken.value) {
        await fetchGuestSummary(shareToken)
      }
      return refreshedBill
    } catch (requestError: unknown) {
      guestTerminalState.value = billTerminalState(requestError)
      clearGuestCapabilityIfPermanent(shareToken, requestError)
      error.value = guestTerminalState.value?.message ?? extractError(requestError, 'This bill split is unavailable')
      throw requestError
    } finally {
      loading.value = false
    }
  }

  async function joinGuestBill(shareToken: string, displayName: string): Promise<void> {
    saving.value = true
    error.value = null
    const operationKey = ensureJoinOperationKey(shareToken)
    try {
      const response = await joinGuestBillContract(
        shareToken,
        { displayName },
        { 'Idempotency-Key': operationKey }
      )
      participantToken.value = response.data.participantToken
      guestSummary.value = response.data.summary
      localStorage.setItem(participantTokenKey(shareToken), response.data.participantToken)
      localStorage.removeItem(joinOperationKey(shareToken))
    } catch (requestError: unknown) {
      const failure = extractApiFailure(requestError)
      if (failure.code === 'ERR_BILL_JOIN_IDEMPOTENCY_CONFLICT_409') {
        error.value = 'This join attempt is already tied to another name. Use the existing participant session if available, or reload the link before trying again.'
      } else {
        guestTerminalState.value = billTerminalState(requestError)
        clearGuestCapabilityIfPermanent(shareToken, requestError)
        error.value = guestTerminalState.value?.message ?? extractError(requestError, 'Failed to join bill')
      }
      throw requestError
    } finally {
      saving.value = false
    }
  }

  async function selectGuestItems(shareToken: string, itemIds: string[]): Promise<void> {
    if (!participantToken.value) {
      throw new Error('Join the bill before selecting items')
    }
    const expectedAllocationVersion = guestSummary.value?.allocationVersion ?? guestBill.value?.allocationVersion
    if (expectedAllocationVersion === undefined) {
      throw new Error('Load the latest bill before selecting items')
    }
    saving.value = true
    error.value = null
    try {
      const response = await selectGuestItemsContract(shareToken, {
        participantToken: participantToken.value,
        itemIds,
        expectedAllocationVersion
      })
      guestSummary.value = response.data
      await refreshGuestBillSnapshot(shareToken).catch(() => undefined)
    } catch (requestError: unknown) {
      await refetchGuestOnStaleBill(shareToken, requestError)
      guestTerminalState.value = billTerminalState(requestError)
      clearGuestCapabilityIfPermanent(shareToken, requestError)
      error.value = guestTerminalState.value?.message ?? billMutationError(requestError, 'Failed to update selected items')
      throw requestError
    } finally {
      saving.value = false
    }
  }

  async function refreshGuestBillSnapshot(shareToken: string): Promise<GuestBill> {
    const response = await getGuestBillContract(shareToken)
    if (guestShareToken.value === shareToken) {
      guestBill.value = response.data
    }
    return response.data
  }

  async function fetchGuestSummary(shareToken: string): Promise<void> {
    if (!participantToken.value) return
    const response = await getGuestSummaryContract(shareToken, { 'X-Participant-Token': participantToken.value })
    if (guestShareToken.value === shareToken) {
      guestSummary.value = response.data
    }
  }

  function resetOwnerBill() {
    bill.value = null
    ownerTerminalState.value = null
    error.value = null
  }

  function resetGuestBill() {
    guestBill.value = null
    guestSummary.value = null
    participantToken.value = null
    guestShareToken.value = null
    guestTerminalState.value = null
    error.value = null
  }

  function resetAuthenticatedState() {
    bill.value = null
    paymentProfiles.value = []
    loading.value = false
    uploading.value = false
    saving.value = false
    error.value = null
    ownerTerminalState.value = null
    resetGuestBill()
  }

  function participantTokenKey(shareToken: string) {
    return `duit_guest_participant_${shareToken}`
  }

  function joinOperationKey(shareToken: string) {
    return `duit_guest_join_operation_${shareToken}`
  }

  function loadParticipantToken(shareToken: string): string | null {
    return localStorage.getItem(participantTokenKey(shareToken))
  }

  function ensureJoinOperationKey(shareToken: string): string {
    const existing = localStorage.getItem(joinOperationKey(shareToken))
    if (existing) return existing
    const generated = crypto.randomUUID()
    localStorage.setItem(joinOperationKey(shareToken), generated)
    return generated
  }

  async function refetchOnStaleBill(billId: string, requestError: unknown): Promise<void> {
    const failure = extractApiFailure(requestError)
    if (failure.code === 'ERR_BILL_STALE_409') {
      await fetchBill(billId).catch(() => undefined)
    }
  }

  async function refetchGuestOnStaleBill(shareToken: string, requestError: unknown): Promise<void> {
    const failure = extractApiFailure(requestError)
    if (failure.code === 'ERR_BILL_STALE_409') {
      await fetchGuestBill(shareToken).catch(() => undefined)
    }
  }

  function billMutationError(requestError: unknown, fallback: string): string {
    const failure = extractApiFailure(requestError)
    if (failure.code === 'ERR_BILL_STALE_409') {
      return 'This bill changed before your update was saved. Review the latest split, then try again.'
    }
    if (failure.code === 'ERR_BILL_PAID_ALLOCATION_CONFLICT_409') {
      return 'This split includes a participant already marked paid. Mark them unpaid before changing allocations.'
    }
    return extractError(requestError, fallback)
  }

  function billTerminalState(requestError: unknown): BillTerminalState | null {
    const failure = extractApiFailure(requestError)
    if (failure.code === 'ERR_BILL_EXPIRED_410') {
      return {
        code: 'ERR_BILL_EXPIRED_410',
        message: 'This bill split has expired. The link can be reviewed only where already available; new guest updates are disabled.',
      }
    }
    if (failure.code === 'ERR_BILL_CLOSED_410') {
      return {
        code: 'ERR_BILL_CLOSED_410',
        message: 'This bill split is closed. New joins and allocation changes are disabled.',
      }
    }
    return null
  }

  function clearGuestCapabilityForShareToken(shareToken: string): void {
    if (participantToken.value && guestShareToken.value === shareToken) {
      participantToken.value = null
    }
    localStorage.removeItem(participantTokenKey(shareToken))
    localStorage.removeItem(joinOperationKey(shareToken))
  }

  function clearGuestCapabilityIfPermanent(shareToken: string, requestError: unknown): void {
    const failure = extractApiFailure(requestError)
    if (guestTerminalState.value || failure.status === 403 || failure.status === 404) {
      clearGuestCapabilityForShareToken(shareToken)
    }
  }

  function extractError(requestError: unknown, fallback: string): string {
    if (requestError && typeof requestError === 'object' && 'response' in requestError) {
      const failure = extractApiFailure(requestError)
      return apiFailureMessage(
        { ...failure, message: normalizeReceiptUploadError(failure.message) },
        fallback
      )
    }
    if (requestError instanceof Error) {
      return normalizeReceiptUploadError(requestError.message)
    }
    return fallback
  }

  return {
    bill,
    guestBill,
    guestSummary,
    paymentProfiles,
    participantToken,
    guestShareToken,
    ownerTerminalState,
    guestTerminalState,
    loading,
    uploading,
    saving,
    error,
    shareUrl,
    createFromReceipt,
    fetchBill,
    fetchParticipants,
    markPaid,
    setBillPaymentProfile,
    fetchPaymentProfiles,
    createPaymentProfile,
    updatePaymentProfile,
    deletePaymentProfile,
    fetchGuestBill,
    joinGuestBill,
    selectGuestItems,
    fetchGuestSummary,
    resetOwnerBill,
    resetGuestBill,
    resetAuthenticatedState
  }
})
