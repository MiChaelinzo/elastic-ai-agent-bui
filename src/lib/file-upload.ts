import type { CommentAttachment } from './incident-collaboration'

export interface FileUploadResult {
  success: boolean
  attachment?: CommentAttachment
  error?: string
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
  'application/zip',
  'application/x-zip-compressed',
  ...ALLOWED_IMAGE_TYPES
]

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Please upload images, PDFs, documents, or spreadsheets.`
    }
  }

  const maxSize = ALLOWED_IMAGE_TYPES.includes(file.type) ? MAX_IMAGE_SIZE : MAX_FILE_SIZE

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024)
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`
    }
  }

  return { valid: true }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊'
  if (mimeType === 'text/plain') return '📃'
  if (mimeType === 'text/csv') return '📊'
  if (mimeType === 'application/json' || mimeType.includes('xml')) return '📋'
  if (mimeType === 'application/zip' || mimeType.includes('compressed')) return '🗜️'
  return '📎'
}

export async function uploadFile(file: File): Promise<FileUploadResult> {
  const validation = validateFile(file)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    }
  }

  try {
    const dataUrl = await fileToDataUrl(file)
    
    const attachment: CommentAttachment = {
      id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: ALLOWED_IMAGE_TYPES.includes(file.type) ? 'image' : 'file',
      url: dataUrl,
      size: file.size,
      mimeType: file.type
    }

    return {
      success: true,
      attachment
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    }
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

export async function uploadMultipleFiles(files: File[]): Promise<FileUploadResult[]> {
  const results = await Promise.all(files.map(file => uploadFile(file)))
  return results
}

export function isImageAttachment(attachment: CommentAttachment): boolean {
  return attachment.type === 'image' || 
         (attachment.mimeType ? ALLOWED_IMAGE_TYPES.includes(attachment.mimeType) : false)
}

export function downloadAttachment(attachment: CommentAttachment): void {
  const link = document.createElement('a')
  link.href = attachment.url
  link.download = attachment.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function createLinkAttachment(url: string, name?: string): CommentAttachment {
  return {
    id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name || url,
    type: 'link',
    url,
    mimeType: 'text/uri-list'
  }
}
