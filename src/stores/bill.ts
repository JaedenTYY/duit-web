import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/lib/api'
import type { Bill, GuestBill, GuestBillSummary, PaymentQrProfile } from '@/types'

interface ApiResponse<T> {
  data: T
}

export interface CreatePaymentQrProfilePayload {
  provider: string
  displayName: string
  qrImageUrl?: string
  qrPayload?: string
  isDefault?: boolean
}

export interface UpdatePaymentQrProfilePayload {
  provider?: string
  displayName?: string
  qrImageUrl?: string
  qrPayload?: string
  isDefault?: boolean
}

export const useBillStore = defineStore('bill', () => {
  const bill = ref<Bill | null>(null)
  const guestBill = ref<GuestBill | null>(null)
  const guestSummary = ref<GuestBillSummary | null>(null)
  const paymentProfiles = ref<PaymentQrProfile[]>([])
  const participantToken = ref<string | null>(null)
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
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post<ApiResponse<Bill>>('/bills/from-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      bill.value = response.data.data
      return bill.value
    } catch (requestError: unknown) {
      error.value = extractError(requestError, 'Bill creation failed')
      throw requestError
    } finally {
      uploading.value = false
    }
  }

  async function fetchBill(id: string): Promise<Bill> {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<ApiResponse<Bill>>(`/bills/${id}`)
      bill.value = response.data.data
      return bill.value
    } catch (requestError: unknown) {
      error.value = extractError(requestError, 'Failed to load bill')
      throw requestError
    } finally {
      loading.value = false
    }
  }

  async function fetchParticipants(id: string): Promise<void> {
    const response = await api.get<ApiResponse<Bill['participants']>>(`/bills/${id}/participants`)
    if (bill.value && bill.value.id === id) {
      bill.value.participants = response.data.data
    }
  }

  async function markPaid(billId: string, participantId: string, isPaid: boolean): Promise<void> {
    saving.value = true
    error.value = null
    try {
      const response = await api.post<ApiResponse<Bill['participants'][number]>>(`/bills/${billId}/mark-paid`, {
        participantId,
        isPaid
      })
      if (bill.value?.id === billId) {
        const index = bill.value.participants.findIndex(p => p.id === participantId)
        if (index >= 0) {
          bill.value.participants[index] = response.data.data
        }
      }
    } catch (requestError: unknown) {
      error.value = extractError(requestError, 'Failed to update paid status')
      throw requestError
    } finally {
      saving.value = false
    }
  }

  async function setBillPaymentProfile(billId: string, paymentQrProfileId: string | null): Promise<void> {
    saving.value = true
    error.value = null
    try {
      const response = await api.patch<ApiResponse<Bill>>(`/bills/${billId}/payment-qr-profile`, {
        paymentQrProfileId
      })
      bill.value = response.data.data
    } catch (requestError: unknown) {
      error.value = extractError(requestError, 'Failed to update payment QR')
      throw requestError
    } finally {
      saving.value = false
    }
  }

  async function fetchPaymentProfiles(): Promise<void> {
    const response = await api.get<ApiResponse<PaymentQrProfile[]>>('/payment-qr-profiles')
    paymentProfiles.value = response.data.data
  }

  async function createPaymentProfile(payload: CreatePaymentQrProfilePayload): Promise<void> {
    saving.value = true
    error.value = null
    try {
      const response = await api.post<ApiResponse<PaymentQrProfile>>('/payment-qr-profiles', payload)
      paymentProfiles.value = [response.data.data, ...paymentProfiles.value.filter(p => p.id !== response.data.data.id)]
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
      const response = await api.patch<ApiResponse<PaymentQrProfile>>(`/payment-qr-profiles/${id}`, payload)
      const index = paymentProfiles.value.findIndex(p => p.id === id)
      if (index >= 0) {
        paymentProfiles.value[index] = response.data.data
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
      await api.delete(`/payment-qr-profiles/${id}`)
      paymentProfiles.value = paymentProfiles.value.filter(p => p.id !== id)
    } catch (requestError: unknown) {
      error.value = extractError(requestError, 'Failed to delete payment QR')
      throw requestError
    } finally {
      saving.value = false
    }
  }

  async function fetchGuestBill(shareToken: string): Promise<GuestBill> {
    loading.value = true
    error.value = null
    participantToken.value = loadParticipantToken(shareToken)
    try {
      const response = await api.get<ApiResponse<GuestBill>>(`/guest/bills/${shareToken}`)
      guestBill.value = response.data.data
      if (participantToken.value) {
        await fetchGuestSummary(shareToken)
      }
      return guestBill.value
    } catch (requestError: unknown) {
      error.value = extractError(requestError, 'This bill split is unavailable')
      throw requestError
    } finally {
      loading.value = false
    }
  }

  async function joinGuestBill(shareToken: string, displayName: string): Promise<void> {
    saving.value = true
    error.value = null
    try {
      const response = await api.post<ApiResponse<{ participantToken: string; summary: GuestBillSummary }>>(
        `/guest/bills/${shareToken}/join`,
        { displayName }
      )
      participantToken.value = response.data.data.participantToken
      guestSummary.value = response.data.data.summary
      localStorage.setItem(participantTokenKey(shareToken), response.data.data.participantToken)
    } catch (requestError: unknown) {
      error.value = extractError(requestError, 'Failed to join bill')
      throw requestError
    } finally {
      saving.value = false
    }
  }

  async function selectGuestItems(shareToken: string, itemIds: string[]): Promise<void> {
    if (!participantToken.value) {
      throw new Error('Join the bill before selecting items')
    }
    saving.value = true
    error.value = null
    try {
      const response = await api.post<ApiResponse<GuestBillSummary>>(`/guest/bills/${shareToken}/items`, {
        participantToken: participantToken.value,
        itemIds
      })
      guestSummary.value = response.data.data
    } catch (requestError: unknown) {
      error.value = extractError(requestError, 'Failed to update selected items')
      throw requestError
    } finally {
      saving.value = false
    }
  }

  async function fetchGuestSummary(shareToken: string): Promise<void> {
    if (!participantToken.value) return
    const response = await api.get<ApiResponse<GuestBillSummary>>(`/guest/bills/${shareToken}/summary`, {
      headers: { 'X-Participant-Token': participantToken.value }
    })
    guestSummary.value = response.data.data
  }

  function resetOwnerBill() {
    bill.value = null
    error.value = null
  }

  function resetGuestBill() {
    guestBill.value = null
    guestSummary.value = null
    participantToken.value = null
    error.value = null
  }

  function participantTokenKey(shareToken: string) {
    return `duit_guest_participant_${shareToken}`
  }

  function loadParticipantToken(shareToken: string): string | null {
    return localStorage.getItem(participantTokenKey(shareToken))
  }

  function extractError(requestError: unknown, fallback: string): string {
    if (requestError && typeof requestError === 'object' && 'response' in requestError) {
      const axiosError = requestError as {
        response?: { data?: { error?: { message?: string } } }
      }
      return axiosError.response?.data?.error?.message ?? fallback
    }
    return fallback
  }

  return {
    bill,
    guestBill,
    guestSummary,
    paymentProfiles,
    participantToken,
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
    resetGuestBill
  }
})
