# Voice Command System Documentation

## Overview

The Elastic Agent Orchestrator includes a comprehensive voice command system that enables hands-free operation of the entire incident response platform. Using browser-based speech recognition (Web Speech API), DevOps engineers can control all major functions through natural language voice commands.

## Features

### 🎤 Voice Recognition
- **Browser-based**: Uses Web Speech API (Chrome, Edge, Safari support)
- **Continuous listening**: Optional always-on mode
- **Real-time feedback**: Visual and audio confirmation
- **High accuracy**: Configurable confidence thresholds (50-100%)
- **Multi-language**: Support for 8+ languages

### 🗣️ Natural Language Commands
- **40+ voice commands** across 6 categories
- **Multiple phrase variations** per command
- **Context-aware** command matching
- **Wake word support** (optional)

### 🔊 Voice Feedback
- **Audio confirmations** for executed commands
- **Spoken status updates**
- **Error announcements**
- **Toggle on/off** in settings

### ⚙️ Customization
- **Confidence threshold**: Adjust recognition sensitivity
- **Language selection**: Choose from 8 languages
- **Wake word**: Optional activation phrase
- **Auto-execute**: Skip confirmation dialogs
- **Continuous mode**: Keep listening or one-shot

## Available Commands

### Incident Management
| Command | Variations | Action |
|---------|-----------|--------|
| Create Incident | "create new incident", "create incident", "new incident", "report incident" | Opens incident creation dialog |
| Show Active | "show active incidents", "active incidents", "view active" | Filters to active incidents |
| Show Pending | "show pending", "pending approvals", "view pending" | Shows incidents awaiting approval |
| Show Resolved | "show resolved", "resolved incidents", "completed incidents" | Shows resolved incidents |
| Approve Incident | "approve", "approve incident", "execute resolution" | Approves pending incident (requires confirmation) |
| Reject Incident | "reject", "reject incident", "cancel resolution" | Rejects pending incident (requires confirmation) |
| Filter Critical | "show critical", "critical incidents", "filter critical" | Filters to critical severity |
| Filter High | "show high", "high priority", "filter high" | Filters to high severity |
| Clear Filters | "clear filters", "remove filters", "show all", "reset filters" | Clears all active filters |

### Agent Operations
| Command | Variations | Action |
|---------|-----------|--------|
| Start Analysis | "start analysis", "analyze incident", "run agents", "process incident" | Initiates agent analysis on selected incident |

### Analytics & Insights
| Command | Variations | Action |
|---------|-----------|--------|
| Show Analytics | "show analytics", "open analytics", "view analytics", "analytics dashboard" | Opens analytics dashboard |
| Show Queue | "show queue", "priority queue", "open queue", "view queue" | Opens priority queue display |
| Show Predictions | "show predictions", "predictive analytics", "open predictions" | Shows predictive insights |
| Show Anomalies | "show anomalies", "anomaly detection", "view anomalies" | Opens anomaly detection dashboard |
| Live Streaming | "live streaming", "open streaming", "show live data", "stream metrics" | Opens live metric streaming |

### System Controls
| Command | Variations | Action |
|---------|-----------|--------|
| Open Elasticsearch | "open elasticsearch", "elasticsearch dashboard", "connect elasticsearch" | Opens Elasticsearch connection dialog |
| Open ES\|QL | "open es ql", "esql console", "query console", "open query builder" | Opens ES\|QL query console |
| Open Templates | "workflow templates", "show templates", "open templates" | Opens workflow templates library |
| Open Settings | "open settings", "show settings", "system settings", "preferences" | Opens system settings |
| Open Chatbot | "open chatbot", "show chatbot", "open assistant", "help me" | Activates AI chatbot assistant |
| Load Sample Data | "load sample data", "load demo data", "generate sample" | Loads sample incident data |
| Export Data | "export data", "export incidents", "download data", "export to csv" | Triggers incident data export |
| Refresh | "refresh", "reload", "refresh data", "update data" | Refreshes dashboard data |
| Help | "help", "show commands", "what can you do", "voice commands" | Opens voice command reference |
| Stop Listening | "stop listening", "stop", "cancel", "never mind" | Deactivates voice recognition |

### Settings & Preferences
| Command | Variations | Action |
|---------|-----------|--------|
| Toggle Theme | "toggle theme", "switch theme", "dark mode", "light mode" | Switches between dark/light theme |

## Getting Started

### 1. Enable Voice Commands

Click the **"Voice Commands"** button in the top navigation bar to activate voice recognition.

### 2. Grant Microphone Permission

Your browser will request microphone access. Click "Allow" to enable voice commands.

### 3. Start Speaking

Once activated, the microphone icon will pulse red, indicating the system is listening. Simply speak your command clearly.

### 4. Visual Feedback

You'll see:
- Real-time transcript of what you're saying
- Confidence score for recognition accuracy
- Command execution confirmation

### 5. Voice Feedback

If enabled, the system will:
- Announce when voice commands are active
- Confirm each executed command
- Alert you to errors

## Configuration

### Access Voice Settings

1. Click **Settings** in the top navigation
2. Navigate to the **Voice** tab
3. Or click **Voice Help** → **Advanced Settings**

### Available Settings

#### Basic Settings
- **Enable Voice Commands**: Master on/off switch
- **Continuous Listening**: Keep listening after each command
- **Voice Feedback**: Enable audio confirmations
- **Auto Execute**: Skip confirmation dialogs
- **Show Interim Results**: Display real-time recognition

#### Advanced Settings
- **Language**: Choose recognition language (default: English US)
  - English (US, UK)
  - Spanish
  - French
  - German
  - Italian
  - Japanese
  - Chinese (Simplified)
- **Wake Word**: Optional activation phrase (e.g., "elastic")
- **Confidence Threshold**: Minimum confidence to execute commands (50-100%)
- **Max Alternatives**: Number of recognition alternatives to consider (1-5)

## Tips for Best Results

### ✅ Do:
- **Speak clearly** and at a normal pace
- **Use exact phrases** from the command list for best accuracy
- **Wait for confirmation** before speaking the next command
- **Use wake word** if configured for higher priority
- **Check confidence scores** if commands aren't executing

### ❌ Don't:
- Speak too fast or mumble
- Interrupt while the system is processing
- Use the feature in noisy environments
- Expect commands not in the list to work

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best performance |
| Edge | ✅ Full | Chromium-based |
| Safari | ✅ Full | macOS/iOS only |
| Firefox | ⚠️ Limited | Requires flags |
| Opera | ✅ Full | Chromium-based |

## Privacy & Security

- **No data sent to servers**: All speech recognition happens in your browser
- **Local processing only**: Uses browser's built-in speech recognition
- **Microphone control**: You can disable at any time
- **No recordings stored**: Audio is not saved or transmitted

## Troubleshooting

### "Browser Not Supported"
- Switch to Chrome, Edge, or Safari
- Update your browser to the latest version

### "Microphone Permission Denied"
1. Check browser permissions (usually in address bar)
2. Click the microphone icon and select "Allow"
3. Refresh the page

### "No Speech Detected"
- Check your microphone is working
- Increase microphone volume in system settings
- Reduce background noise
- Move closer to the microphone

### Commands Not Executing
- Check confidence threshold (lower it in settings)
- Speak more clearly and slowly
- Use exact command phrases
- Ensure command is in the available list

### Voice Feedback Not Working
- Check that Voice Feedback is enabled in settings
- Ensure system volume is not muted
- Check browser audio permissions

## Architecture

### Components

**`use-voice-recognition.ts`** - React hook for speech recognition
- Manages Web Speech API
- Handles recognition events
- Provides state and controls

**`voice-commands.ts`** - Command definitions and matching
- 40+ command definitions
- Phrase matching algorithms
- Category organization

**`VoiceCommandButton.tsx`** - Compact activation button
- Quick toggle for voice recognition
- Visual feedback overlay
- Transcript display

**`VoiceCommandPanel.tsx`** - Full command reference
- Searchable command list
- Category filters
- Test command execution

**`VoiceSettingsDialog.tsx`** - Configuration interface
- All voice settings
- Real-time preview
- Defaults and reset

## API Reference

### useVoiceRecognition Hook

```typescript
const {
  isListening,      // Boolean: Currently listening
  isSupported,      // Boolean: Browser supports speech recognition
  transcript,       // String: Final recognized text
  interimTranscript, // String: In-progress recognition
  error,            // String | null: Error message
  lastResult,       // Object: Last recognition result with confidence
  startListening,   // Function: Start voice recognition
  stopListening,    // Function: Stop voice recognition
  toggleListening,  // Function: Toggle on/off
  speak             // Function: Text-to-speech output
} = useVoiceRecognition(settings, onCommand)
```

### Voice Command Structure

```typescript
interface VoiceCommand {
  id: string                    // Unique identifier
  phrases: string[]             // Command variations
  category: VoiceCommandCategory // Command category
  description: string           // User-facing description
  action: string                // Action identifier
  parameters?: string[]         // Optional parameters
  requiresConfirmation?: boolean // Requires user confirmation
}
```

## Future Enhancements

- [ ] Custom command creation
- [ ] Voice macros (command sequences)
- [ ] Contextual command suggestions
- [ ] Multi-language mixing
- [ ] Voice-activated shortcuts
- [ ] Command history and favorites
- [ ] Voice biometrics (speaker recognition)
- [ ] Offline speech recognition

## Support

For issues or questions about voice commands:
1. Check this documentation
2. Review the built-in command reference (say "help")
3. Test your microphone in browser settings
4. Check browser compatibility

---

**Note**: Voice commands require a modern browser with Web Speech API support and microphone permissions. The feature works entirely in your browser with no external services or data transmission.
