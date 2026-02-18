import type { User } from './auth-types'

export interface StoredUser extends User {
  passwordHash: string
}

const USERS_KEY = 'app-users'
const CURRENT_SESSION_KEY = 'current-session'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function registerUser(
  email: string, 
  password: string, 
  name: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const users = await getStoredUsers()
    
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existingUser) {
      return { success: false, error: 'Email already registered' }
    }

    const passwordHash = await hashPassword(password)
    
    const newUser: StoredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      name,
      role: users.length === 0 ? 'admin' : 'operator',
      createdAt: Date.now(),
      passwordHash
    }

    users.push(newUser)
    await window.spark.kv.set(USERS_KEY, users)

    const { passwordHash: _, ...userWithoutPassword } = newUser
    return { success: true, user: userWithoutPassword }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed' }
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const users = await getStoredUsers()
    const passwordHash = await hashPassword(password)
    
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === passwordHash
    )

    if (!user) {
      return { success: false, error: 'Invalid email or password' }
    }

    const { passwordHash: _, ...userWithoutPassword } = user
    await window.spark.kv.set(CURRENT_SESSION_KEY, userWithoutPassword)
    
    return { success: true, user: userWithoutPassword }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed' }
  }
}

export async function logoutUser(): Promise<void> {
  await window.spark.kv.delete(CURRENT_SESSION_KEY)
}

export async function getCurrentSession(): Promise<User | null> {
  try {
    const session = await window.spark.kv.get<User>(CURRENT_SESSION_KEY)
    return session || null
  } catch {
    return null
  }
}

async function getStoredUsers(): Promise<StoredUser[]> {
  try {
    const users = await window.spark.kv.get<StoredUser[]>(USERS_KEY)
    return users || []
  } catch {
    return []
  }
}

export async function getAllUsers(): Promise<User[]> {
  const users = await getStoredUsers()
  return users.map(({ passwordHash: _, ...user }) => user)
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const users = await getStoredUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' }
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updates
    }

    await window.spark.kv.set(USERS_KEY, users)
    
    const currentSession = await getCurrentSession()
    if (currentSession && currentSession.id === userId) {
      const { passwordHash: _, ...updatedUser } = users[userIndex]
      await window.spark.kv.set(CURRENT_SESSION_KEY, updatedUser)
    }

    return { success: true }
  } catch (error) {
    console.error('Update profile error:', error)
    return { success: false, error: 'Failed to update profile' }
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const users = await getStoredUsers()
    const currentPasswordHash = await hashPassword(currentPassword)
    const user = users.find(u => u.id === userId && u.passwordHash === currentPasswordHash)
    
    if (!user) {
      return { success: false, error: 'Current password is incorrect' }
    }

    const newPasswordHash = await hashPassword(newPassword)
    const userIndex = users.findIndex(u => u.id === userId)
    users[userIndex].passwordHash = newPasswordHash

    await window.spark.kv.set(USERS_KEY, users)
    return { success: true }
  } catch (error) {
    console.error('Change password error:', error)
    return { success: false, error: 'Failed to change password' }
  }
}
