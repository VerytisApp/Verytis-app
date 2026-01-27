// ICARE Admin Console - Mock Data

export const MOCK_DECISION_METRICS = {
    last7Days: 142,
    pendingReview: 18,
    avgValidationTime: '4.2h',
    withoutOwner: 3
};

export const MOCK_RISK_METRICS = {
    missingMarkers: 5,
    noFollowUp: 12,
    inactiveWithProjects: 2,
    emailDelayAggregated: '+24h'
};

export const MOCK_CHANNELS = [
    { id: 101, name: '#legal-approvals', platform: 'slack', status: 'active', decisions: 45, lastActive: '2023-10-27T10:30:00', members: 14, team: 'Finance & Legal', type: 'Public', created: '2023-01-15', scope: 'Full Audit' },
    { id: 102, name: '#procurement-q4', platform: 'slack', status: 'active', decisions: 12, lastActive: '2023-10-27T09:15:00', members: 8, team: 'Finance & Legal', type: 'Private', created: '2023-03-10', scope: 'Decisions Only' },
    { id: 103, name: 'Exec Committee', platform: 'teams', status: 'active', decisions: 8, lastActive: '2023-10-26T16:45:00', members: 6, team: 'Executive', type: 'Private', created: '2022-11-05', scope: 'Full Audit' },
    { id: 104, name: '#product-roadmap', platform: 'slack', status: 'paused', decisions: 156, lastActive: '2023-10-20T11:00:00', members: 42, team: 'Engineering', type: 'Public', created: '2022-08-20', scope: 'Full Audit' },
    { id: 105, name: 'Compliance Review', platform: 'teams', status: 'active', decisions: 3, lastActive: '2023-10-27T08:00:00', members: 12, team: 'Finance & Legal', type: 'Public', created: '2023-05-12', scope: 'Docs Only' },
];

export const MOCK_TEAMS = [
    { id: 1, name: 'Engineering & Product', description: 'Core product development and R&D', channels: 2, members: 14, managers: 2, created: '2023-01-15', status: 'Active', type: 'Operational', scopes: ['audit', 'docs'] },
    { id: 2, name: 'Finance & Legal', description: 'Corporate auditing and compliance', channels: 3, members: 6, managers: 1, created: '2023-02-10', status: 'Active', type: 'Governance', scopes: ['audit', 'export'] }
];

export const MOCK_TIMELINE_EVENTS = [
    { id: 1, type: 'decision', timestamp: '2023-10-27T10:30:00', actor: 'Sarah Jenkins', role: 'CFO', action: 'Approved Decision', target: 'Budget Increase Q4', platform: 'slack', channelId: 101, channelName: '#legal-approvals', meta: 'Manual Validation' },
    { id: 2, type: 'system', timestamp: '2023-10-27T10:00:00', actor: 'System', role: 'Auto', action: 'Channel Linked', target: 'Audit Scope: Finance', platform: 'slack', channelId: 102, channelName: '#procurement-q4', meta: 'Config Change' },
    { id: 3, type: 'doc_metadata', timestamp: '2023-10-27T09:45:00', actor: 'System', role: 'Auto', action: 'File Uploaded', target: 'SharePoint/Finance', platform: 'teams', channelId: 105, channelName: 'Compliance Review', meta: 'Metadata Only' },
    { id: 4, type: 'member', timestamp: '2023-10-27T09:00:00', actor: 'Michael Thorne', role: 'Analyst', action: 'Joined Channel', target: 'User Added', platform: 'slack', channelId: 101, channelName: '#legal-approvals', meta: 'Access Granted' },
    { id: 5, type: 'decision', timestamp: '2023-10-26T16:20:00', actor: 'Legal Counsel', role: 'Legal', action: 'Flagged Risk', target: 'Contract Clause 4.2', platform: 'slack', channelId: 101, channelName: '#legal-approvals', meta: 'Risk: High' },
    { id: 6, type: 'system', timestamp: '2023-10-26T14:00:00', actor: 'Admin', role: 'SysAdmin', action: 'Audit Policy Update', target: 'Retention: 90 Days', platform: 'teams', channelId: 103, channelName: 'Exec Committee', meta: 'Policy' },
];

export const MOCK_CONNECTED_ACCOUNTS = [
    { id: 1, firstName: 'Sarah', lastName: 'Jenkins', title: 'CFO', department: 'Finance', email: 's.jenkins@icare.corp', provider: 'Microsoft 365', status: 'Active' },
    { id: 2, firstName: 'David', lastName: 'Chen', title: 'Product Manager', department: 'Product', email: 'd.chen@icare.corp', provider: 'Google Workspace', status: 'Active' },
    { id: 3, firstName: 'Elena', lastName: 'Ross', title: 'Senior Counsel', department: 'Legal', email: 'e.ross@icare.corp', provider: 'Microsoft 365', status: 'Authorization Revoked' },
    { id: 4, firstName: 'Michael', lastName: 'Thorne', title: 'Analyst', department: 'Finance', email: 'm.thorne@icare.corp', provider: 'Microsoft 365', status: 'Connection Error' },
    { id: 5, firstName: 'Amara', lastName: 'Singh', title: 'CTO', department: 'Engineering', email: 'a.singh@icare.corp', provider: 'Google Workspace', status: 'Active' },
];

export const MOCK_USERS = [
    { id: 1, name: 'Sarah Jenkins', email: 's.jenkins@icare.corp', role: 'Admin', status: 'Active', auditEnabled: true, channels: 12, initials: 'SJ' },
    { id: 2, name: 'David Chen', email: 'd.chen@icare.corp', role: 'Manager', status: 'Active', auditEnabled: true, channels: 5, initials: 'DC' },
    { id: 3, name: 'Elena Ross', email: 'e.ross@icare.corp', role: 'Employee', status: 'Active', auditEnabled: false, channels: 2, initials: 'ER' },
    { id: 4, name: 'Michael Thorne', email: 'm.thorne@icare.corp', role: 'Employee', status: 'Pending', auditEnabled: false, channels: 0, initials: 'MT' },
];

export const MOCK_SECURITY_LOGS = [
    { id: 1, event: 'Export Generated', user: 'Sarah Jenkins', details: 'Decision Audit (PDF)', time: '2 mins ago' },
    { id: 2, event: 'Role Changed', user: 'Sarah Jenkins', details: 'Promoted D. Chen to Manager', time: '4 hours ago' },
    { id: 3, event: 'Login', user: 'David Chen', details: 'IP 192.168.1.55', time: '5 hours ago' },
];

export const MOCK_CHANNEL_MEMBERS = [
    { id: 'u1', name: 'Sarah Jenkins', role: 'Admin' },
    { id: 'u2', name: 'David Chen', role: 'Manager' },
    { id: 'u3', name: 'Elena Ross', role: 'Counsel' },
    { id: 'u4', name: 'Michael Thorne', role: 'Analyst' },
];

export const SCOPES_CONFIG = [
    { title: "Channel Audit", desc: "Access full history of linked channels" },
    { title: "Documentation Audit", desc: "Extract docs for compliance review" },
    { title: "Email Audit", desc: "View metadata for team mailboxes" },
    { title: "Reports & Exports", desc: "Generate PDF/CSV audit reports" },
];

export const MOCK_RECENT_DECISIONS = [
    { id: 1, title: 'Budget Increase Q4', date: '2023-10-27', status: 'Validated', author: 'SJ', type: 'Financial' },
    { id: 2, title: 'Vendor Selection: Acme Corp', date: '2023-10-25', status: 'Pending', author: 'DC', type: 'Operational' },
    { id: 3, title: 'Policy Update v2.1', date: '2023-10-20', status: 'Validated', author: 'SJ', type: 'Compliance' },
    { id: 4, title: 'Hiring Freeze Exception', date: '2023-10-18', status: 'Rejected', author: 'ER', type: 'HR' },
];

export const MOCK_CHANNEL_ACTIVITY = [
    { id: 1, type: 'decision_validated', text: 'Decision validated: Budget Increase Q4', time: '2 hours ago', iconType: 'CheckCircle' },
    { id: 2, type: 'decision_created', text: 'New decision proposed: Q1 Roadmap', time: '5 hours ago', iconType: 'GitCommit' },
    { id: 3, type: 'member_joined', text: 'Michael Thorne joined the channel', time: '1 day ago', iconType: 'UserPlus' },
    { id: 4, type: 'doc_upload', text: 'Document indexed: Financial_Report.pdf', time: '2 days ago', iconType: 'FileText' },
];
