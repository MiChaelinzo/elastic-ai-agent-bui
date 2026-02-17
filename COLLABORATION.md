# Team Collaboration Features

## Overview
The Elastic Agent Orchestrator now includes comprehensive real-time team collaboration features that enable seamless communication and coordination around incident response.

## Key Features

### 💬 **Comments & Threads**
- **Rich Text Comments**: Add detailed comments to any incident
- **Reply Threads**: Create nested conversations with reply functionality
- **Edit & Delete**: Full control over your comments with edit and delete capabilities
- **Real-time Updates**: See comments as they're posted by team members

### @ **Mentions**
- **@mention Team Members**: Tag colleagues using @username syntax
- **Auto-complete**: Smart suggestions when typing @
- **Mention Notifications**: Get notified when you're mentioned
- **Unread Badge**: See at a glance how many mentions you have

### 👍 **Reactions**
- **Quick Reactions**: Express agreement, approval, or concern with emoji reactions
- **8 Reaction Types**: 👍 👎 ❤️ 🎉 🚀 👀 ⚠️ ✅
- **Reaction Summary**: See who reacted and with what
- **Toggle Reactions**: Click again to remove your reaction

### 🔒 **Public & Internal Comments**
- **Internal Comments**: Mark sensitive comments as internal-only
- **Public Comments**: Share information with external stakeholders
- **Visual Indicators**: Clear badges show comment visibility

### 📊 **Activity Timeline**
- **Comprehensive History**: Track all incident activities in chronological order
- **Activity Types**:
  - Comments and replies
  - Status changes
  - Severity updates
  - Agent assignments
  - Incident resolutions
  - Mentions
- **Rich Metadata**: See detailed context for each activity

### 📈 **Collaboration Analytics**
- **Team Stats Dashboard**:
  - Total comments (public/internal breakdown)
  - Total reactions
  - Active users count
  - Engagement metrics
- **Top Contributors**: See most active team members with contribution percentages
- **Engagement Score**: Average replies per thread

## How to Use

### Adding Comments
1. Open any incident
2. Click on the "Discussion" tab
3. Type your comment in the text area
4. Use `@username` to mention team members
5. Toggle "Internal Only" if needed
6. Press `Ctrl+Enter` or click "Post Comment"

### Replying to Comments
1. Find the comment you want to reply to
2. Click the "Reply" button
3. Your reply will be threaded under the original comment

### Adding Reactions
1. Hover over any comment
2. Click "Add Reaction"
3. Choose an emoji from the reaction picker
4. Click on an existing reaction to add yours

### Viewing Mentions
1. Click the "Mentions" button in the header
2. See all comments where you've been @mentioned
3. Click on a mention to jump to that incident
4. Mark mentions as read to clear notifications

### Viewing Team Analytics
1. Click "Team Activity" in the header
2. See comprehensive collaboration statistics
3. View top contributors and engagement metrics

## Best Practices

### Effective Communication
- **Be Specific**: Provide clear, actionable information in comments
- **Use Mentions**: Tag the right people to get faster responses
- **Thread Replies**: Keep related discussions organized
- **Use Reactions**: Quick thumbs up for acknowledgment

### Security
- **Internal Comments**: Use for sensitive technical details, credentials, or private discussions
- **Public Comments**: Safe for status updates, general information, and external communication

### Team Coordination
- **Status Updates**: Comment when you start working on an incident
- **Escalations**: @mention team leads when escalation is needed
- **Resolution Notes**: Document what fixed the issue for future reference

## Technical Details

### Data Storage
- All comments and activities are stored using Spark's persistent `useKV` storage
- Real-time updates across all users viewing the same incident
- Full history preserved for auditing

### Comment Structure
```typescript
interface Comment {
  id: string
  incidentId: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  mentions: string[]
  timestamp: number
  isEdited: boolean
  reactions: Reaction[]
  parentCommentId?: string
  replies?: Comment[]
  isInternal: boolean
}
```

### Activity Tracking
- Automatic activity creation for:
  - New incidents
  - Status changes
  - Severity updates
  - Resolutions
  - Comments
  - Mentions

## Keyboard Shortcuts
- `Ctrl+Enter` / `Cmd+Enter`: Post comment
- `@`: Open mention suggestions

## Future Enhancements
- File attachments in comments
- Code syntax highlighting
- Comment search and filtering
- Email/Slack notifications for mentions
- Comment templates
- Bulk actions on comments
