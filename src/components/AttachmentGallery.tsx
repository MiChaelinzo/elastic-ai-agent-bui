import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { 
  Image as ImageIcon, 
  File as FileIcon, 
  MagnifyingGlass,
  DownloadSimple,
  Calendar
} from '@phosphor-icons/react'
import type { Comment } from '@/lib/incident-collaboration'
import { AttachmentDisplay } from '@/components/AttachmentDisplay'
import { formatFileSize, isImageAttachment } from '@/lib/file-upload'
import { formatCommentTime } from '@/lib/incident-collaboration'

interface AttachmentGalleryProps {
  comments: Comment[]
  isOpen: boolean
  onClose: () => void
}

export function AttachmentGallery({ comments, isOpen, onClose }: AttachmentGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState<'all' | 'images' | 'files'>('all')

  const allAttachments = comments
    .filter(c => c.attachments && c.attachments.length > 0)
    .flatMap(comment => 
      (comment.attachments || []).map(attachment => ({
        attachment,
        comment
      }))
    )

  const imageAttachments = allAttachments.filter(({ attachment }) => isImageAttachment(attachment))
  const fileAttachments = allAttachments.filter(({ attachment }) => !isImageAttachment(attachment))

  const filteredAttachments = allAttachments.filter(({ attachment }) => {
    const matchesSearch = attachment.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = 
      selectedTab === 'all' ||
      (selectedTab === 'images' && isImageAttachment(attachment)) ||
      (selectedTab === 'files' && !isImageAttachment(attachment))
    return matchesSearch && matchesTab
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon size={24} weight="duotone" className="text-primary" />
              <span>Incident Attachments</span>
              <Badge variant="secondary">{allAttachments.length} total</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass 
                size={18} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
              />
              <Input
                placeholder="Search attachments by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({allAttachments.length})
              </TabsTrigger>
              <TabsTrigger value="images">
                <ImageIcon size={16} className="mr-2" weight="duotone" />
                Images ({imageAttachments.length})
              </TabsTrigger>
              <TabsTrigger value="files">
                <FileIcon size={16} className="mr-2" weight="duotone" />
                Files ({fileAttachments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-[500px] pr-4">
                {filteredAttachments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon size={48} className="mx-auto mb-3 opacity-50" weight="duotone" />
                    <p>No attachments found</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredAttachments.map(({ attachment, comment }) => (
                      <div key={`${comment.id}-${attachment.id}`} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium">{comment.userName}</span>
                          <span>•</span>
                          <Calendar size={14} />
                          <span>{formatCommentTime(comment.timestamp)}</span>
                        </div>
                        <AttachmentDisplay attachments={[attachment]} />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="images" className="mt-4">
              <ScrollArea className="h-[500px] pr-4">
                {imageAttachments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon size={48} className="mx-auto mb-3 opacity-50" weight="duotone" />
                    <p>No images found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {imageAttachments
                      .filter(({ attachment }) => 
                        attachment.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(({ attachment, comment }) => (
                        <div key={`${comment.id}-${attachment.id}`} className="space-y-2">
                          <AttachmentDisplay attachments={[attachment]} />
                          <div className="text-xs text-muted-foreground">
                            <p className="font-medium truncate">{comment.userName}</p>
                            <p>{formatCommentTime(comment.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <ScrollArea className="h-[500px] pr-4">
                {fileAttachments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileIcon size={48} className="mx-auto mb-3 opacity-50" weight="duotone" />
                    <p>No files found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fileAttachments
                      .filter(({ attachment }) => 
                        attachment.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(({ attachment, comment }) => (
                        <div 
                          key={`${comment.id}-${attachment.id}`}
                          className="space-y-2"
                        >
                          <AttachmentDisplay attachments={[attachment]} />
                          <div className="text-xs text-muted-foreground ml-12">
                            <p>
                              <span className="font-medium">{comment.userName}</span>
                              {' • '}
                              {formatCommentTime(comment.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
