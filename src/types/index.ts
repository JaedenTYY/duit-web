export interface User {
  id: string
  email: string
  fullName: string
  preferredCurrency: string
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  amount: string
  currency: string
  amountMyr: string
  fxRate: string
  merchantId: string | null
  merchantName: string | null
  categoryId: string | null
  categoryName: string | null
  categoryIcon: string | null
  categoryColor: string | null
  description: string | null
  source: 'receipt' | 'manual' | 'import'
  occurredAt: string
  createdAt: string
  suggestedCategoryId?: string
  suggestedCategoryName?: string
  similarityScore?: number
  categorisationConfidence?: string
  categorisationMessage?: string
}

export interface Merchant {
  id: string
  name: string
  canonical: string
  categoryId: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
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
  comparisonPercentage: number
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
  changePercentage: number
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
export type StatementRowStatus = 'pending' | 'imported' | 'skipped'

export interface StatementRow {
  id: string
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

export interface EmailExtraction {
  id: string
  sender: string
  subject: string
  receivedAt: string
  merchantName: string
  amount: string
  currency: string
  occurredAt: string
  suggestedCategoryId: string | null
  suggestedCategoryName: string | null
  categorisationConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | null
  status: 'pending' | 'confirmed' | 'skipped'
  transactionId: string | null
  createdAt: string
}

export interface MonthlySummary {
  totalSpend: string
  currency: string
  transactionCount: number
  byCategory: CategorySummary[]
}

export interface CategorySummary {
  categoryId: string | null
  categoryName: string
  categoryIcon: string | null
  categoryColor: string | null
  total: string
  count: number
  percentage: number
}

export interface ReceiptLineItem {
  qty: number
  code: string | null
  description: string
  unitPrice: number
  lineTotal: number
  category: string | null
}

export interface ParsedReceipt {
  merchant: string
  branch: string | null
  brn: string | null
  sstNo: string | null
  date: string | null
  receiptRef: string | null
  lineItems: ReceiptLineItem[]
  discount: number | null
  subtotal: number | null
  serviceCharge: number | null
  sst: number | null
  rounding: number | null
  total: number
  paymentMethod: string | null
  currency: string
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
}

export interface Bill {
  id: string
  merchantName: string | null
  shareToken: string
  subtotal: string
  taxAmount: string
  serviceCharge: string
  totalAmount: string
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
  isPaid: boolean
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
  isPaid: boolean
  paymentQrProfile: GuestPaymentQrProfile | null
  selectedItems: BillParticipantItem[]
}

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface CategorisationResult {
  merchantId: string | null
  merchantName: string
  categoryId: string | null
  similarityScore: number
  confidence: ConfidenceLevel
}
