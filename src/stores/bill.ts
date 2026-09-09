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
import {
  captureUserScopeEpoch,
  isCurrentUserScope,
  isUserScopeStaleError,
  UserScopeStaleError,
  throwIfUserScopeStale,
} from '@/stores/resetUserScopedState'

export type CreatePaymentQrProfilePayload = CreatePaymentQrProfileRequest
export type UpdatePaymentQrProfilePayload = UpdatePaymentQrProfileRequest
export type BillTerminalCode = 'ERR_BILL_EXPIRED_410' | 'ERR_BILL_CLOSED_410'

interface BillTerminalState {
  code: BillTerminalCode
  message: string
}

class GuestBillRequestStaleError extends Error {
  constructor() {
    super('Guest bill request changed while this operation was in flight')
    this.name = 'GuestBillRequestStaleError'
  }
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
  let ownerBillFetchGeneration = 0
  let guestBillFetchGeneration = 0

  const shareUrl = computed(() => {
    if (!bill.value?.shareToken) return ''
    return `${window.location.origin}/guest/bills/${bill.value.shareToken}`
  })

  async function createFromReceipt(file: File): Promise<Bill> {
    const scope = captureUserScopeEpoch()
    uploading.value = true
    error.value = null

    try {
      const validationError = validateReceiptImageFile(file)
      if (validationError) {
        throw new Error(validationError)
      }

      const response = await createFromReceiptContract({ file })
      throwIfUserScopeStale(scope)
      bill.value = response.data
      return bill.value
    } catch (requestError: unknown) {
      if (isUserScopeStaleError(requestError)) throw requestError
      if (!isCurrentUserScope(scope)) throw new UserScopeStaleError()
      error.value = extractError(requestError, 'Bill creation failed')
      throw requestError
    } finally {
      if (isCurrentUserScope(scope)) uploading.value = false
    }
  }

  async function fetchBill(id: string): Promise<Bill> {
    const scope = captureUserScopeEpoch()
    const generation = ++ownerBillFetchGeneration
    if (bill.value?.id !== id) {
      bill.value = null
      saving.value = false
    }
    loading.value = true
    error.value = null
    ownerTerminalState.value = null
    try {
      const response = await getBillContract(id)
      throwIfUserScopeStale(scope)
      throwIfOwnerBillRequestStale(id, generation)
      bill.value = response.data
      return bill.value
    } catch (requestError: unknown) {
      if (isUserScopeStaleError(requestError) || isGuestRequestStaleError(requestError)) throw requestError
      if (!isCurrentUserScope(scope)) throw new UserScopeStaleError()
      throwIfOwnerBillRequestStale(id, generation)
      ownerTerminalState.value = billTerminalState(requestError)
      error.value = ownerTerminalState.value?.message ?? extractError(requestError, 'Failed to load bill')
      throw requestError
    } finally {
      if (isCurrentUserScope(scope) && generation === ownerBillFetchGeneration) loading.value = false
    }
  }

  async function fetchParticipants(id: string): Promise<void> {
    const scope = captureUserScopeEpoch()
    const response = await getParticipantsContract(id)
    if (isCurrentUserScope(scope) && bill.value && bill.value.id === id) {
      bill.value.participants = response.data
      const latestVersion = response.data[0]?.allocationVersion
      if (latestVersion !== undefined) {
        bill.value.allocationVersion = latestVersion
      }
    }
  }

  async function markPaid(billId: string, participantId: string, isPaid: boolean): Promise<void> {
    const scope = captureUserScopeEpoch()
    const ownerGeneration = ownerBillFetchGeneration
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
      if (!isCurrentOwnerMutation(scope, billId, ownerGeneration)) return
      if (bill.value?.id === billId) {
        bill.value.allocationVersion = response.data.allocationVersion
        const index = bill.value.participants.findIndex(p => p.id === participantId)
        if (index >= 0) {
          bill.value.participants[index] = response.data
        }
      }
    } catch (requestError: unknown) {
      if (!isCurrentOwnerMutation(scope, billId, ownerGeneration)) return
      await refetchOnStaleBill(billId, requestError)
      if (!isCurrentOwnerBill(scope, billId)) return
      error.value = billMutationError(requestError, 'Failed to update paid status')
      throw requestError
    } finally {
      if (isCurrentOwnerBill(scope, billId)) saving.value = false
    }
  }

  async function setBillPaymentProfile(billId: string, paymentQrProfileId: string | null): Promise<void> {
    const scope = captureUserScopeEpoch()
    const ownerGeneration = ownerBillFetchGeneration
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
      if (!isCurrentOwnerMutation(scope, billId, ownerGeneration)) return
      bill.value = response.data
    } catch (requestError: unknown) {
      if (!isCurrentOwnerMutation(scope, billId, ownerGeneration)) return
      await refetchOnStaleBill(billId, requestError)
      if (!isCurrentOwnerBill(scope, billId)) return
      error.value = billMutationError(requestError, 'Failed to update payment QR')
      throw requestError
    } finally {
      if (isCurrentOwnerBill(scope, billId)) saving.value = false
    }
  }

  async function fetchPaymentProfiles(): Promise<void> {
    const scope = captureUserScopeEpoch()
    try {
      const response = await listPaymentProfilesContract()
      if (!isCurrentUserScope(scope)) return
      paymentProfiles.value = response.data
    } catch (requestError: unknown) {
      if (!isCurrentUserScope(scope)) return
      error.value = extractError(requestError, 'Failed to load payment QR profiles')
      throw requestError
    }
  }

  async function createPaymentProfile(payload: CreatePaymentQrProfilePayload): Promise<void> {
    const scope = captureUserScopeEpoch()
    saving.value = true
    error.value = null
    try {
      const response = await createPaymentProfileContract(payload)
      if (!isCurrentUserScope(scope)) return
      const profile = response.data
      paymentProfiles.value = [profile, ...paymentProfiles.value.filter(p => p.id !== profile.id)]
    } catch (requestError: unknown) {
      if (!isCurrentUserScope(scope)) return
      error.value = extractError(requestError, 'Failed to save payment QR')
      throw requestError
    } finally {
      if (isCurrentUserScope(scope)) saving.value = false
    }
  }

  async function updatePaymentProfile(id: string, payload: UpdatePaymentQrProfilePayload): Promise<void> {
    const scope = captureUserScopeEpoch()
    saving.value = true
    error.value = null
    try {
      const response = await updatePaymentProfileContract(id, payload)
      if (!isCurrentUserScope(scope)) return
      const index = paymentProfiles.value.findIndex(p => p.id === id)
      if (index >= 0) {
        paymentProfiles.value[index] = response.data
      }
    } catch (requestError: unknown) {
      if (!isCurrentUserScope(scope)) return
      error.value = extractError(requestError, 'Failed to update payment QR')
      throw requestError
    } finally {
      if (isCurrentUserScope(scope)) saving.value = false
    }
  }

  async function deletePaymentProfile(id: string): Promise<void> {
    const scope = captureUserScopeEpoch()
    saving.value = true
    error.value = null
    try {
      await deletePaymentProfileContract(id)
      if (!isCurrentUserScope(scope)) return
      paymentProfiles.value = paymentProfiles.value.filter(p => p.id !== id)
    } catch (requestError: unknown) {
      if (!isCurrentUserScope(scope)) return
      error.value = extractError(requestError, 'Failed to delete payment QR')
      throw requestError
    } finally {
      if (isCurrentUserScope(scope)) saving.value = false
    }
  }

  async function fetchGuestBill(shareToken: string): Promise<GuestBill> {
    if (guestShareToken.value !== shareToken) {
      resetGuestBill()
      saving.value = false
    }
    const generation = ++guestBillFetchGeneration
    guestShareToken.value = shareToken
    loading.value = true
    error.value = null
    guestTerminalState.value = null
    participantToken.value = loadParticipantToken(shareToken)
    try {
      const refreshedBill = await refreshGuestBillSnapshot(shareToken, generation)
      if (participantToken.value) {
        await fetchGuestSummary(shareToken, generation)
      }
      throwIfGuestBillRequestStale(shareToken, generation)
      return refreshedBill
    } catch (requestError: unknown) {
      if (isGuestRequestStaleError(requestError)) throw requestError
      throwIfGuestBillRequestStale(shareToken, generation)
      guestTerminalState.value = billTerminalState(requestError)
      clearGuestCapabilityIfPermanent(shareToken, requestError)
      error.value = guestTerminalState.value?.message ?? extractError(requestError, 'This bill split is unavailable')
      throw requestError
    } finally {
      if (isCurrentGuestBillRequest(shareToken, generation)) loading.value = false
    }
  }

  async function joinGuestBill(shareToken: string, displayName: string): Promise<void> {
    if (guestShareToken.value !== shareToken) {
      resetGuestBill()
      guestShareToken.value = shareToken
      participantToken.value = loadParticipantToken(shareToken)
    }
    const generation = guestBillFetchGeneration
    saving.value = true
    error.value = null
    const operationKey = ensureJoinOperationKey(shareToken)
    try {
      const response = await joinGuestBillContract(
        shareToken,
        { displayName },
        { 'Idempotency-Key': operationKey }
      )
      if (!isCurrentGuestBillRequest(shareToken, generation)) return
      participantToken.value = response.data.participantToken
      guestSummary.value = response.data.summary
      localStorage.setItem(participantTokenKey(shareToken), response.data.participantToken)
      localStorage.removeItem(joinOperationKey(shareToken))
    } catch (requestError: unknown) {
      if (!isCurrentGuestBillRequest(shareToken, generation)) return
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
      if (isCurrentGuestBillRequest(shareToken, generation)) saving.value = false
    }
  }

  async function selectGuestItems(shareToken: string, itemIds: string[]): Promise<void> {
    const generation = guestBillFetchGeneration
    if (!isCurrentGuestBillRequest(shareToken, generation)) return
    if (!participantToken.value) {
      throw new Error('Join the bill before selecting items')
    }
    const requestParticipantToken = participantToken.value
    const expectedAllocationVersion = guestSummary.value?.allocationVersion ?? guestBill.value?.allocationVersion
    if (expectedAllocationVersion === undefined) {
      throw new Error('Load the latest bill before selecting items')
    }
    saving.value = true
    error.value = null
    try {
      const response = await selectGuestItemsContract(shareToken, {
        participantToken: requestParticipantToken,
        itemIds,
        expectedAllocationVersion
      })
      if (!isCurrentGuestBillRequest(shareToken, generation) || participantToken.value !== requestParticipantToken) return
      guestSummary.value = response.data
      await refreshGuestBillSnapshot(shareToken).catch(() => undefined)
    } catch (requestError: unknown) {
      if (!isCurrentGuestBillRequest(shareToken, generation) || participantToken.value !== requestParticipantToken) return
      await refetchGuestOnStaleBill(shareToken, requestError)
      if (!isCurrentGuestBillRequest(shareToken, generation) || participantToken.value !== requestParticipantToken) return
      guestTerminalState.value = billTerminalState(requestError)
      clearGuestCapabilityIfPermanent(shareToken, requestError)
      error.value = guestTerminalState.value?.message ?? billMutationError(requestError, 'Failed to update selected items')
      throw requestError
    } finally {
      if (isCurrentGuestBillRequest(shareToken, generation) && participantToken.value === requestParticipantToken) saving.value = false
    }
  }

  async function refreshGuestBillSnapshot(
    shareToken: string,
    generation = guestBillFetchGeneration,
  ): Promise<GuestBill> {
    const response = await getGuestBillContract(shareToken)
    if (isCurrentGuestBillRequest(shareToken, generation)) {
      guestBill.value = response.data
    }
    return response.data
  }

  async function fetchGuestSummary(
    shareToken: string,
    generation = guestBillFetchGeneration,
  ): Promise<void> {
    if (!participantToken.value) return
    const requestParticipantToken = participantToken.value
    const response = await getGuestSummaryContract(shareToken, { 'X-Participant-Token': requestParticipantToken })
    if (isCurrentGuestBillRequest(shareToken, generation) && participantToken.value === requestParticipantToken) {
      guestSummary.value = response.data
    }
  }

  function resetOwnerBill() {
    ownerBillFetchGeneration += 1
    bill.value = null
    ownerTerminalState.value = null
    error.value = null
  }

  function resetGuestBill() {
    guestBillFetchGeneration += 1
    guestBill.value = null
    guestSummary.value = null
    participantToken.value = null
    guestShareToken.value = null
    guestTerminalState.value = null
    error.value = null
  }

  function resetAuthenticatedState() {
    ownerBillFetchGeneration += 1
    bill.value = null
    paymentProfiles.value = []
    loading.value = false
    uploading.value = false
    saving.value = false
    error.value = null
    ownerTerminalState.value = null
    resetGuestBill()
  }

  function isCurrentGuestBillRequest(shareToken: string, generation: number): boolean {
    return guestShareToken.value === shareToken && generation === guestBillFetchGeneration
  }

  function throwIfGuestBillRequestStale(shareToken: string, generation: number): void {
    if (!isCurrentGuestBillRequest(shareToken, generation)) {
      throw new GuestBillRequestStaleError()
    }
  }

  function isGuestRequestStaleError(error: unknown): error is GuestBillRequestStaleError {
    return error instanceof GuestBillRequestStaleError
  }

  function throwIfOwnerBillRequestStale(id: string, generation: number): void {
    if (generation !== ownerBillFetchGeneration || (bill.value !== null && bill.value.id !== id)) {
      throw new UserScopeStaleError()
    }
  }

  function isCurrentOwnerMutation(scope: number, billId: string, generation: number): boolean {
    return isCurrentUserScope(scope) &&
      generation === ownerBillFetchGeneration &&
      bill.value?.id === billId
  }

  function isCurrentOwnerBill(scope: number, billId: string): boolean {
    return isCurrentUserScope(scope) && bill.value?.id === billId
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
