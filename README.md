# Elastic Agent Orchestrator

An intelligent DevOps incident response system powered by multi-agent AI orchestration using Elastic Agent Builder's reasoning models and tools.

## 🎯 Overview

This application demonstrates how multiple specialized AI agents (Detector, Analyzer, Resolver, Verifier) can collaborate to automatically detect, investigate, and resolve DevOps incidents with human oversight controls.

## ✨ Key Features

### 🔌 Production Elasticsearch Integration
- **Real-Time Data Streaming**: Connect directly to your Elasticsearch cluster for live production data
- **Flexible Authentication**: Support for API Key, Basic Auth, and Elastic Cloud ID
- **Configurable Streams**: Create unlimited metric streams from any index pattern
- **Multiple Aggregations**: avg, sum, max, min, count with custom field mappings
- **Persistent Configuration**: Connections and streams persist across sessions
- **See [ELASTICSEARCH_INTEGRATION.md](./ELASTICSEARCH_INTEGRATION.md) for full documentation**

### Multi-Agent Orchestration
- **4 Specialized Agents**: Detector, Analyzer, Resolver, and Verifier agents work together in sequence
- **Transparent Reasoning**: Every agent decision is logged with confidence scores and reasoning steps
- **Agent Collaboration**: Agents build on each other's work to form comprehensive solutions

### Workflow Templates Library
- **Pre-configured Templates**: 15+ ready-to-use templates for common incident types
- **Smart Categorization**: Organize by infrastructure, application, security, and database categories
- **Quick Deployment**: Apply templates instantly to new incidents

### Confidence Thresholds & Human Approval
- **Configurable Thresholds**: Set minimum confidence levels (50-99%) for automated execution
- **Human-in-the-Loop**: Low-confidence decisions require manual approval
- **Critical Safeguards**: Critical incidents always require human review

### Multi-Channel Notifications
- **Email & Slack Integration**: Send approval requests via multiple channels
- **Rich Notifications**: Include incident details, confidence scores, and direct action links
- **Test Configuration**: Verify notification setup before going live

### Real-Time Metrics Dashboard
- **Live KPIs**: Track total incidents, resolution rates, active alerts, and more
- **Performance Metrics**: Monitor average resolution time and automated steps
- **Visual Indicators**: Color-coded cards with trend indicators

### Incident Analytics & Visualization
- **Interactive Charts**: Pie charts for severity distribution, bar charts for status breakdown
- **Timeline Analysis**: 7-day trend visualization of created vs resolved incidents
- **Agent Performance**: Track confidence levels and execution counts per agent

### Advanced Search & Filtering
- **Real-Time Search**: Instant filtering across incident titles and descriptions
- **Multi-Criteria Filters**: Combine status, severity, and search queries
- **Clear Filters**: Quick reset to default view

### Data Export & Reporting
- **Multiple Formats**: Export incidents as JSON, CSV, or text reports
- **Comprehensive Reports**: Auto-generated summaries with metrics and detailed incident logs
- **Compliance Ready**: Document all agent actions for audit trails

### Theme Customization
- **Light & Dark Modes**: Toggle between themes for user comfort
- **Persistent Preferences**: Theme choice saved automatically
- **Accessible Design**: WCAG AA compliant contrast ratios

### Bulk Actions
- **Multi-Select**: Select multiple incidents simultaneously
- **Batch Operations**: Mark resolved, archive, or delete in bulk
- **Floating Action Bar**: Context-aware UI for selected incidents

### Dynamic Background & Effects
- **Animated Particles**: Canvas-based particle system with agent-type nodes
- **Interactive Trail**: Mouse cursor trail with connecting lines
- **Configurable Settings**: Adjust particle density, speed, and visual effects

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Phosphor Icons
- **State**: React hooks + Spark KV for persistence
- **AI**: Spark LLM integration for agent reasoning

## 🚀 Getting Started

1. Create a new incident from scratch or use a workflow template
2. Agents automatically analyze the incident in sequence
3. Review reasoning logs and confidence scores
4. Approve or reject proposed solutions
5. Monitor resolution progress and metrics

## 📊 Agent Types

- **Detector**: Identifies and classifies incidents using ES|QL queries
- **Analyzer**: Investigates root causes with Elasticsearch Search
- **Resolver**: Proposes automated solutions via Elastic Workflows
- **Verifier**: Validates solutions before execution

## ⚙️ Configuration

Access the Settings dialog to configure:
- Agent confidence thresholds
- Approval requirements
- Email and Slack notifications
- Background animation settings

## 📈 Metrics & Analytics

The dashboard tracks:
- Total incidents and resolution rates
- Average resolution time
- Steps automated
- Agent performance and confidence
- Severity and status distributions
- 7-day trend analysis

## 🎨 Design Highlights

- High-tech command center aesthetic
- Space Grotesk + JetBrains Mono typography
- Deep space blue and electric cyan color scheme
- Smooth animations and micro-interactions
- Responsive mobile-first design

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
