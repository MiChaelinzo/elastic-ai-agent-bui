import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Paperclip, Image, X, Upload, FileText } from '@phosphor-icons/react'
import { uploadFile, uploadMultipleFiles, formatFileSize, getFileIcon, type FileUploadResult } from '@/lib/file-upload'
import type { CommentAttachment } from '@/lib/incident-collaboration'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FileUploadZoneProps {
  onAttachmentsChange: (attachments: CommentAttachment[]) => void
  attachments: CommentAttachment[]
  maxFiles?: number
  compact?: boolean
}

export function FileUploadZone({ 
  onAttachmentsChange, 
  attachments,
  maxFiles = 5,
  compact = false
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    if (attachments.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`, {
        description: `You can only attach ${maxFiles} files per comment`
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const results: FileUploadResult[] = []
      
      for (let i = 0; i < fileArray.length; i++) {
        const result = await uploadFile(fileArray[i])
        results.push(result)
        setUploadProgress(((i + 1) / fileArray.length) * 100)
      }

      const successful = results.filter(r => r.success && r.attachment)
      const failed = results.filter(r => !r.success)

      if (successful.length > 0) {
        const newAttachments = successful.map(r => r.attachment!).filter(Boolean)
        onAttachmentsChange([...attachments, ...newAttachments])
        
        toast.success(`${successful.length} file(s) attached`, {
          description: 'Files uploaded successfully'
        })
      }

      if (failed.length > 0) {
        failed.forEach(fail => {
          toast.error('Upload failed', {
            description: fail.error
          })
        })
      }
    } catch (error) {
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [attachments, maxFiles, onAttachmentsChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    if (e.target) {
      e.target.value = ''
    }
  }, [handleFiles])

  const removeAttachment = useCallback((attachmentId: string) => {
    onAttachmentsChange(attachments.filter(a => a.id !== attachmentId))
    toast.success('Attachment removed')
  }, [attachments, onAttachmentsChange])

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          accept="*/*"
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          accept="image/*"
        />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploading || attachments.length >= maxFiles}
        >
          <Image size={18} weight="duotone" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || attachments.length >= maxFiles}
        >
          <Paperclip size={18} weight="duotone" />
        </Button>

        {attachments.length > 0 && (
          <Badge variant="secondary">
            {attachments.length} file{attachments.length !== 1 ? 's' : ''}
          </Badge>
        )}

        {isUploading && (
          <div className="flex-1 min-w-[100px]">
            <Progress value={uploadProgress} className="h-1" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:bg-muted/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          accept="*/*"
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          accept="image/*"
        />

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <Upload size={24} weight="duotone" className="text-primary" />
          </div>
          
          <div>
            <p className="text-sm font-medium">
              {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Images, PDFs, documents, spreadsheets (max {maxFiles} files)
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading || attachments.length >= maxFiles}
            >
              <Image size={16} className="mr-2" weight="duotone" />
              Add Images
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || attachments.length >= maxFiles}
            >
              <FileText size={16} className="mr-2" weight="duotone" />
              Add Files
            </Button>
          </div>
        </div>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uploading files...</span>
            <span className="font-mono font-semibold">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Attached Files ({attachments.length}/{maxFiles})
          </p>
          <div className="grid gap-2">
            {attachments.map(attachment => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg group"
              >
                <div className="text-2xl">
                  {getFileIcon(attachment.mimeType || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.name}
                  </p>
                  {attachment.size && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(attachment.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} weight="bold" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
