# Quick Start Guide - New User Flow

## Getting Started

When you first open the Elastic Agent Orchestrator, you'll experience a streamlined onboarding process.

### Step 1: Login Screen

**First Impression:**
- Clean, modern design with animated logo
- Two options: Sign In or Continue as Guest

**Sign In:**
- Enter your name (e.g., "John Doe")
- Enter your email (e.g., "john@company.com")
- Enter password (for demo purposes)
- Click "Sign In"

**Continue as Guest:**
- Instant access without credentials
- Full platform functionality
- Limited profile features

### Step 2: Welcome Screen

**Beautiful Introduction:**
- Large animated lightning bolt icon
- Platform title and description
- Four feature cards showcasing key capabilities:
  - Multi-Agent AI System
  - Predictive Analytics
  - Automated Resolution
  - Real-Time Collaboration

**Two Mode Options:**

**🎮 Demo Mode Card (Left)**
- Play icon and "Demo Mode" title
- Description: "Explore with sample data and simulated incidents"
- Features:
  ✓ Pre-loaded sample incidents
  ✓ Full access to all features
  ✓ No configuration required
  ✓ Perfect for learning
- Blue "Start Demo" button
- Hover effect: Card scales and glows

**🔌 API Mode Card (Right)**
- Database icon and "Connect Your Data" title
- Description: "Integrate with your Elasticsearch cluster"
- Features:
  ✓ Connect to Elasticsearch deployment
  ✓ Work with real production data
  ✓ Configure integrations (Slack, email)
  ✓ Full control over data
- Green "Configure API" button
- Hover effect: Card scales and glows

### Step 3A: Demo Mode (Quick Path)

**What Happens:**
1. Click "Start Demo"
2. Welcome screen fades out
3. Sample data automatically loads:
   - 10+ historical incidents
   - Various severities (low, medium, high, critical)
   - Different statuses (new, in-progress, resolved, failed)
   - Predictive analytics data
4. Main application appears
5. Header shows "Demo Mode" badge
6. Ready to explore!

**Time to Platform: ~5 seconds**

### Step 3B: API Mode (Production Path)

**What Happens:**
1. Click "Configure API"
2. API Configuration Dialog opens

**Configuration Dialog - Three Tabs:**

**Tab 1: Elasticsearch**
- Enter Elasticsearch URL
  - Example: `https://your-cluster.es.io:9200`
  - Must include protocol (http/https) and port
- Enter API Key
  - Generated from your Elasticsearch deployment
  - Stored encrypted locally
- Click "Test Connection"
  - Real-time validation
  - Success: Green checkmark appears
  - Failure: Red warning with details
- Requirements marked with asterisk (*)

**Tab 2: Notifications**
- Slack Integration (Optional)
  - Enter Webhook URL
  - Example: `https://hooks.slack.com/services/...`
  - Info: "Create an incoming webhook in your Slack workspace settings"
- Email Integration (Optional)
  - Toggle to enable
  - Enter SMTP Host (e.g., smtp.gmail.com)
  - Enter SMTP Port (e.g., 587)
  - Enter From Email (e.g., alerts@company.com)
  - Enter SMTP API Key/Password
  - All fields validated

**Tab 3: Advanced**
- Security information
- Data handling policies
- Privacy reassurances:
  ✓ API keys encrypted and stored securely
  ✓ No third-party transmission
  ✓ Direct connections only
  ✓ Clear data anytime

**Completing Setup:**
1. Fill required fields (Elasticsearch)
2. Optionally configure Slack/Email
3. Click "Save Configuration"
4. Dialog closes
5. Platform loads with your production data
6. Header shows "API Mode" badge

**Time to Platform: ~2-3 minutes**

### Step 4: Using the Platform

**Header Indicators:**
- Mode badge always visible next to title
- Demo Mode: Gray badge with play icon
- API Mode: Blue badge with database icon
- Click badge for quick info

**Main Features Available:**
- Multi-agent incident analysis
- Workflow templates
- Real-time metrics dashboard
- Predictive analytics
- Anomaly detection
- Priority queue management
- SLA tracking
- Knowledge base
- Team collaboration
- Voice commands
- And 20+ more features!

### Step 5: Switching Modes Later

**From Settings:**
1. Click "Settings" button in header
2. Navigate to "Data Source" tab (first tab)
3. View current mode with status cards
4. See current configuration details

**Demo Mode Card:**
- Shows if currently active (highlighted)
- Features list
- "Switch to Demo" button (if in API mode)

**API Mode Card:**
- Shows if currently active (highlighted)
- Connection status (Connected / Not Configured)
- Lists active integrations (Slack, Email)
- "Configure API" or "Update Configuration" button

**Switching:**
- Click button on desired mode card
- Instant switch (demo mode) or config dialog (API mode)
- Data persists across mode switches
- No need to re-authenticate

## Tips for New Users

### Evaluating the Platform (Demo Mode)
1. Start with Demo Mode
2. Explore all features risk-free
3. Create test incidents
4. Run agent analysis
5. Review predictive insights
6. Check out collaboration features
7. Try voice commands
8. When ready, switch to API Mode

### Production Deployment (API Mode)
1. Have your Elasticsearch credentials ready
2. Optionally prepare Slack webhook URL
3. Optionally prepare SMTP credentials
4. Click "Configure API" from welcome screen
5. Test connection before saving
6. Start with read-only access initially
7. Gradually enable write operations
8. Monitor integration health from Settings

### Getting Help
- Voice commands: Click "Voice Help" button
- Feature documentation: See README_FEATURES.md
- Integration setup: See INTEGRATION_GUIDE.md
- Security questions: See SECURITY.md
- Authentication issues: See AUTHENTICATION_GUIDE.md

## Common Questions

**Q: Can I switch between modes without losing data?**
A: Yes! Your incidents, settings, and configurations persist across mode switches.

**Q: Is my API key secure?**
A: Yes. All credentials are encrypted and stored only in your browser's local storage. They never leave your machine except to connect directly to your configured services.

**Q: What's the difference between signing in and guest mode?**
A: Both provide full platform access. Signing in gives you a personalized profile and better audit trail. Guest mode is perfect for quick evaluation.

**Q: Can I use both modes simultaneously?**
A: No, you can only use one mode at a time, but switching is instant and data persists.

**Q: Do I need to configure all integrations?**
A: No! Only Elasticsearch URL and API key are required for API mode. Slack and Email are completely optional.

**Q: Can I test the API configuration before committing?**
A: Yes! Click "Test Connection" to validate your Elasticsearch credentials before saving.

**Q: What happens if my API connection fails?**
A: The platform will show error messages and you can switch back to Demo mode at any time from Settings.

**Q: Is this a real backend system?**
A: No, this is a demonstration platform running entirely in your browser. All data is stored locally using the Spark KV store.

## Next Steps

After onboarding:
1. Create your first incident
2. Watch agents analyze it
3. Explore the knowledge base
4. Check SLA dashboard
5. Review team collaboration features
6. Set up voice commands
7. Configure your preferences in Settings
8. Invite team members (future feature)

---

**Ready to get started?** Open the application and choose your path: Demo for exploration or API for production! 🚀
