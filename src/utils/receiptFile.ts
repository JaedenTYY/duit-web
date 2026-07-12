const MAX_RECEIPT_IMAGE_BYTES = 10 * 1024 * 1024
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const SUPPORTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

export const RECEIPT_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'

export function validateReceiptImageFile(file: File): string | null {
  if (file.size <= 0) {
    return 'This receipt image is empty. Choose a different photo.'
  }

  if (file.size > MAX_RECEIPT_IMAGE_BYTES) {
    return 'Receipt image is too large. Use a JPEG, PNG, or WebP image under 10 MB.'
  }

  const contentType = file.type.toLowerCase()
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (!SUPPORTED_IMAGE_TYPES.has(contentType) && !SUPPORTED_EXTENSIONS.has(extension)) {
    return 'Use a JPEG, PNG, or WebP receipt image. HEIC and PDF files are not supported for receipt OCR.'
  }

  return null
}

export function normalizeReceiptUploadError(message: string): string {
  if (/bad image data/i.test(message)) {
    return 'Google Vision could not read this image. Retake the receipt photo or export it as JPEG, PNG, or WebP before uploading.'
  }

  return message
}
