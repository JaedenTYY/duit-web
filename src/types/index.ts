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
  findings: InsightFinding[]
  recommendation: string
  positiveNote: string
}

export interface InsightFinding {
  category: string
  changePct: number
  direction: 'up' | 'down' | 'stable'
  commentary: string
  severity: 'positive' | 'neutral' | 'warning' | 'critical'
}

export interface AnomalyAlert {
  id: string
  transactionId: string
  reason: string
  status: 'pending' | 'confirmed' | 'dismissed'
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
}

export interface BillItem {
  id: string
  billId: string
  name: string
  quantity: string
  unitPrice: string
  lineTotal: string
  createdAt: string
}

export interface Bill {
  id: string
  ownerUserId: string
  merchantName: string | null
  totalAmount: string
  currency: string
  status: 'draft'
  createdAt: string
  updatedAt: string
  items: BillItem[]
}
