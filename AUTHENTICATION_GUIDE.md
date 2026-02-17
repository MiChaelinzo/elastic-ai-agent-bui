# Authentication & API Integration Guide

This document explains the new authentication flow and API integration capabilities added to the Elastic Agent Orchestrator platform.

## Overview

The platform now features a comprehensive onboarding experience with two deployment modes:

1. **Demo Mode** - Instant access with sample data for evaluation and learning
2. **API Mode** - Connect to your production Elasticsearch cluster and integrations

## User Flow

### First-Time Launch

When users first open the application, they encounter:

1. **Login Screen**
   - Sign in with email and name
   - Or continue as guest
   - Credentials are stored locally only (no backend required)

2. **Welcome Screen**
   - Beautiful, animated introduction to the platform
   - Two mode options presented as cards:
     - **Demo Mode**: Pre-loaded data, no configuration needed
     - **API Mode**: Connect your Elasticsearch deployment

3. **Mode Selection**
   - **Demo Mode**: Instantly loads sample incidents and begins demo
   - **API Mode**: Opens API configuration dialog

### API Configuration Dialog

The API configuration dialog provides comprehensive setup for production deployment:

#### Elasticsearch Tab
- **URL**: Your Elasticsearch cluster endpoint (e.g., `https://your-cluster.es.io:9200`)
- **API Key**: Authentication credentials for your cluster
- **Test Connection**: Validates connectivity before saving
- Real-time connection status feedback

#### Notifications Tab
- **Slack Integration**
  - Webhook URL for incident alerts
  - Sends formatted notifications to your team's channel
  
- **Email Integration**
  - SMTP host and port configuration
  - From email address
  - API key/password for authentication
  - Toggle to enable/disable email notifications

#### Advanced Tab
- Security information and data handling policies
- Reassurance about local storage and encryption
- Privacy and compliance details

### Settings Integration

Once onboarded, users can access mode switching from Settings:

1. Navigate to **Settings** → **Data Source** tab
2. View current mode with visual indicators
3. Switch between Demo and API modes
4. Update API configuration at any time
5. Clear configuration to return to demo mode

## Visual Indicators

### Header Badge
The application header displays a badge showing the current mode:
- 🎮 **Demo Mode** - Secondary badge with play icon
- 🔌 **API Mode** - Primary badge with database icon

### Settings Display
The Data Source tab in Settings shows:
- Current mode with highlighting
- API connection status (if in API mode)
- Connected services (Slack, Email, etc.)
- Quick action buttons to switch modes or update configuration

## Data Persistence

All authentication and configuration data is stored locally using the Spark KV store:

- `auth-state`: User authentication status, selected mode, onboarding completion
- `api-config`: Elasticsearch credentials and integration settings (encrypted)
- User session persists across page refreshes
- No server-side authentication required

## Security Features

### Credential Storage
- API keys encrypted before local storage
- Credentials never transmitted to third parties
- Direct connection to your Elasticsearch cluster only
- Clear configuration option to remove all stored credentials

### Guest Mode
- Continue without signing in
- Limited profile features
- Full access to platform functionality
- Can upgrade to full account later

## Implementation Details

### Key Components

1. **LoginScreen.tsx**
   - Modern authentication interface
   - Email/password form with validation
   - Guest access option
   - Smooth animations and transitions

2. **WelcomeScreen.tsx**
   - Onboarding experience
   - Feature highlights
   - Mode selection cards
   - Engaging animations and gradients

3. **APIConfigurationDialog.tsx**
   - Multi-tab configuration interface
   - Real-time connection testing
   - Validation and error handling
   - Integration setup for Slack and Email

4. **ModeSwitcher.tsx**
   - Settings component for mode management
   - Visual status indicators
   - Quick actions for mode switching
   - Configuration shortcuts

### State Management

```typescript
// Authentication state
interface AuthState {
  isAuthenticated: boolean
  user: User | null
  mode: 'demo' | 'api'
  hasCompletedOnboarding: boolean
}

// API configuration
interface APIConfig {
  elasticsearchUrl: string
  elasticsearchApiKey: string
  slackWebhookUrl?: string
  emailConfig?: {
    smtpHost: string
    smtpPort: number
    fromEmail: string
    apiKey: string
  }
}
```

### Flow Control

The main App component handles three states:

1. **Not Authenticated**: Show LoginScreen
2. **Authenticated but Not Onboarded**: Show WelcomeScreen
3. **Fully Onboarded**: Show main application

This ensures users can't access the platform without completing onboarding.

## Usage Examples

### Quick Start (Demo Mode)
```
1. Open application
2. Click "Continue as Guest" (or sign in)
3. Click "Start Demo" on welcome screen
4. Sample data loads automatically
5. Begin exploring features
```

### Production Setup (API Mode)
```
1. Open application
2. Sign in with your credentials
3. Click "Configure API" on welcome screen
4. Enter Elasticsearch URL and API key
5. Click "Test Connection"
6. Optionally configure Slack/Email
7. Click "Save Configuration"
8. Application connects to your production data
```

### Mode Switching
```
1. Click "Settings" in header
2. Navigate to "Data Source" tab
3. View current mode and configuration
4. Click "Switch to Demo" or "Configure API"
5. Confirm mode change
6. Application updates data source
```

## Future Enhancements

Potential improvements for the authentication and API system:

- **OAuth/SSO Integration**: Enterprise single sign-on
- **User Profile Management**: Avatar upload, role settings, preferences
- **Multi-Environment Support**: Switch between dev/staging/prod clusters
- **Advanced Security**: 2FA, biometric authentication, session management
- **Onboarding Tour**: Interactive guide for new users
- **API Health Monitoring**: Real-time status of connected services
- **Credential Rotation**: Automated API key refresh and rotation
- **Team Management**: Invite users, share configurations, role-based access

## Troubleshooting

### Connection Test Fails
- Verify Elasticsearch URL includes protocol (https://) and port
- Check API key has required permissions
- Ensure firewall allows outbound connections
- Test connectivity from browser console

### Slack Notifications Not Working
- Verify webhook URL is correct and active
- Check Slack app permissions
- Test webhook with curl or Postman first
- Review notification settings in Settings tab

### Mode Switch Issues
- Clear browser cache and reload
- Check browser console for errors
- Verify KV store is accessible
- Try clearing all data and re-onboarding

## Support

For issues with authentication or API integration:
1. Check browser console for detailed error messages
2. Verify all required configuration fields are filled
3. Test individual integrations (Elasticsearch, Slack, Email) separately
4. Review the Security & Compliance dashboard for audit logs
5. Contact your system administrator for enterprise support
