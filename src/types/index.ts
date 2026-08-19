import type { CategorisationResult as ApiCategorisationResult } from '@/api/generated/model/categorisationResult'
import type { CategoryResponse as ApiCategory } from '@/api/generated/model/categoryResponse'
import type { EmailExtractionResponse as ApiEmailExtraction } from '@/api/generated/model/emailExtractionResponse'
import type { MonthlySummaryResponse as ApiMonthlySummary } from '@/api/generated/model/monthlySummaryResponse'
import type { TransactionResponse as ApiTransaction } from '@/api/generated/model/transactionResponse'

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

export interface Insight {
  id: string
  userId: string
  periodStart: string
  periodEnd: string
  content: InsightContent
  generatedAt: string
}

export interface InsightContent {
  headline: string
  summary: string
  totalSpent: string
  currency: string
  comparisonPercentage: number | null
  topCategories: InsightCategory[]
  topMerchants: InsightMerchant[]
  largestTransactions: InsightTransactionSummary[]
  unusualIncreases: InsightCategoryIncrease[]
  spendingTrend: InsightSpendingTrend
  billSplitSettlements: InsightBillSplitSettlement | null
  findings: InsightFinding[]
  recommendation: string
  recommendations: string[]
  positiveNote: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface InsightFinding {
  category: string
  changePct: number
  direction: 'up' | 'down' | 'stable'
  commentary: string
  severity: 'positive' | 'neutral' | 'warning' | 'critical'
}

export interface InsightCategory {
  categoryName: string
  amount: string
  percentage: number
}

export interface InsightMerchant {
  merchantName: string
  amount: string
}

export interface InsightTransactionSummary {
  merchantName: string
  categoryName: string
  amount: string
  occurredAt: string
}

export interface InsightCategoryIncrease {
  categoryName: string
  currentAmount: string
  previousAmount: string
  changePercentage: number
}

export interface InsightSpendingTrend {
  direction: 'UP' | 'DOWN' | 'STABLE' | 'NEW'
  currentTotal: string
  previousTotal: string
  changePercentage: number | null
}

export interface InsightBillSplitSettlement {
  billsCreated: number
  participants: number
  paidParticipants: number
  settledAmount: string
  outstandingAmount: string
}

export interface AnomalyAlert {
  id: string
  transactionId: string
  title: string
  amount: string
  currency: string
  merchantName: string
  categoryName: string
  reason: string
  explanation: string
  anomalyScore: number
  threshold: number
  features: AnomalyFeatures
  status: 'pending' | 'confirmed' | 'dismissed'
  createdAt: string
}

export interface AnomalyFeatures {
  amount: string
  currency: string
  merchantId: string | null
  merchantName: string
  categoryId: string | null
  categoryName: string
  hourOfDay: number
  dayOfWeek: number
  hourSin: number
  hourCos: number
  daySin: number
  dayCos: number
  amountDeviation: number
  merchantRarity: number
  categoryRarity: number
  timeRarity: number
  spendingVelocity: number
  gradualDrift: number
  recentSpendTotal: string
  reasonCodes: string[]
  feedbackSignature: string
}

export type StatementDirection = 'debit' | 'credit'
export type StatementRowStatus = 'pending' | 'imported' | 'skipped' | 'transaction_deleted'

export interface StatementRow {
  id: string
  sourceRowIndex: number
  occurredAt: string
  description: string
  merchantName: string
  amount: string
  currency: string
  direction: StatementDirection
  suggestedCategoryId: string | null
  suggestedCategoryName: string | null
  categorisationConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | null
  status: StatementRowStatus
  transactionOccurredAt: string | null
  transactionId: string | null
}

export interface StatementUpload {
  id: string
  fileName: string
  status: 'pending' | 'confirmed'
  createdAt: string
  confirmedAt: string | null
  rows: StatementRow[]
}

export interface StatementImportResult {
  uploadId: string
  importedCount: number
  skippedCount: number
  transactionIds: string[]
}

export interface GmailStatus {
  connected: boolean
  provider: 'mock' | 'google'
  providerEmail: string | null
  scopes: string[]
  connectedAt: string | null
}

export interface GmailSyncResult {
  discoveredCount: number
  createdCount: number
  duplicateCount: number
  ignoredCount: number
}

export type EmailExtraction = Omit<
  ApiEmailExtraction,
  'suggestedCategoryId' | 'suggestedCategoryName' | 'categorisationConfidence' | 'transactionId'
> & {
  suggestedCategoryId?: string | null
  suggestedCategoryName?: string | null
  categorisationConfidence?: 'HIGH' | 'MEDIUM' | 'LOW' | null
  transactionId?: string | null
}

export type MonthlySummary = Omit<ApiMonthlySummary, 'byCategory'> & {
  byCategory: CategorySummary[]
}

export interface CategorySummary {
  categoryId: string | null
  categoryName: string
  categoryIcon: string | null
  categoryColor: string | null
  total: string
  count: number
  percentage: string
}

export interface ReceiptLineItem {
  qty: string
  unitPrice: string
  lineTotal: string
  name: string
}

export interface ParsedReceipt {
  merchantName: string | null
  merchantCategoryHint: string | null
  date: string | null
  currency: string
  lineItems: ReceiptLineItem[]
  subtotal: string | null
  serviceCharge: string | null
  tax: string | null
  discountAmount: string | null
  total: string
  paymentMethod: string
  confidence: 'high' | 'medium' | 'low'
  fieldsNeedingReview: string[]
}

export interface ReceiptExtractionResponse {
  extractionId: string
  extractedData: ParsedReceipt
  rawOcrText: string
  confidence: 'high' | 'medium' | 'low'
  suggestedCategoryId?: string
  suggestedCategoryName?: string
  similarityScore?: number
  categorisationConfidence?: string
  categorisationMessage?: string
}

export interface BillItem {
  id: string
  name: string
  quantity: string
  unitPrice: string
  lineTotal: string
  claimantCount: number
}

export interface Bill {
  id: string
  merchantName: string | null
  shareToken: string
  subtotal: string
  taxAmount: string
  serviceCharge: string
  totalAmount: string
  allocationVersion: number
  lineAdjustment: string
  totalAdjustment: string
  unallocatedSubtotal: string
  unallocatedTax: string
  unallocatedServiceCharge: string
  unallocatedTotal: string
  currency: string
  status: 'draft' | 'active' | 'expired' | 'closed'
  expiresAt: string
  paymentQrProfile: PaymentQrProfile | null
  items: BillItem[]
  participants: BillParticipant[]
}

export interface BillParticipantItem {
  itemId: string
  itemName: string
  allocatedAmount: string
}

export interface BillParticipant {
  id: string
  displayName: string
  subtotalShare: string
  taxShare: string
  serviceChargeShare: string
  totalOwed: string
  lineAdjustmentShare: string
  totalAdjustmentShare: string
  allocationVersion: number
  isPaid: boolean
  paidAt: string | null
  paidAmount: string | null
  paidAllocationVersion: number | null
  joinedAt: string
  updatedAt: string
  selectedItems: BillParticipantItem[]
}

export interface PaymentQrProfile {
  id: string
  provider: string
  displayName: string
  qrImageUrl: string | null
  qrPayload: string | null
  isDefault: boolean
  createdAt: string
}

export interface GuestPaymentQrProfile {
  provider: string
  displayName: string
  qrImageUrl: string | null
  qrPayload: string | null
}

export interface GuestBill {
  merchantName: string | null
  status: 'draft' | 'active' | 'expired' | 'closed'
  currency: string
  subtotal: string
  taxAmount: string
  serviceCharge: string
  totalAmount: string
  allocationVersion: number
  lineAdjustment: string
  totalAdjustment: string
  unallocatedSubtotal: string
  unallocatedTax: string
  unallocatedServiceCharge: string
  unallocatedTotal: string
  expiresAt: string
  paymentQrProfile: GuestPaymentQrProfile | null
  items: BillItem[]
}

export interface GuestBillSummary {
  displayName: string
  currency: string
  subtotalShare: string
  taxShare: string
  serviceChargeShare: string
  totalOwed: string
  lineAdjustmentShare: string
  totalAdjustmentShare: string
  allocationVersion: number
  unallocatedSubtotal: string
  unallocatedTax: string
  unallocatedServiceCharge: string
  unallocatedTotal: string
  isPaid: boolean
  paidAt: string | null
  paidAmount: string | null
  paidAllocationVersion: number | null
  paymentQrProfile: GuestPaymentQrProfile | null
  selectedItems: BillParticipantItem[]
}

export type CategorisationResult = ApiCategorisationResult
