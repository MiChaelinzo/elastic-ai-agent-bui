# Authentication System Guide

## Overview

The Elastic Agent Orchestrator now includes a complete authentication system with login/logout functionality, user registration, profile management, and secure password handling.

## Key Features

### 1. **Login Screen**
- Beautiful animated login interface
- Email & password authentication
- User registration
- Demo mode access (no login required)
- Password visibility toggle

### 2. **User Management**
- Secure password hashing using SHA-256
- Three user roles: Admin, Operator, Viewer
- Session persistence
- Profile management

### 3. **Profile Management**
- Update name and profile information
- Change password securely
- View account details and creation date
- Role-based access display

### 4. **Logout Functionality**
- Secure session termination
- Clear user data
- Return to login screen

## Demo Accounts

Pre-configured demo accounts with password: `password`

```
Admin Account:
Email: admin@elastic.local
Password: password
Role: Admin (Full system access)

Operator Account:
Email: operator@elastic.local
Password: password
Role: Operator (Incident management)

Viewer Account:
Email: viewer@elastic.local
Password: password
Role: Viewer (Read-only access)
```

## Usage

### Logging In

1. Open the application - you'll see the login screen
2. Enter your email and password
3. Click "Sign In"
4. Or click "Continue with Demo Mode" for instant access

### Registering a New Account

1. Click "Don't have an account? Sign up" on the login screen
2. Enter your full name, email, and password (minimum 6 characters)
3. Click "Create Account"
4. The first user registered automatically gets Admin role

### Managing Your Profile

1. Once logged in, click your avatar in the top-right corner
2. Select "My Profile" from the dropdown menu
3. In the profile dialog:
   - **Profile tab**: Update your name
   - **Security tab**: Change your password
   - **Info tab**: View account information and role details

### Logging Out

1. Click your avatar in the top-right corner
2. Select "Log Out" from the dropdown menu
3. You'll be securely logged out and returned to the login screen

## Technical Details

### Authentication Flow

1. **Login**: User credentials are hashed and compared with stored hashed passwords
2. **Session**: Authenticated sessions are stored using Spark KV storage
3. **Persistence**: Sessions persist across page refreshes until logout
4. **Security**: Passwords are never stored in plain text

### Password Security

- All passwords are hashed using SHA-256
- Passwords must be at least 6 characters
- Hash comparison for authentication
- Separate password change flow with current password verification

### Demo Mode

Demo mode provides instant access with a temporary guest user account:
- No login required
- Access to all features
- Sample data automatically loaded
- Can switch to authenticated mode anytime

## Architecture

### Components

- **LoginScreen**: Main authentication interface
- **UserProfileDialog**: Profile management interface
- **UserMenu**: User account dropdown menu

### Services

- **auth-service.ts**: Core authentication logic
  - `registerUser()`: Create new user accounts
  - `loginUser()`: Authenticate existing users
  - `logoutUser()`: Clear user session
  - `getCurrentSession()`: Check active session
  - `updateUserProfile()`: Modify user details
  - `changePassword()`: Update user password

### Storage

User data is stored securely using Spark's KV storage:
- `app-users`: User accounts with hashed passwords
- `current-session`: Active user session
- `auth-state`: Application authentication state

## Best Practices

1. **First Time Setup**: Register an account or use demo mode
2. **Password Security**: Use strong passwords (6+ characters recommended)
3. **Profile Updates**: Keep your profile information current
4. **Regular Logout**: Always log out when done, especially on shared computers

## Keyboard Shortcuts

None specifically for authentication, but the application supports:
- `Ctrl/Cmd + Shift + R`: Reset to login screen (logout)

## Future Enhancements

The authentication system is designed to be extended with:
- Two-factor authentication (2FA)
- Password recovery via email
- Social login (GitHub, Google, etc.)
- Role-based feature access control
- Session timeout management
- User activity logging

## Troubleshooting

### Can't Log In
- Verify email and password are correct
- Check caps lock is off
- Try demo mode to access the application
- Register a new account if you don't have one

### Forgot Password
- Currently, passwords cannot be recovered
- Register a new account with a different email
- Or use demo mode for temporary access

### Session Issues
- Clear browser data if sessions aren't persisting
- Try logging out and back in
- Use Ctrl/Cmd + Shift + R to force reset

## Demo Mode vs. Authenticated Mode

| Feature | Demo Mode | Authenticated Mode |
|---------|-----------|-------------------|
| Access Speed | Instant | Requires login |
| Persistence | Temporary | Permanent |
| Profile Management | Limited | Full |
| User Identification | Guest | Real user account |
| Recommended For | Quick testing, trials | Production use |
