# Planning Guide

An intelligent DevOps Incident Response Agent that automates incident detection, diagnosis, and resolution using multi-agent orchestration with Elastic Agent Builder's reasoning models and tools.

**Experience Qualities**:
1. **Intelligent** - The system should feel like having an expert DevOps engineer analyzing and resolving issues autonomously
2. **Transparent** - Every agent decision, reasoning step, and action should be visible and explainable to build trust
3. **Responsive** - Real-time updates and instant feedback as agents work through incident response workflows

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This showcases multi-agent orchestration where different specialized agents (Detector, Analyzer, Resolver, Verifier) collaborate to handle incident response workflows, demonstrating the full power of Elastic Agent Builder's reasoning capabilities and tool integrations.

## Essential Features

**Multi-Agent Orchestration System**
- Functionality: Coordinates four specialized agents (Detector, Analyzer, Resolver, Verifier) that work together to handle incidents
- Purpose: Demonstrates how multiple agents can collaborate, debate, and verify each other's work for reliable automation
- Trigger: User creates a new incident or system detects an anomaly
- Progression: Create incident → Detector identifies issue type → Analyzer investigates root cause → Resolver proposes fix → Verifier validates solution → Execute action → Report results
- Success criteria: Agents successfully collaborate with visible reasoning chains and produce actionable resolutions

**Workflow Templates Library**
- Functionality: Pre-configured workflow templates for common incident types (API latency, database issues, memory leaks, security breaches, etc.) that can be instantly applied
- Purpose: Accelerates incident response by providing battle-tested workflows for recurring problems
- Trigger: User clicks "Workflow Templates" button or needs to create a new incident
- Progression: Browse templates → Filter by category/severity → Preview template details and steps → Select template → Auto-populate incident form → Execute workflow
- Success criteria: Users can quickly respond to common incidents using templates without manual configuration

**Agent Confidence Threshold Settings**
- Functionality: Configurable confidence thresholds that determine when agents require human approval before executing automated resolutions
- Purpose: Provides safety controls and human oversight for critical decisions, balancing automation with reliability
- Trigger: User clicks "Settings" button to configure thresholds
- Progression: Open settings → Adjust minimum confidence threshold (50-99%) → Set critical incident threshold → Toggle auto-execution and approval requirements → Save settings
- Success criteria: Agents respect threshold settings and correctly request approval when confidence is below threshold or incident is critical

**Human-in-the-Loop Approval System**
- Functionality: Interactive approval workflow that pauses automated resolution when agent confidence is low or incidents are critical, with email and Slack notifications
- Purpose: Ensures human oversight for risky or uncertain automated actions, building trust in agent decisions, and proactively alerts team members when approval is needed
- Trigger: Agent analysis completes with confidence below threshold or incident has critical severity
- Progression: Agent completes analysis → System checks confidence against thresholds → If below threshold, mark incident as "pending-approval" → Send notifications via configured channels (email/Slack) → Show approval dialog → User reviews agent reasoning and proposed solution → User approves or rejects → If approved, execute workflow; if rejected, mark as failed
- Success criteria: Users can review complete agent reasoning, see confidence scores for each agent, make informed approval decisions, and receive timely notifications when approval is required

**Multi-Channel Notification System**
- Functionality: Configurable email and Slack notifications that alert team members when incidents require human approval or meet certain criteria
- Purpose: Ensures timely response to critical incidents by notifying the right people through their preferred communication channels
- Trigger: Incident enters pending-approval state, low confidence detected, or critical incident created
- Progression: Open Settings → Navigate to Notifications tab → Enable notifications → Configure email recipients and/or Slack webhook URL → Set notification triggers → Test configuration → Save settings → Receive alerts when conditions are met
- Success criteria: Team members receive rich, formatted notifications via email and/or Slack with incident details, confidence scores, approval reasons, and direct links to review the incident

**Real-Time Metrics Dashboard**
- Functionality: Live overview displaying key performance indicators including total incidents, resolution rates, average resolution time, active incidents, pending approvals, and failed incidents
- Purpose: Provides at-a-glance visibility into system health and agent performance for informed decision-making
- Trigger: Automatically updates as incidents change status or new incidents are created
- Progression: View dashboard → Monitor real-time metrics → Identify trends → Take action on outliers
- Success criteria: Metrics update in real-time, show accurate counts and calculations, and provide actionable insights

**Incident Analytics & Visualization**
- Functionality: Interactive charts and graphs showing incident distribution by severity, status breakdown, 7-day timeline trends, and agent performance metrics with confidence levels
- Purpose: Enables pattern recognition, trend analysis, and data-driven optimization of incident response workflows
- Trigger: User clicks "Show Analytics" button
- Progression: Click analytics toggle → View multiple chart types → Analyze severity distribution → Review timeline trends → Assess agent performance
- Success criteria: Charts render correctly with accurate data, update dynamically as incidents change, and provide meaningful insights

**Advanced Search & Filtering**
- Functionality: Real-time search across incident titles and descriptions, with dropdown filters for status and severity, plus clear filters button
- Purpose: Helps users quickly find specific incidents or groups of incidents matching criteria
- Trigger: User types in search box or selects filter options
- Progression: Enter search query → Apply status/severity filters → View filtered results → Clear filters to reset
- Success criteria: Search results update instantly, filters combine correctly, and no incidents match criteria shows appropriate message

**Data Export & Reporting**
- Functionality: Export incident data in multiple formats (JSON, CSV) and generate comprehensive text reports with summary metrics and detailed incident breakdowns
- Purpose: Enables external analysis, compliance documentation, and sharing insights with stakeholders
- Trigger: User clicks "Export" dropdown button
- Progression: Click export → Select format (JSON/CSV/Report) → File downloads automatically → Open in preferred tool
- Success criteria: Exported files contain complete and accurate data, proper formatting, and include all relevant fields

**Theme Toggle (Light/Dark Mode)**
- Functionality: User-controlled theme switcher with persistent preference storage supporting both light and dark modes
- Purpose: Improves accessibility and user comfort across different lighting conditions and personal preferences
- Trigger: User clicks theme toggle button in header
- Progression: Click theme toggle → UI instantly switches between light/dark → Preference saved → Theme persists on reload
- Success criteria: Theme changes apply globally, all components respect theme, contrast ratios remain accessible, and preference persists

**Bulk Actions for Incidents**
- Functionality: Select multiple incidents simultaneously and perform batch operations including mark as resolved, archive, or delete with confirmation
- Purpose: Dramatically improves efficiency when managing large numbers of incidents
- Trigger: User clicks "Select Multiple" button and checks incident checkboxes
- Progression: Enable selection mode → Check desired incidents → Floating action bar appears → Choose bulk action → Confirm → Action applies to all selected
- Success criteria: Multiple incidents can be selected, bulk actions execute correctly, floating UI appears/disappears appropriately, and user can cancel selection

**Real-Time Agent Collaboration Visualization**
- Functionality: Live canvas-based visualization showing data flow between agents with animated packets traveling along connection paths, agent status indicators, confidence scores, and real-time activity feed
- Purpose: Makes multi-agent orchestration tangible and transparent by visualizing how agents pass information, collaborate, and build upon each other's work in real-time
- Trigger: User starts agent analysis on an incident, or clicks "Agent Flow" button in header
- Progression: Incident processing begins → Detector agent activates → Data packet animates from START to Detector → Detector completes with confidence score → Packet flows to Analyzer → Process continues through all agents → Activity feed shows live reasoning steps → Click "View Detailed Analysis" for full-screen visualization with pipeline status and reasoning timeline
- Success criteria: Users can see animated data flow between agents, view live activity feed with tool usage and confidence scores, track pipeline progress, understand agent sequence and dependencies, and access detailed modal with complete collaboration analysis

**Predictive Incident Detection**
- Functionality: AI-powered predictive analytics that analyzes historical incident patterns to forecast future incidents before they occur, detect anomalies in incident rates, identify recurring issues, and track trends over time
- Purpose: Shifts from reactive to proactive incident management by predicting when incidents are likely to occur based on patterns, enabling preventive action to avoid incidents entirely
- Trigger: Automatically runs when viewing dashboard with 3+ historical incidents, or user clicks "Predictions" button in header
- Progression: System analyzes historical incidents → Identifies recurring patterns and keywords → Calculates frequency, intervals, peak times/days, and seasonality → Generates predictive insights with confidence scores → Detects anomalies in incident rates → Identifies concerning trends → Provides actionable prevention steps → User clicks insight for details → Reviews pattern analysis and related incidents → Creates preventive action to address predicted issue
- Success criteria: Users see accurate predictions with confidence scores, understand which patterns are driving predictions, receive actionable prevention recommendations, can create preventive incidents from insights, and benefit from early warning system for emerging issues

**Priority Queue with Auto-Escalation**
- Functionality: Intelligent queue system that automatically prioritizes incidents based on severity, age, SLA deadlines, and approval status, with automatic escalation for incidents that wait too long and severity upgrades after multiple escalations
- Purpose: Ensures critical incidents are handled first, prevents incidents from being forgotten, maintains SLA compliance, and automatically escalates urgent issues that need immediate attention
- Trigger: Automatically active when priority queue settings are enabled; runs continuous background checks every 30 seconds to detect incidents requiring escalation
- Progression: New incident created → Added to priority queue with calculated priority score → Queue sorted by priority (critical > high > medium > low) → SLA deadline tracked → If incident waits beyond escalation threshold, auto-escalate with priority boost → After 3 escalations, upgrade severity level (e.g., Medium → High) → Toast notification and floating alert appear → User can click "Process Now" from queue or alert → Incident moves to processing
- Success criteria: Priority queue displays all new and pending-approval incidents sorted by priority, SLA progress bars show time remaining, overdue incidents highlighted in red, escalation notifications appear for time-sensitive incidents, severity automatically upgrades after repeated escalations, and queue metrics dashboard shows real-time statistics

**ML-Powered Anomaly Detection with Custom Thresholds**
- Functionality: Advanced anomaly detection system using multiple machine learning algorithms (Z-Score, IQR, MAD, Isolation Forest, and Ensemble) to identify unusual patterns in incident data with fully customizable sensitivity thresholds for each detection method
- Purpose: Provides early warning of system issues by detecting anomalies in incident rates, volumes, and patterns before they become critical problems, with fine-grained control over detection sensitivity to balance false positives and false negatives
- Trigger: Automatically analyzes incident time series data when dashboard loads; user can toggle "Anomalies" button in header to view detailed analysis or adjust detection settings in Settings → Anomaly Detection tab
- Progression: System converts incidents to time series data points → Calculates baseline metrics (mean, median, std dev, IQR, MAD, trend, seasonality) → Runs selected detection algorithm(s) with configured thresholds → Identifies anomalies with severity levels (low, medium, high, critical) → Calculates confidence scores → Generates suggested actions for each anomaly → User selects sensitivity preset (Low/Medium/High/Critical) or fine-tunes individual algorithm parameters → Views anomalies dashboard with severity distribution → Examines time series visualization with anomaly markers → Reviews detection methods and confidence scores → Takes action on critical/high severity anomalies
- Success criteria: Accurately detects anomalies in incident patterns using multiple algorithms, provides clear visualizations showing when and where anomalies occurred, displays confidence scores and detection methods for transparency, offers actionable recommendations for each anomaly, allows users to customize sensitivity levels through simple presets or advanced parameter tuning, shows baseline metrics and statistical thresholds for understanding normal vs anomalous behavior, and enables switching between detection algorithms to compare results

**External Metric Correlation with System Infrastructure**
- Functionality: Intelligent correlation engine that analyzes external system metrics (CPU, memory, network throughput, disk I/O, API latency, error rates) alongside incident data to identify root cause indicators and multi-metric patterns using statistical correlation analysis
- Purpose: Provides deep insights into incident causation by correlating incidents with infrastructure performance metrics, helping identify whether incidents are caused by resource exhaustion, network issues, or application-level problems
- Trigger: User clicks "Analyze External Metric Correlations" button in incident detail view, or clicks correlation badge on incident cards showing strong correlations
- Progression: User selects incident → Click correlation analysis → System fetches external metrics for time window (±30 minutes from incident) → Calculates Pearson correlation scores between incident timing and each metric → Identifies strong correlations (≥50% correlation score) → Analyzes multi-metric patterns (e.g., CPU + Memory = Resource Exhaustion) → Generates suggested root causes based on metric deviations → Display correlation dashboard with tabs for correlations and metric charts → User reviews correlation strength, confidence scores, and suggested causes → Examines time series charts with incident marker showing metric behavior → Exports correlation report → Takes preventive action based on insights
- Success criteria: System accurately correlates incidents with relevant metrics, identifies strong correlations (≥50%) with high confidence, detects multi-metric patterns indicating system-wide issues, provides actionable root cause suggestions for each correlated metric, visualizes metrics with incident timing overlay, shows statistical deviation scores (z-scores), displays inline correlation badges on incident cards for quick identification, generates comprehensive correlation reports for documentation, and helps distinguish between correlation types (CPU spikes, memory leaks, network congestion, I/O bottlenecks, latency issues, error rate increases)

**Real-Time Metric Streaming from Elasticsearch**
- Functionality: Live metric streaming system that simulates continuous data ingestion from Elasticsearch with real-time correlation analysis, anomaly detection, and comprehensive visualization dashboard supporting 6 metric types across system performance and application health
- Purpose: Transforms incident response from reactive to proactive by providing continuous monitoring of infrastructure metrics with live correlation to active incidents, enabling DevOps teams to detect issues before they become incidents and understand root causes through real-time data analysis
- Trigger: User clicks "Live Streaming" button in header (appears when metrics exist), or opens full Live Correlation Dashboard from Live Metric Widget
- Progression: Click Live Streaming → Select incident to track → Start streaming → All 6 metrics begin updating every 2-3 seconds with realistic patterns → View live sparkline charts with threshold indicators → System automatically detects anomalies in streaming data → When anomalies detected, system recalculates correlations with tracked incident → Live Correlations tab shows updated correlation scores, confidence levels, and suggested causes → Multi-metric pattern detection identifies complex issues (Resource Exhaustion, Service Degradation, Network/I/O Bottlenecks) → Anomalies tab displays real-time alerts with severity classification → View Elasticsearch queries (both standard and ES|QL) in Queries tab → Pause/resume individual metric streams → Live Metric Widget on dashboard shows compact view of top 6 metrics with quick access → Export correlation reports and streaming data
- Success criteria: Metrics update continuously with realistic data patterns including baseline variation and occasional spikes, anomalies detected automatically with severity classification (low/medium/high/critical), live correlation analysis recalculates when new anomalies detected, strong correlations (≥50%) highlighted with confidence scores, multi-metric patterns recognized (CPU+Memory, Latency+Errors, etc.), individual streams can be paused and resumed independently, Elasticsearch queries displayed in both standard and ES|QL formats, sparkline charts render smoothly with last 50 data points, threshold warning/critical lines shown on charts, update history tracked (last 100 updates per metric), correlation history maintained for incident, dashboard tabs (Streams/Correlations/Anomalies/Queries) all functional, compact widget integrates seamlessly with main dashboard, full modal provides comprehensive streaming interface, streaming service properly manages subscriptions and cleanup, canvas-based charts optimized for performance

**Production Elasticsearch Integration with WebSocket Streaming**
- Functionality: Full production integration allowing connection to real Elasticsearch clusters (self-hosted, Elastic Cloud) with support for API key, username/password, and Cloud ID authentication, plus configurable real-time metric streams from any index pattern with aggregations (avg, sum, max, min, count) and custom field mappings
- Purpose: Enables the application to work with real production data instead of mock data, providing genuine incident detection, metric correlation, and anomaly detection based on actual system metrics from Elasticsearch infrastructure monitoring
- Trigger: User clicks "Elasticsearch" button in header to open integration dashboard
- Progression: Open Elasticsearch Dashboard → Select authentication method (API Key, Basic Auth, or Cloud ID) → Enter connection details → Click "Connect to Elasticsearch" → System tests connection and displays cluster info (name, version, status) → Navigate to "Data Streams" tab → View available indices or enter custom pattern → Click "Add Stream" → Configure stream (name, index, metric field, timestamp field, aggregation type, update interval) → Add stream to list → Click play button to start streaming → Monitor real-time values and last update timestamps → View active stream count in header badge → Streams persist across sessions → Configure multiple streams for different metrics → Pause/resume or delete streams as needed → Connection status and stream health displayed throughout app
- Success criteria: Successfully connects to Elasticsearch clusters using multiple authentication methods, validates connections with cluster health check, auto-discovers available indices for easy configuration, supports custom index patterns for flexibility, streams update at configured intervals (1-60 seconds), displays real-time metric values with timestamps, handles connection errors gracefully with clear error messages, persists connection config and stream definitions across sessions, shows active stream count in header, integrates seamlessly with existing correlation and anomaly detection features, provides clear UI for managing multiple concurrent streams, stops all streams cleanly on disconnect, supports both latest-value queries and aggregated metrics, allows filtering with custom query DSL, ES|QL query interface for advanced users (future enhancement)

**ES|QL Query Builder with Syntax Highlighting and History**
- Functionality: Professional query console for building and executing ES|QL queries against real Elasticsearch connections with real-time syntax highlighting, autocomplete suggestions, query validation, persistent history tracking, comprehensive sample query library, quick reference documentation, index suggestions, query result analysis, visual chart builder, and CSV export capabilities
- Purpose: Empowers users to write complex ES|QL queries efficiently with immediate feedback, learn ES|QL syntax through examples, track query performance over time, analyze query results with automatic statistics, visualize data with interactive charts, and reuse successful queries from history—making the Elasticsearch Query Language more accessible and productive for incident analysis and system monitoring
- Trigger: User clicks "ES|QL Console" button in header to open the query builder dashboard
- Progression: Open ES|QL Console → View connection status (connected to cluster with version info and index count) → View query statistics dashboard (total queries, success rate, avg execution time) → Switch to Query Builder tab → View available indices in sidebar → Click index to insert into query → Type query in editor with live syntax highlighting (keywords in blue, functions in purple, strings in green, operators in orange, numbers in cyan) → See validation errors in real-time → Use Cmd/Ctrl+Enter to execute → Query sent to real Elasticsearch cluster → Results parsed and displayed → Toggle between Table and Chart views → In Chart view, auto-detect or manually configure visualization (bar/line/pie chart) → Select X and Y axis fields → Choose color scheme and display options → View real-time chart with smart data aggregation → Export results as CSV or export chart as image → Browse Sample Queries tab for common patterns (log search, aggregations, error analysis, performance metrics, network analysis) → Click sample to load → View Quick Reference for ES|QL commands and functions → Switch to Query History tab → Search through past queries → Filter by success/failure → Click history item to reload query → View execution time and row count → Copy query to clipboard → Delete individual entries or clear all history → History persists across sessions (max 100 queries)
- Success criteria: Successfully connects to real Elasticsearch cluster and executes ES|QL queries via API, supports multiple ES|QL endpoint formats (_query, _esql/query, _sql) with automatic fallback, syntax highlighting updates instantly as user types with correct color coding for all token types, query validation shows clear error messages before execution, Cmd/Ctrl+Enter keyboard shortcut executes query, successful queries return real data from Elasticsearch in clean table format with all columns visible, failed queries show detailed Elasticsearch error messages with reasons, Query Result Analyzer automatically calculates statistics including numeric aggregations and categorical distributions, visual chart builder transforms query results into bar/line/pie charts with one click, auto-detect feature intelligently suggests chart type and field mappings based on data types, 7 color schemes available (default/ocean/forest/sunset/purple/gradient/monochrome) with preview, charts update in real-time as configuration changes, pie charts automatically group top 9 items plus "Others" category, numeric columns detected automatically for Y-axis, categorical columns identified for X-axis, swap axes button for quick field reversal, legend and grid toggles for customization, animation controls for presentation mode, export buttons for both CSV data and chart images, CSV export downloads complete dataset with proper escaping, available indices grouped by prefix for easy navigation, index insertion replaces FROM clause intelligently, query history saves all executed queries with timestamp and performance metrics, history search filters queries accurately, sample queries cover common use cases and load instantly, quick reference provides helpful command and function documentation, statistics dashboard shows accurate aggregate metrics across all queries, connection status badge shows real-time cluster info, UI performs smoothly with large result sets, responsive layout works on different screen sizes, proper error handling for network failures and CORS issues


**Interactive Agent Workflow Builder**
- Functionality: Visual interface to create, configure, and monitor multi-step agent workflows with real-time execution tracking
- Purpose: Makes complex agent orchestration approachable and transparent
- Trigger: User clicks "New Workflow" or selects a template
- Progression: Select workflow type → Configure agents and tools → Define success criteria → Save → Execute → Monitor progress
- Success criteria: Users can build and execute custom agent workflows without writing code

**Real-Time Incident Dashboard**
- Functionality: Live view of all incidents with agent status, reasoning logs, and action history
- Purpose: Provides complete visibility into what agents are doing and why
- Trigger: User navigates to dashboard or incident is created
- Progression: View incidents list → Select incident → See agent reasoning → Review tool executions → Approve/reject actions
- Success criteria: Every agent decision is traceable with timestamps and reasoning explanations

**Agent Reasoning Visualizer**
- Functionality: Step-by-step breakdown of agent thought process showing tool selection, ES|QL queries, and decision logic
- Purpose: Builds trust by making AI reasoning transparent and debuggable
- Trigger: Agent begins processing an incident
- Progression: Agent receives task → Selects appropriate tools → Executes ES|QL/Search/Workflow → Reasons about results → Proposes action → Shows confidence score
- Success criteria: Users can understand exactly why an agent made each decision

**Automated Remediation Simulator**
- Functionality: Safe environment to test agent-proposed solutions before executing in production
- Purpose: Allows agents to take reliable action by validating fixes first
- Trigger: Resolver agent proposes a solution
- Progression: Solution proposed → Run in simulator → Verifier agent reviews results → Show impact prediction → Request approval → Execute if approved
- Success criteria: No breaking changes reach production without validation

## Edge Case Handling

- **Agent Disagreement**: When Resolver and Verifier agents disagree, escalate to user with both perspectives and confidence scores
- **Unknown Incident Types**: Detector agent flags novel patterns for user classification and learning
- **Tool Failures**: Graceful fallback to alternative tools (Search if ES|QL fails, Workflow if API unavailable)
- **Low Confidence Decisions**: Require human approval for any action with confidence below configured threshold (default 80%)
- **Critical Incidents**: Always require human approval regardless of confidence level for critical severity incidents
- **Concurrent Incidents**: Priority queue ensures critical incidents are processed first with automatic prioritization
- **Queue Overflow**: When multiple critical incidents accumulate, auto-escalation ensures oldest incidents get attention first
- **SLA Breaches**: Visual alerts and priority boosts for incidents exceeding SLA deadlines to prevent further delays
- **Insufficient Data for Anomaly Detection**: System requires minimum data points (configurable, default 10) before running anomaly detection to ensure statistical validity
- **False Positive Anomalies**: Sensitivity presets and threshold customization allow users to tune detection to reduce noise while maintaining coverage
- **Algorithm Selection**: Ensemble mode combines multiple algorithms for highest accuracy, but users can select specific algorithms for targeted analysis or performance optimization
- **Escalation Storms**: Escalation notifications are rate-limited to prevent alert fatigue (max 3 visible at once, auto-dismiss after 30s)
- **Missing External Metrics**: System generates mock external metrics from incident timeline when real metrics aren't available, ensuring correlation analysis always works
- **Weak Correlations**: Only display correlation badges for incidents with ≥50% correlation score to reduce noise and focus on meaningful relationships
- **Metric Data Gaps**: Correlation analysis requires minimum 3 data points within time window; shows clear message if insufficient data available
- **Multiple Strong Correlations**: When multiple metrics correlate strongly, system identifies multi-metric patterns (e.g., "Resource Exhaustion Pattern") to provide higher-level insights
- **Time Window Selection**: Default 30-minute window (±15 minutes) balances catching related metrics while avoiding false correlations from unrelated events
- **Missing Data**: Agents explicitly request additional context rather than making assumptions
- **Approval Timeout**: Pending approval incidents remain in queue until user reviews, preventing unintended auto-execution
- **Failed Approvals**: Rejected incidents are marked as failed and require manual intervention or re-analysis
- **Notification Failures**: If email or Slack notification fails, log error in console and show in-app toast notification as fallback
- **Invalid Notification Configuration**: Validate email addresses and webhook URLs before saving, show clear error messages for invalid configurations
- **ES|QL Endpoint Variations**: System tries multiple ES|QL API endpoints (_query, _esql/query, _sql) with automatic fallback if primary endpoint returns 404
- **ES|QL Syntax Errors**: Display clear, actionable error messages from Elasticsearch with line numbers and suggested fixes where available
- **Large Query Results**: Limit result display to prevent UI performance issues, provide CSV export for full dataset analysis
- **Connection Failures**: Handle network errors and CORS issues gracefully with clear messages about checking Elasticsearch CORS settings
- **Missing Indices**: When user references non-existent index, show Elasticsearch error with suggestions for available indices
- **Query Timeout**: Long-running queries show loading state and can be interrupted, error messages indicate timeout vs syntax issues
- **Malformed Response**: Normalize different ES|QL response formats (columns/values, rows/columns, standard search) into consistent structure
- **Query History Overflow**: Automatically limit history to most recent 100 queries to prevent storage issues, oldest entries dropped first
- **Multiple Recipients**: Support multiple email recipients and send notifications to all configured channels simultaneously
- **Test Notifications**: Provide test button to verify notification configuration without creating real incidents
- **ES|QL Syntax Errors**: Real-time validation catches common errors (missing FROM, unclosed quotes, mismatched parentheses) before query execution to prevent frustration
- **Empty Query History**: When no queries exist, show helpful empty state with suggestion to execute first query and view sample queries
- **Large Result Sets**: Table view implements scrolling for large datasets while maintaining header visibility; CSV export handles datasets up to 100,000 rows
- **Query Execution Timeout**: If query takes longer than 30 seconds, show timeout warning and allow user to cancel
- **Invalid ES|QL Commands**: Validation recognizes all ES|QL commands and provides suggestions for typos (e.g., "FORM" → "Did you mean FROM?")
- **History Storage Limits**: Automatically trim history to most recent 100 queries to prevent storage bloat while maintaining useful history depth
- **Connection Required Queries**: When executing queries without Elasticsearch connection, generate mock data for demonstration purposes with clear indicator

## Design Direction

The design should evoke a high-tech command center - sophisticated, data-rich, and mission-critical. It should feel like NASA mission control meets modern DevOps, with multiple agents working in concert like an expert team. The interface prioritizes information density and real-time status updates while maintaining clarity through strong visual hierarchy and purposeful use of color to indicate agent states and severity levels. A dynamic animated background creates depth and reinforces the multi-agent orchestration theme with interconnected nodes representing different agent types. An interactive mouse trail provides visual feedback and reinforces the high-tech aesthetic.

## Color Selection

A technical, high-contrast scheme inspired by monitoring dashboards and terminal interfaces, using vibrant accents to indicate status and agent activity.

- **Primary Color**: Deep Space Blue `oklch(0.25 0.05 250)` - Commands authority and technical sophistication, used for primary actions and active agent states
- **Secondary Colors**: Slate Gray `oklch(0.35 0.02 250)` for cards and containers, Electric Cyan `oklch(0.75 0.15 200)` for data highlights and links
- **Accent Color**: Vibrant Green `oklch(0.70 0.20 145)` - Signals success, completed actions, and healthy system states
- **Status Colors**: Amber `oklch(0.75 0.15 75)` for warnings, Crimson `oklch(0.55 0.22 25)` for critical alerts
- **Foreground/Background Pairings**: 
  - Background Dark `oklch(0.15 0.02 250)`: Light text `oklch(0.95 0.01 250)` - Ratio 12.5:1 ✓
  - Primary Blue `oklch(0.25 0.05 250)`: White text `oklch(0.98 0 0)` - Ratio 8.2:1 ✓
  - Accent Green `oklch(0.70 0.20 145)`: Dark text `oklch(0.15 0.02 250)` - Ratio 9.1:1 ✓
  - Amber Alert `oklch(0.75 0.15 75)`: Dark text `oklch(0.15 0.02 250)` - Ratio 10.3:1 ✓

## Font Selection

Typefaces should communicate precision, technical excellence, and real-time data processing, similar to code editors and terminal interfaces but with improved readability.

- **Typographic Hierarchy**: 
  - H1 (Page Title): Space Grotesk Bold/32px/tight letter-spacing, used for main dashboard title
  - H2 (Section Headers): Space Grotesk Semibold/24px/normal, used for agent names and incident titles
  - H3 (Card Titles): Space Grotesk Medium/18px/normal, used for workflow steps and tool names
  - Body Text: JetBrains Mono Regular/14px/relaxed line-height, used for reasoning logs and ES|QL queries
  - Labels/Metadata: Space Grotesk Regular/12px/wide letter-spacing uppercase, used for status badges and timestamps
  - Code Blocks: JetBrains Mono Regular/13px/1.6 line-height, used for ES|QL queries and JSON responses

## Animations

Animations should emphasize real-time processing and agent activity without distracting from critical information. Use subtle pulsing for active agents, smooth transitions between workflow states, and satisfying micro-interactions for completed tasks.

Key animation moments: Agent activation (scale + glow effect), reasoning step completion (check animation with green pulse), tool execution (loading spinner with color-coded rings), incident severity changes (attention-grabbing shake for critical), workflow progression (smooth left-to-right timeline advancement).

**Dynamic Background Animation**: Canvas-based particle system with floating nodes representing the four agent types (Detector, Analyzer, Resolver, Verifier). Nodes pulse with agent-specific colors, connect with translucent lines when in proximity, and show animated data flows between agents. A subtle grid pattern provides depth without overwhelming the content. Particles drift slowly to create ambient movement.

**Interactive Mouse Trail**: Smooth cursor trail that leaves a glowing cyan-to-green gradient path with connecting lines between trail points when in proximity. Trail particles fade gradually with shadows and radial gradient effects. Reinforces the interconnected-systems theme and provides satisfying visual feedback during interaction.

## Component Selection

- **Components**: 
  - `Card` with custom gradient borders for agent status panels
  - `Tabs` for switching between Dashboard/Workflows/History views
  - `Badge` with custom colors for incident severity and agent states
  - `Dialog` for incident details and action approval modals
  - `ScrollArea` for reasoning logs and ES|QL query results
  - `Progress` for workflow step completion indicators
  - `Alert` for system notifications and agent warnings
  - `Separator` to divide agent reasoning steps
  - `Tooltip` for explaining agent decisions and tool choices
  - `Sheet` for sliding panels with detailed agent configurations
  
- **Customizations**: 
  - Custom timeline component showing agent workflow progression with connecting lines
  - Animated agent avatar component with status indicators (idle/thinking/executing/complete)
  - Code syntax highlighter for ES|QL queries using custom styling
  - Real-time log streamer with auto-scroll and line numbers
  - Confidence meter visualization showing agent certainty levels
  - Canvas-based agent collaboration graph with animated data packets flowing between agents
  - Live activity feed with timeline visualization showing reasoning steps and tool invocations
  - Full-screen collaboration visualization modal with pipeline status, reasoning timeline, and flow statistics
  - Priority queue display with position numbers, SLA progress bars, and escalation badges
  - Queue metrics dashboard showing critical counts, overdue incidents, and average wait times
  - Floating escalation alerts with animated entrance/exit and auto-dismiss timers
  - Priority score calculator with age-based weighting and severity multipliers
  
- **States**: 
  - Buttons: Default (subtle border), Hover (bright glow), Active (inset shadow), Disabled (reduced opacity with explanation tooltip)
  - Agent Cards: Idle (gray), Thinking (pulsing blue), Executing (animated green progress), Error (red border shake), Success (green checkmark)
  - Incidents: New (white), In Progress (blue pulse), Resolved (green), Failed (red), Pending Approval (amber)
  
- **Icon Selection**: 
  - `Detective` for Detector agent
  - `MagnifyingGlass` for Analyzer agent  
  - `Wrench` for Resolver agent
  - `ShieldCheck` for Verifier agent
  - `Lightning` for automated actions and activity feed
  - `GitBranch` for workflow orchestration and agent collaboration
  - `Terminal` for ES|QL queries
  - `Database` for Elasticsearch search and data packets
  - `Gear` for Elastic Workflows and settings
  - `Bell` for notifications
  - `EnvelopeSimple` for email notifications
  - `ChatCircleDots` for Slack notifications
  - `PaperPlaneTilt` for sending test notifications
  - `Clock` for timestamps
  - `ArrowRight` for workflow progression
  - `CheckCircle` for completed steps
  - `Warning` for alerts
  - `ChartLine` for analytics and detailed flow visualization
  - `Brain` for AI reasoning and search tools
  - `ListBullets` for priority queue
  - `FireSimple` for critical priority
  - `ClockCountdown` for SLA breaches
  - `ArrowUp` for escalations and severity upgrades
  - `Hourglass` for wait times
  
- **Spacing**: 
  - Cards: `p-6` internal padding, `gap-4` between content sections
  - Agent grid: `gap-6` for spacious card layout
  - Workflow timeline: `gap-8` between major steps, `gap-2` between sub-items
  - Dashboard sections: `space-y-8` for clear visual separation
  
- **Mobile**: 
  - Stack agent cards vertically on mobile with full width
  - Collapse workflow timeline to vertical orientation
  - Sheet component for incident details instead of modal dialogs
  - Hamburger menu for main navigation
  - Priority view showing only critical incidents on small screens
  - Swipe gestures to navigate between incidents
