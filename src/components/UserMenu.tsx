import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User as UserIcon, SignOut, Gear } from '@phosphor-icons/react'
import type { User } from '@/lib/auth-types'
import { Badge } from '@/components/ui/badge'

interface UserMenuProps {
  user: User | null
  onSettings?: () => void
  onLogout?: () => void
}

export function UserMenu({ user, onSettings, onLogout }: UserMenuProps) {
  if (!user) return null

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

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

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <Badge variant={getRoleBadgeVariant(user.role)} className="w-fit">
              {getRoleLabel(user.role)}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onSettings && (
          <DropdownMenuItem onClick={onSettings}>
            <Gear className="mr-2 h-4 w-4" weight="duotone" />
            <span>Settings</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {onLogout && (
          <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
            <SignOut className="mr-2 h-4 w-4" weight="duotone" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
