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
  anomalyScore: number
  threshold: number
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

export interface LineItem {
  name: string
  qty: number
  unitPrice: number
}

export interface ExtractedReceiptData {
  merchantName: string | null
  merchantCategoryHint: string | null
  date: string | null
  currency: string
  lineItems: LineItem[]
  subtotal: number | null
  tax: number | null
  total: number
  paymentMethod: string
  confidence: 'high' | 'medium' | 'low'
}

export interface ReceiptExtractionResponse {
  extractionId: string
  extractedData: ExtractedReceiptData
  rawOcrText: string
  confidence: 'high' | 'medium' | 'low'
}
