import type { CategorisationResult as ApiCategorisationResult } from '@/api/generated/model/categorisationResult'
import type { CategoryResponse as ApiCategory } from '@/api/generated/model/categoryResponse'
import type { EmailExtractionResponse as ApiEmailExtraction } from '@/api/generated/model/emailExtractionResponse'
import type { MonthlySummaryResponse as ApiMonthlySummary } from '@/api/generated/model/monthlySummaryResponse'
import type { TransactionResponse as ApiTransaction } from '@/api/generated/model/transactionResponse'
import type { AnomalyAlertResponse as ApiAnomalyAlert } from '@/api/generated/model/anomalyAlertResponse'
import type { AnomalyFeatureVector as ApiAnomalyFeatures } from '@/api/generated/model/anomalyFeatureVector'
import type { BillItemResponse as ApiBillItem } from '@/api/generated/model/billItemResponse'
import type { BillParticipantItemResponse as ApiBillParticipantItem } from '@/api/generated/model/billParticipantItemResponse'
import type { BillParticipantResponse as ApiBillParticipant } from '@/api/generated/model/billParticipantResponse'
import type { BillResponse as ApiBill } from '@/api/generated/model/billResponse'
import type { ExtractedReceiptDataResponse as ApiExtractedReceiptData } from '@/api/generated/model/extractedReceiptDataResponse'
import type { GmailStatusResponse as ApiGmailStatus } from '@/api/generated/model/gmailStatusResponse'
import type { GmailSyncResponse as ApiGmailSyncResult } from '@/api/generated/model/gmailSyncResponse'
import type { GuestBillResponse as ApiGuestBill } from '@/api/generated/model/guestBillResponse'
import type { GuestBillSummaryResponse as ApiGuestBillSummary } from '@/api/generated/model/guestBillSummaryResponse'
import type { GuestPaymentQrProfileResponse as ApiGuestPaymentQrProfile } from '@/api/generated/model/guestPaymentQrProfileResponse'
import type { Insight as ApiInsight } from '@/api/generated/model/insight'
import type { InsightFinding as ApiInsightFinding } from '@/api/generated/model/insightFinding'
import type { LineItemResponse as ApiReceiptLineItem } from '@/api/generated/model/lineItemResponse'
import type { PaymentQrProfileResponse as ApiPaymentQrProfile } from '@/api/generated/model/paymentQrProfileResponse'
import type { ReceiptExtractionResponse as ApiReceiptExtraction } from '@/api/generated/model/receiptExtractionResponse'
import type { StatementImportResponse as ApiStatementImportResult } from '@/api/generated/model/statementImportResponse'
import type { StatementRowResponse as ApiStatementRow } from '@/api/generated/model/statementRowResponse'
import type { StatementUploadResponse as ApiStatementUpload } from '@/api/generated/model/statementUploadResponse'
import type { WeeklyInsightContent as ApiInsightContent } from '@/api/generated/model/weeklyInsightContent'

export interface User {
  id: string
  email: string
  fullName: string
  preferredCurrency: string
  createdAt: string
}

export type Transaction = Omit<
  ApiTransaction,
  | 'merchantId'
  | 'merchantName'
  | 'categoryId'
  | 'categoryName'
  | 'categoryIcon'
  | 'categoryColor'
  | 'description'
> & {
  merchantId?: string | null
  merchantName?: string | null
  categoryId?: string | null
  categoryName?: string | null
  categoryIcon?: string | null
  categoryColor?: string | null
  description?: string | null
}

export interface Merchant {
  id: string
  name: string
  canonical: string
  categoryId: string
}

export type Category = Omit<ApiCategory, 'icon' | 'color'> & {
  icon?: string | null
  color?: string | null
}

export type Insight = ApiInsight
export type InsightContent = ApiInsightContent
export type InsightFinding = ApiInsightFinding
export type AnomalyAlert = ApiAnomalyAlert
export type AnomalyFeatures = ApiAnomalyFeatures

export type StatementRow = ApiStatementRow
export type StatementUpload = ApiStatementUpload
export type StatementImportResult = ApiStatementImportResult
export type GmailStatus = ApiGmailStatus
export type GmailSyncResult = ApiGmailSyncResult

export type EmailExtraction = ApiEmailExtraction

export type MonthlySummary = ApiMonthlySummary
export type ReceiptLineItem = ApiReceiptLineItem
export type ParsedReceipt = ApiExtractedReceiptData
export type ReceiptExtractionResponse = ApiReceiptExtraction
export type BillItem = ApiBillItem
export type Bill = ApiBill
export type BillParticipantItem = ApiBillParticipantItem
export type BillParticipant = ApiBillParticipant
export type PaymentQrProfile = ApiPaymentQrProfile
export type GuestPaymentQrProfile = ApiGuestPaymentQrProfile
export type GuestBill = ApiGuestBill
export type GuestBillSummary = ApiGuestBillSummary

export type CategorisationResult = ApiCategorisationResult
