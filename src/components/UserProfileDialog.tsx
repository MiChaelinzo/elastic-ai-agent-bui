import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserCircle, Lock, Info } from '@phosphor-icons/react'
import type { User } from '@/lib/auth-types'
import { updateUserProfile, changePassword } from '@/lib/auth-service'
import { toast } from 'sonner'

interface UserProfileDialogProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onProfileUpdate: (user: User) => void
}

export function UserProfileDialog({ user, isOpen, onClose, onProfileUpdate }: UserProfileDialogProps) {
  const [name, setName] = useState(user?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSaveProfile = async () => {
    setError('')
    setIsLoading(true)

    try {
      const result = await updateUserProfile(user.id, { name })
      if (result.success) {
        onProfileUpdate({ ...user, name })
        toast.success('Profile updated successfully')
      } else {
        setError(result.error || 'Failed to update profile')
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required')
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const result = await changePassword(user.id, currentPassword, newPassword)
      if (result.success) {
        toast.success('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(result.error || 'Failed to change password')
        toast.error(result.error || 'Failed to change password')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'operator':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle size={24} weight="duotone" className="text-primary" />
            My Profile
          </DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {getRoleLabel(user.role)}
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <UserCircle size={16} className="mr-2" weight="duotone" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock size={16} className="mr-2" weight="duotone" />
              Security
            </TabsTrigger>
            <TabsTrigger value="info">
              <Info size={16} className="mr-2" weight="duotone" />
              Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSaveProfile} 
                disabled={isLoading || name === user.name}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Enter new password"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleChangePassword} 
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <p className="text-sm font-mono mt-1">{user.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="text-sm mt-1">{getRoleLabel(user.role)}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Account Created</Label>
                <p className="text-sm mt-1">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <Alert>
                <Info size={20} />
                <AlertDescription>
                  <strong>About Roles:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li><strong>Admin:</strong> Full system access and configuration</li>
                    <li><strong>Operator:</strong> Incident management and workflow execution</li>
                    <li><strong>Viewer:</strong> Read-only access to incidents and reports</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
