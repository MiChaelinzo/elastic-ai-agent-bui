import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DownloadSimple, 
  X, 
  MagnifyingGlassPlus, 
  File,
  Image as ImageIcon
} from '@phosphor-icons/react'
import type { CommentAttachment } from '@/lib/incident-collaboration'
import { formatFileSize, getFileIcon, isImageAttachment, downloadAttachment } from '@/lib/file-upload'
import { cn } from '@/lib/utils'

interface AttachmentDisplayProps {
  attachments: CommentAttachment[]
  compact?: boolean
  maxPreview?: number
}

export function AttachmentDisplay({ 
  attachments, 
  compact = false,
  maxPreview = 3
}: AttachmentDisplayProps) {
  const [selectedImage, setSelectedImage] = useState<CommentAttachment | null>(null)

  if (attachments.length === 0) return null

  const images = attachments.filter(isImageAttachment)
  const files = attachments.filter(a => !isImageAttachment(a))
  const visibleImages = compact ? images.slice(0, maxPreview) : images
  const remainingImages = images.length - visibleImages.length

  return (
    <>
      <div className="space-y-3 mt-3">
        {images.length > 0 && (
          <div>
            <div className={cn(
              "grid gap-2",
              compact
                ? images.length === 1 ? "grid-cols-1" : "grid-cols-3"
                : images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"
            )}>
              {visibleImages.map(attachment => (
                <div
                  key={attachment.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden border border-border bg-muted aspect-video"
                  onClick={() => setSelectedImage(attachment)}
                >
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImage(attachment)
                      }}
                    >
                      <MagnifyingGlassPlus size={16} weight="bold" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadAttachment(attachment)
                      }}
                    >
                      <DownloadSimple size={16} weight="bold" />
                    </Button>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="absolute bottom-2 left-2 text-xs"
                  >
                    <ImageIcon size={12} className="mr-1" weight="duotone" />
                    {attachment.size ? formatFileSize(attachment.size) : 'Image'}
                  </Badge>
                </div>
              ))}
              
              {remainingImages > 0 && (
                <div className="relative rounded-lg overflow-hidden border border-border bg-muted aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold">+{remainingImages}</p>
                    <p className="text-xs text-muted-foreground">more</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map(attachment => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border group hover:bg-muted transition-colors"
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
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadAttachment(attachment)}
                  className="opacity-70 group-hover:opacity-100"
                >
                  <DownloadSimple size={16} weight="bold" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span className="truncate flex-1">{selectedImage.name}</span>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAttachment(selectedImage)}
                    >
                      <DownloadSimple size={16} className="mr-2" weight="bold" />
                      Download
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="relative">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
                {selectedImage.size && (
                  <Badge variant="secondary" className="absolute bottom-4 right-4">
                    {formatFileSize(selectedImage.size)}
                  </Badge>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
