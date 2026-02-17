# SLA Breach Escalation Workflows

## Overview

The Elastic Agent Orchestrator now includes fully automated escalation workflows that trigger when SLA breaches occur. The system automatically detects breaches, evaluates escalation rules, and executes predefined actions to ensure critical incidents receive immediate attention.

## Key Features

### 1. Automated Breach Detection
- Continuous monitoring of active incidents against SLA policies
- Real-time breach detection for response and resolution deadlines
- At-risk incident identification before breaches occur

### 2. Intelligent Escalation Rules
Five default escalation rules are pre-configured:

#### Critical Incident Breach Response
- **Trigger**: SLA breach for critical incidents
- **Actions**:
  1. Page on-call team immediately
  2. Notify engineering leads via Slack and email
  3. Assign senior engineer
  4. Trigger emergency response workflow
- **Cooldown**: 30 minutes
- **Max Executions**: 3

#### High Priority At-Risk Alert
- **Trigger**: High/critical incidents approaching deadline (≥75% elapsed)
- **Actions**:
  1. Notify incident response team via Slack
  2. Trigger escalation preparation workflow
- **Cooldown**: 1 hour
- **Max Executions**: 2

#### Auto-Upgrade After Time Threshold
- **Trigger**: Medium/high incidents exceeding 2-hour threshold
- **Actions**:
  1. Automatically upgrade severity level
  2. Notify operations team
- **Cooldown**: 3 hours
- **Max Executions**: 1

#### Auto-Approve Critical Breaches
- **Trigger**: Critical incident resolution breach
- **Actions**:
  1. Auto-approve pending agent actions
  2. Notify incident response team
- **Max Executions**: 1

#### External System Integration
- **Trigger**: High/critical resolution breach
- **Actions**:
  1. Send webhook to external ITSM system
  2. Create escalation ticket
- **Status**: Disabled by default

### 3. Escalation Actions

The system supports 8 types of automated actions:

- **notify_team**: Send notifications via configured channels (Slack, email, SMS)
- **upgrade_severity**: Automatically increase incident severity
- **assign_senior**: Route to senior engineering resources
- **trigger_workflow**: Initiate predefined automation workflows
- **page_oncall**: Alert on-call personnel immediately
- **create_ticket**: Generate tickets in external systems
- **send_webhook**: Trigger external integrations
- **auto_approve**: Bypass approval requirements for urgent situations

### 4. Execution Tracking

Every escalation execution is logged with:
- Timestamp and trigger type
- Individual action results (success/failure)
- Execution duration
- Related incident and rule information
- Detailed error messages for troubleshooting

### 5. Performance Monitoring

The Escalation Workflows tab provides:
- Real-time execution status
- Success rate per rule
- Historical performance metrics
- Failed execution analysis
- Rule usage statistics

## How It Works

### Automatic Workflow

1. **Breach Detection**: System detects SLA breach or at-risk incident
2. **Rule Evaluation**: Applicable escalation rules are identified based on:
   - Incident severity
   - Breach type (response/resolution/both)
   - Time thresholds
   - Rule conditions
3. **Action Execution**: Actions execute in priority order:
   - Each action runs sequentially
   - Success/failure is recorded
   - Errors don't block subsequent actions
4. **Notification**: Team is notified of escalation completion
5. **Cooldown**: Rule enters cooldown period to prevent spam

### Manual Controls

- **Enable/Disable Rules**: Toggle rules on/off in Settings
- **View Execution Details**: Click any execution to see full timeline
- **Acknowledge Breaches**: Document SLA breaches with notes
- **Override Actions**: Manual intervention always takes precedence

## Configuration

### SLA Policies with Escalation

Each SLA policy can specify which escalation rules apply:

```typescript
{
  id: 'sla-critical',
  severity: 'critical',
  responseTime: 15 * 60 * 1000,    // 15 minutes
  resolutionTime: 4 * 60 * 60 * 1000, // 4 hours
  escalationTime: 30 * 60 * 1000,   // 30 minutes
  escalationRules: [
    'escalation-critical-breach',
    'escalation-auto-approve',
    'escalation-webhook'
  ]
}
```

### Custom Escalation Rules

Create custom rules with:
- **Trigger conditions**: breach, at-risk, time-threshold, manual
- **Severity filters**: Which incident severities apply
- **Breach type filters**: Response, resolution, or both
- **Threshold values**: Percentage or time-based thresholds
- **Action sequences**: Ordered list of actions to execute
- **Cooldown periods**: Prevent repeated executions
- **Max executions**: Limit total runs per incident

## Integration with Existing Features

### Knowledge Base
- Breached incidents can generate knowledge articles
- Similar incidents surface automatically
- Resolution patterns are documented

### Agent Collaboration
- Escalation can trigger multi-agent workflows
- Auto-approval bypasses confidence thresholds
- Priority routing to specialized agents

### Notification System
- Escalation uses existing notification channels
- Team preferences are respected
- External webhooks supported

### Priority Queue
- Breached incidents move to front of queue
- Severity upgrades affect queue position
- Escalation count influences prioritization

## Best Practices

1. **Start Conservative**: Begin with default rules, adjust based on actual breach patterns
2. **Monitor Execution**: Review the performance tab weekly to optimize rules
3. **Set Appropriate Cooldowns**: Prevent notification fatigue with reasonable cooldown periods
4. **Test Escalations**: Use the "Load Sample Data" feature to see escalations in action
5. **Document Customizations**: Add clear descriptions when creating custom rules
6. **Review Failed Executions**: Investigate and fix failed actions promptly
7. **Adjust SLA Targets**: Ensure policies are realistic based on compliance metrics

## Troubleshooting

### Escalation Not Triggering

- Check rule is enabled
- Verify incident severity matches rule conditions
- Confirm breach type matches rule filters
- Check if cooldown period is active
- Verify max executions not reached

### Action Failures

- Review execution detail for error messages
- Check notification settings are configured
- Verify external webhook URLs are accessible
- Ensure team assignments are valid

### Performance Issues

- Review rule complexity and action count
- Check for duplicate or conflicting rules
- Monitor cooldown periods for optimal spacing
- Consider disabling unnecessary rules

## Future Enhancements

Planned features for upcoming releases:
- Custom action types via plugins
- Machine learning-based escalation suggestions
- Integration with PagerDuty, Opsgenie, and ServiceNow
- SMS and phone call notifications
- Escalation playbooks with branching logic
- A/B testing for escalation strategies
