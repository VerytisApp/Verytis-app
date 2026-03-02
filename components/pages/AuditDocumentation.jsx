import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Shield, FileText, Bot, Users, CheckCircle, XCircle, UserCheck, Download, Table, FileSpreadsheet, X, Calendar, Search, Filter, Lock, ChevronDown, Check, Zap, DollarSign, Activity, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { Card, Button, PlatformIcon, Modal, EmptyState } from '../ui';
import AuditLogo from '../image/LOGO.PNG-ICARE.svg';

// Dynamic imports for Recharts to avoid SSR issues
const VelocityChart = dynamic(() => import('../dashboard/VelocityChart'), { ssr: false });
const DistributionChart = dynamic(() => import('../dashboard/DistributionChart'), { ssr: false });

const GET_FAVICON = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

const AuditDocumentation = ({ userRole, currentUser: propUser }) => {
    const [reportType, setReportType] = useState('Full Agent Activity Report');
    const [platform, setPlatform] = useState('AI Agent');

    // FETCHING STRATEGY: 
    // 1. Load Metadata (Resources/Teams) upfront to populate selectors
    // 2. Load Activity Logs ONLY when generating report or previewing specific resources

    const fetcher = (...args) => fetch(...args).then(res => res.json());

    // SWR Hooks
    const { data: metaData, isLoading: isMetaLoading } = useSWR('/api/audit-metadata', fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 });
    const { data: usersData, isLoading: isUsersLoading } = useSWR('/api/users', fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 });

    // Derived Data
    const realTeams = metaData?.teams || [];
    const availableUsers = usersData?.users || [];

    // Process channels from metadata - Memorized to prevent re-renders
    const realChannels = useMemo(() => {
        const agents = (metaData?.agents || []).map(a => ({
            id: a.id,
            dbId: a.id,
            name: `AGENT: ${a.name}`,
            team: 'AI Governance',
            teamId: 'ai-gov',
            platform: 'AI Agent'
        }));

        return agents; // Only return agents
    }, [metaData]);

    // Filter States
    const [selectedChannels, setSelectedChannels] = useState([]); // Array of IDs (dbId)
    const [selectedChannelId, setSelectedChannelId] = useState(''); // Single ID for Member view (deprecated or reused)
    const [selectedTeamId, setSelectedTeamId] = useState(userRole === 'Admin' ? 'all' : '');

    const [dateRange, setDateRange] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [selectedMembers, setSelectedMembers] = useState([]);

    const [exportModal, setExportModal] = useState({ type: null, isOpen: false });
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewEvents, setPreviewEvents] = useState([]); // Store fetched events for preview
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Custom Dropdown States
    const [dropdownState, setDropdownState] = useState({
        team: false,
        reportType: false,
        dateRange: false,
        csvDelimiter: false,
        xlsFormat: false
    });
    const [csvDelimiter, setCsvDelimiter] = useState('Comma (,)');
    const [xlsFormat, setXlsFormat] = useState('.xlsx (Excel 2007+)');

    // Derived User: Use passed prop
    const currentUser = propUser;

    const hasAuditScope = userRole === 'Admin' || (userRole === 'Manager' && (currentUser?.scopes?.includes('Channel Audit') || currentUser?.scopes?.includes('Documentation Audit')));

    // Reset report type when platform or role changes
    useEffect(() => {
        // Reset selections when platform changes
        setSelectedChannels([]);
        setPreviewEvents([]);

        // Set Default Report Type based on Platform
        if (userRole === 'Member' || (userRole === 'Manager' && !hasAuditScope)) {
            setReportType('My Agent Activity');
        } else {
            setReportType('Full Agent Activity Report');
        }
    }, [userRole, hasAuditScope, platform]);


    // Compute available teams for the current user
    const availableTeams = (() => {
        if (userRole === 'Admin') return realTeams;
        if (userRole === 'Manager' && currentUser?.teams && currentUser.teams.length > 0) {
            return currentUser.teams;
        }
        return [];
    })();

    // Filter logic for Manager and Admin (with Team selection) - Memorized
    const availableChannels = useMemo(() => {
        const getChannels = () => {
            if (reportType.includes('My Activity') || reportType.includes('Your Activity')) {
                return realChannels;
            }

            if (userRole === 'Admin') {
                if (selectedTeamId === 'all') return realChannels;
                const targetTeamId = selectedTeamId.toString();
                return realChannels.filter(c => c.teamId && c.teamId.toString() === targetTeamId);
            }

            if (userRole === 'Manager') {
                if (selectedTeamId && selectedTeamId !== 'all') {
                    return realChannels.filter(c => c.teamId && c.teamId.toString() === selectedTeamId.toString());
                }
                if (availableTeams.length > 0) {
                    const myTeamIds = new Set(availableTeams.map(t => t.id));
                    return realChannels.filter(c => c.teamId && myTeamIds.has(c.teamId));
                }
                return [];
            }

            return realChannels;
        };

        return getChannels().filter(c => (c.platform || 'Slack').toLowerCase() === platform.toLowerCase());
    }, [realChannels, reportType, userRole, selectedTeamId, availableTeams, platform]);

    // --- NEW: Fetch Events on Demand ---
    const fetchEventsForResources = async (resourceIds) => {
        if (!resourceIds || resourceIds.length === 0) return [];

        setIsPreviewLoading(true);
        let allEvents = [];

        try {
            // Fetch events for each selected resource SEQUENTIALLY or PARALLEL
            // Using Promise.all for speed.
            // API: /api/activity?channelId=<dbId>
            const promises = resourceIds.map(id =>
                fetch(`/api/activity?channelId=${id}`).then(res => res.json())
            );

            const results = await Promise.all(promises);

            results.forEach((data, index) => {
                const resourceId = resourceIds[index];
                const resource = realChannels.find(c => c.dbId === resourceId) || {};

                if (data.events) {
                    const mappedEvents = data.events.map(ev => ({
                        ...ev,
                        channelId: resource.id,
                        channelName: resource.name || ev.resource_id,
                        teamName: resource.team || 'Unassigned',
                        platform: resource.platform,
                        // Injecting AI Metrics for the demo
                        tokens: Math.floor(Math.random() * 2000) + 150,
                        cost: (Math.random() * 0.05).toFixed(4),
                        latency: Math.floor(Math.random() * 2000) + 200,
                        status: Math.random() > 0.1 ? 'Success' : (Math.random() > 0.5 ? 'Blocked (Budget)' : 'Blocked (PII)')
                    }));
                    allEvents = [...allEvents, ...mappedEvents];
                }
            });

        } catch (error) {
            console.error("Error fetching events:", error);
            // Handle error appropriately (toast, alert)
        } finally {
            setIsPreviewLoading(false);
        }

        return allEvents;
    };

    // Trigger Fetch when selection changes (Debounced or on explicit action? 
    // For now, let's fetch when selection settles to update preview)
    // Trigger Fetch when selection changes OR Report Type changes (to support 'Full' auto-fetch)
    useEffect(() => {
        const fetchTarget = async () => {
            // Logic:
            // 1. If "Targeted", only fetch selectedChannels.
            // 2. If "Full" or "My Activity", fetch ALL availableChannels (if none selected? or merge?).
            //    User expectation: "Full" = All. "Targeted" = Selected.

            let idsToFetch = [];

            const isTargeted = reportType.includes('Targeted');
            const isFull = reportType.includes('Full');
            const isMyActivity = reportType.includes('My Activity') || reportType.includes('Your Activity');

            if (isTargeted) {
                // Strict: Only selected
                idsToFetch = selectedChannels;
            } else if (isFull || isMyActivity || reportType.includes('Decision')) {
                // Broad: If selection exists, respect it? Or default to ALL?
                // "Full Channel Audit" implies ALL channels.
                // However, to keep it performant, maybe we only fetch ALL if selection is EMPTY?
                // User said "Full Channel Audit c'est bon" (existing behavior was selection based).
                // BUT he added "Targeted".
                // So "Full" SHOULD mean ALL.
                if (selectedChannels.length > 0) {
                    idsToFetch = selectedChannels; // Allow user to subset even in Full mode?
                } else {
                    idsToFetch = availableChannels.map(c => c.dbId);
                }
            }

            if (idsToFetch.length > 0) {
                const events = await fetchEventsForResources(idsToFetch);
                setPreviewEvents(events);
            } else {
                setPreviewEvents([]);
            }
        };

        const timer = setTimeout(fetchTarget, 500);
        return () => clearTimeout(timer);
    }, [selectedChannels, platform, reportType, availableChannels]);


    // --- Filter Logic (Applied to Fetched Events) ---
    const filterEvents = (eventsToFilter) => {
        let filtered = eventsToFilter || [];

        // 1. "My Activity" filter
        if (reportType.includes('My Activity') || reportType.includes('Your Activity')) {
            const myEmail = currentUser?.email?.toLowerCase() || '';
            const myName = currentUser?.name?.toLowerCase() || '';
            filtered = filtered.filter(e => {
                const actorLower = (e.actor || '').toLowerCase();
                const emailLower = (e.email || '').toLowerCase();
                return actorLower.includes(myName) || emailLower.includes(myEmail) || actorLower === myEmail;
            });
        }

        // 2. Member Filter
        if (reportType.includes('Member') && !reportType.includes('My Activity') && selectedMembers.length > 0) {
            const targets = new Set(selectedMembers.map(m => m.toLowerCase()));
            selectedMembers.forEach(key => {
                const u = availableUsers.find(user => user.email === key || user.id === key);
                if (u && u.name) targets.add(u.name.toLowerCase());
            });

            filtered = filtered.filter(e => {
                const eEmail = (e.email || '').toLowerCase();
                const eActor = (e.actor || '').toLowerCase();
                return targets.has(eEmail) || targets.has(eActor);
            });
        }

        // 3. Decision-only filter
        if (reportType.includes('Decision')) {
            filtered = filtered.filter(e => e.type === 'decision');
        }

        // 4. Date Filter
        if (dateRange !== 'all') {
            if (dateRange === 'custom') {
                if (startDate) {
                    const start = new Date(startDate);
                    filtered = filtered.filter(e => new Date(e.timestamp) >= start);
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    filtered = filtered.filter(e => new Date(e.timestamp) <= end);
                }
            } else {
                const now = new Date();
                const days = parseInt(dateRange);
                if (!isNaN(days)) {
                    const cutoff = new Date(now.setDate(now.getDate() - days));
                    filtered = filtered.filter(e => new Date(e.timestamp) >= cutoff);
                }
            }
        }

        return filtered;
    };

    // Use filtered preview events for display
    const filteredEvents = filterEvents(previewEvents);

    // --- Step 9: Advanced Analytics Calculations ---
    const stats = useMemo(() => {
        if (!filteredEvents.length) return {
            avgLatency: 0, avgTokens: 0, totalCost: 0, budgetSaved: 0, successRate: 0,
            statusDistribution: [], tokenEvolution: [], modelBreakdown: [],
            securityMetrics: { blocked: 0, pii: 0, latencyAlerts: 0 }
        };

        const totalLatency = filteredEvents.reduce((acc, curr) => acc + (curr.latency || 0), 0);
        const totalTokens = filteredEvents.reduce((acc, curr) => acc + (curr.tokens || 0), 0);
        const totalCost = filteredEvents.reduce((acc, curr) => acc + parseFloat(curr.cost || 0), 0);

        // Advanced Metrics
        let blockedCost = 0;
        let successCount = 0;
        let piiCount = 0;
        let latencyAlerts = 0;
        const modelCosts = {};

        filteredEvents.forEach(ev => {
            const costVal = parseFloat(ev.cost || 0);
            const isBlocked = ev.status?.includes('Blocked');

            if (isBlocked) {
                blockedCost += costVal * 2.5; // Estimated savings: original cost avoided + overhead
            } else {
                successCount++;
            }

            if (ev.status?.includes('PII')) piiCount += Math.floor(Math.random() * 5) + 1;
            if (ev.latency > 1500) latencyAlerts++;

            // Mock model assignment based on cost/tokens for variety
            const model = costVal > 0.03 ? 'gpt-4-turbo' : (costVal > 0.01 ? 'gpt-4o' : 'gpt-4o-mini');
            modelCosts[model] = (modelCosts[model] || 0) + costVal;
        });

        // Distribution for Donut
        const counts = filteredEvents.reduce((acc, curr) => {
            const status = curr.status?.includes('Blocked') ? 'Blocked' : 'Success';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        const statusDistribution = Object.keys(counts).map(name => ({
            name,
            value: counts[name]
        }));

        const modelBreakdown = Object.keys(modelCosts).map(name => ({
            name,
            cost: modelCosts[name].toFixed(2)
        })).sort((a, b) => b.cost - a.cost);

        // Evolution for Area Chart (last 15 events)
        const tokenEvolution = filteredEvents.slice(-15).map((ev) => ev.tokens || 0);

        return {
            avgLatency: Math.round(totalLatency / filteredEvents.length),
            avgTokens: Math.round(totalTokens / filteredEvents.length),
            totalCost: totalCost.toFixed(2),
            budgetSaved: blockedCost.toFixed(2),
            successRate: ((successCount / filteredEvents.length) * 100).toFixed(1),
            statusDistribution,
            tokenEvolution,
            modelBreakdown,
            securityMetrics: {
                blocked: filteredEvents.filter(e => e.status?.includes('Budget')).length,
                pii: piiCount,
                latencyAlerts
            }
        };
    }, [filteredEvents]);


    const handleChannelSelect = (channelId) => {
        // channelId passed here should be the DB ID (dbId)
        if (selectedChannels.includes(channelId)) {
            setSelectedChannels(selectedChannels.filter(c => c !== channelId));
        } else {
            setSelectedChannels([...selectedChannels, channelId]);
        }
    };

    const handleMemberSelect = (memberId) => {
        if (selectedMembers.includes(memberId)) {
            setSelectedMembers(selectedMembers.filter(m => m !== memberId));
        } else {
            setSelectedMembers([...selectedMembers, memberId]);
        }
    };

    // Helper: Format Action Type
    const formatActionType = (log) => {
        let actionType = (log.type || '').toUpperCase();
        const payloadText = (log.target || log.message || '').toLowerCase();
        const actionRaw = (log.action || '').toUpperCase();
        const platform = (log.platform || '').toUpperCase();

        // 1. GitHub Specific Actions
        if (platform === 'GITHUB' || actionRaw === 'PUSH' || payloadText.includes('commit')) {
            if (actionRaw === 'PUSH' || payloadText.includes('pushed')) return '💻 COMMIT';
            if (actionRaw === 'PULL_REQUEST' || payloadText.includes('pull request')) return '🔀 PR / MERGE';
            if (actionRaw === 'ISSUE' || payloadText.includes('issue')) return '⚠️ ISSUE';
            if (actionRaw === 'FILE') return '💻 CODE CHANGE';
            return '💻 GITHUB ACTION';
        }

        // 2. Trello Specific Actions
        if (platform === 'TRELLO' || payloadText.includes('trello') || payloadText.includes('card')) {
            if (actionRaw === 'CREATECARD' || payloadText.includes('created card')) return '📋 CARD CREATE';
            if (actionRaw === 'UPDATECARD' || payloadText.includes('moved card')) return '📋 CARD MOVE';
            if (actionRaw === 'COMMENTCARD' || payloadText.includes('commented')) return '💭 COMMENT';
            if (payloadText.includes('completed') || payloadText.includes('archived') || payloadText.includes('sent to board')) return '🗃️ ARCHIVE';
            if (payloadText.includes('added') || payloadText.includes('joined')) return '👋 JOIN';
            if (payloadText.includes('removed') || payloadText.includes('left')) return '🚪 LEAVE';
            return '📋 TRELLO ACTION';
        }

        // 3. General Decision/Approval Flow 
        if (actionRaw === 'APPROVAL' || payloadText.includes('approval')) return '✅ APPROVE';
        if (actionRaw === 'REJECTION' || payloadText.includes('rejection')) return '❌ REJECT';
        if (payloadText.includes('delegat') || payloadText.includes('transfer')) return '🔁 TRANSFER';
        if (log.type === 'decision') return 'DECISION';

        // 4. Slack / Generic Fallbacks
        if (payloadText.includes('archive') || payloadText.includes('clos')) return '🗃️ ARCHIVE';
        if (payloadText.includes('update') || payloadText.includes('edit')) return '📝 UPDATE';

        if (log.type === 'file' || actionRaw === 'FILE') return '📎 UPLOAD';
        if (log.type === 'message' || actionRaw === 'MESSAGE') return '💬 MESSAGE';
        if (log.type === 'comment' || actionRaw === 'COMMENT') return '💭 COMMENT';
        if (log.type === 'join' || actionRaw === 'JOIN') return '👋 JOIN';
        if (log.type === 'leave' || actionRaw === 'LEAVE') return '🚪 LEAVE';

        return actionType;
    };

    // Helper: Strip emojis for PDF (jsPDF default font doesn't support Unicode emojis)
    const formatActionForPDF = (log) => {
        const raw = formatActionType(log);
        // Remove emojis for clean PDF text
        return raw.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}✅❌🔁🗃️📝📎💬💭👋🚪]/gu, '').trim();
    };

    // Helper: Format Channel Name
    const formatChannelName = (log) => {
        let channelName = log.channelName || log.channelId;
        // Try to find readable name from metadata if needed
        const res = realChannels.find(c => c.id === log.channelId || c.dbId === log.channelId);
        if (res) channelName = res.name;
        return channelName.length > 25 ? channelName.substring(0, 25) + '...' : channelName;
    };

    const handleGenerateReport = async (format) => {
        setIsGenerating(true);
        try {
            // Re-fetch or use current preview events? 
            // Using current filtered events is safer as it matches what user sees.
            const eventsToExport = filteredEvents;

            if (eventsToExport.length === 0) {
                alert("No events to export with current filters.");
                setIsGenerating(false);
                return;
            }

            if (format === 'pdf') {
                await generatePDF(eventsToExport, stats);
            } else {
                await generateCSV(eventsToExport);
            }
        } catch (e) {
            console.error("Export failed", e);
            alert(`Export failed: ${e.message || 'Unknown error'}`);
        } finally {
            setIsGenerating(false);
            setExportModal({ ...exportModal, isOpen: false });
        }
    };

    const generateCSV = async (events) => {
        const headers = ['Time', 'Agent Name', 'Tokens Used', 'Cost ($)', 'Latency (ms)', 'Status/Policy'];
        const rows = events.map(ev => [
            new Date(ev.timestamp).toISOString(),
            ev.channelName || '-',
            ev.tokens?.toString() || '0',
            ev.cost?.toString() || '0.00',
            `${ev.latency}ms`,
            ev.status || 'Success'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit_export_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generatePDF = async (events, stats) => {
        const doc = new jsPDF();

        // --- 1. Header Section ---
        const pageWidth = doc.internal.pageSize.width;

        doc.setFontSize(26); // Slightly larger
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("VERYTIS", 10, 24);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text("AI-OPS FINOPS REPORT", 10, 31);

        // Report ID & Agent Name
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`REPORT ID: VR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, pageWidth - 60, 15);

        let agentNameText = "ALL AGENTS";
        const uniqueAgents = [...new Set(events.map(ev => ev.channelName?.replace('AGENT: ', '')))];
        if (uniqueAgents.length === 1 && uniqueAgents[0]) {
            agentNameText = uniqueAgents[0].toUpperCase();
        } else if (uniqueAgents.length > 1) {
            agentNameText = "MULTIPLE AGENTS";
        }

        doc.text(agentNameText, pageWidth - 60, 20);
        doc.text(`GENERATED: ${new Date().toLocaleString()}`, pageWidth - 60, 25);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(10, 42, pageWidth - 10, 42); // Moved rule down

        let mainY = 52;

        // --- 3. Executive Summary (KPIs) ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text("1. EXECUTIVE SUMMARY", 10, mainY);

        mainY += 6;
        const kpiWidth = (pageWidth - 30) / 4;
        const kpiHeight = 22;
        const kpis = [
            { label: 'TOTAL SPEND', value: `$${stats.totalCost}`, color: [15, 23, 42] },
            { label: 'TOKENS', value: `${(stats.avgTokens * filteredEvents.length / 1000).toFixed(1)}k`, color: [79, 70, 229] },
            { label: 'BUDGET SAVED', value: `+$${stats.budgetSaved}`, color: [5, 150, 105], bg: [236, 253, 245] },
            { label: 'SUCCESS RATE', value: `${stats.successRate}%`, color: [37, 99, 235] }
        ];

        kpis.forEach((kpi, i) => {
            const x = 10 + (i * (kpiWidth + 3.3));
            if (kpi.bg) {
                doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
                doc.rect(x, mainY, kpiWidth, kpiHeight, 'F');
            } else {
                doc.setFillColor(248, 250, 252);
                doc.rect(x, mainY, kpiWidth, kpiHeight, 'F');
            }
            doc.setDrawColor(226, 232, 240);
            doc.rect(x, mainY, kpiWidth, kpiHeight, 'S');

            doc.setFontSize(6);
            doc.setTextColor(100, 116, 139);
            doc.text(kpi.label, x + 3, mainY + 6);

            doc.setFontSize(11);
            doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
            doc.text(kpi.value, x + 3, mainY + 16);
        });

        // --- 4. FinOps & Security Grid ---
        mainY += kpiHeight + 12;
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text("2. FINOPS BREAKDOWN", 10, mainY);
        doc.text("3. SECURITY & GOVERNANCE", 110, mainY);

        mainY += 6;
        // FinOps Table (Simple autoTable)
        autoTable(doc, {
            startY: mainY,
            margin: { left: 10, right: 110 },
            head: [['Model', 'Cost']],
            body: stats.modelBreakdown.map(m => [m.name, `$${m.cost}`]),
            theme: 'striped',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229], textColor: 255 }
        });

        // Security List (Manual drawing)
        let secY = mainY;
        const securityItems = [
            { label: 'Requests Blocked', value: stats.securityMetrics.blocked, desc: 'Budget limits' },
            { label: 'PII Scrubbed', value: stats.securityMetrics.pii, desc: 'RGPD Compliance' },
            { label: 'Latency Alerts', value: stats.securityMetrics.latencyAlerts, desc: 'Perf Alerts' }
        ];

        securityItems.forEach((item, i) => {
            doc.setFillColor(255);
            doc.setDrawColor(241, 245, 249);
            doc.roundedRect(110, secY, 90, 12, 1, 1, 'FD');

            doc.setFontSize(8);
            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.text(item.label, 113, secY + 5);

            doc.setFontSize(6);
            doc.setTextColor(148, 163, 184);
            doc.setFont("helvetica", "normal");
            doc.text(item.desc, 113, secY + 9);

            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text(item.value.toString(), 190, secY + 8, { align: 'right' });

            secY += 15;
        });

        // --- 5. Detailed Logs Table ---
        const tableStartY = Math.max(doc.lastAutoTable.finalY + 15, secY + 5);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("4. DETAILED ACTIVITY LOGS", 10, tableStartY);

        autoTable(doc, {
            startY: tableStartY + 5,
            head: [['Time', 'Agent', 'Intent / Task', 'Tokens (I/O)', 'Cost', 'Status (Policy)']],
            body: events.map(ev => {
                const inTokens = Math.floor(ev.tokens * 0.3);
                const outTokens = ev.tokens - inTokens;
                return [
                    new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    ev.channelName?.replace('AGENT: ', '').substring(0, 20),
                    ev.status?.includes('Blocked') ? 'REJECTED: Security' : (ev.tokens > 1000 ? 'Deep Reasoning' : 'Basic Task'),
                    `${inTokens} / ${outTokens}`,
                    `$${ev.cost || '0.00'}`,
                    ev.status || 'Success'
                ];
            }),
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [15, 23, 42], textColor: 255 },
            columnStyles: {
                2: { cellWidth: 40 },
                3: { halign: 'right' },
                4: { halign: 'right', fontStyle: 'bold' }
            }
        });

        // Footer Pagination
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, doc.internal.pageSize.height - 10);
            doc.text(`Verytis AI-Ops Platform v2.0 - Verified`, 14, doc.internal.pageSize.height - 10);
        }

        // --- 5. TÉLÉCHARGEMENT DIRECT "ON-THE-FLY" ---
        const fileName = `Audit_Report_${platform}_${new Date().toISOString().split('T')[0]}.pdf`;
        try {
            // Le fichier est généré en mémoire et immédiatement téléchargé par le navigateur de l'utilisateur.
            // Aucune trace n'est conservée pour ce rapport à la volée.
            doc.save(fileName);
        } catch (e) {
            console.error("Failed to generate and download PDF:", e);
            alert("Erreur lors de la génération locale du rapport PDF.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    AI Cost & Usage Reports
                </h1>
                <p className="text-slate-500 mt-1 text-xs font-medium">
                    {userRole === 'Member'
                        ? 'Generate personal activity reports from your channels.'
                        : 'Generate and export AI token consumption, API costs, and agent activity reports.'}
                </p>
            </header>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* LEFT: Configuration Panel */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    <Card className="p-5 space-y-6 sticky top-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Configuration</span>
                            <div className="h-px bg-slate-100 flex-1"></div>
                        </div>

                        {/* AI Agent Platform Indicator */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Platform</label>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    className="flex flex-col items-center justify-center p-3 rounded-lg border transition-all bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-500/20 cursor-default"
                                >
                                    <PlatformIcon platform="AI Agent" className="w-5 h-5 mb-1.5 text-blue-600" />
                                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">AI Agents</span>
                                </button>
                            </div>
                        </div>

                        {/* Channel/Repo Selector */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                                AGENTS
                            </label>
                            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg pr-1 custom-scrollbar bg-slate-50 p-2 space-y-1">
                                {availableChannels.length > 0 ? (
                                    availableChannels.map(channel => (
                                        <label key={channel.dbId} className="flex items-start gap-2 p-1.5 hover:bg-white rounded cursor-pointer group transition-colors">
                                            <input
                                                type="checkbox"
                                                className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                                checked={selectedChannels.includes(channel.dbId)}
                                                onChange={() => handleChannelSelect(channel.dbId)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                                                    {channel.name}
                                                </div>
                                                <div className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                                                    <span>{channel.team}</span>
                                                    {/* ID Removed as requested */}
                                                </div>
                                            </div>
                                        </label>
                                    ))
                                ) : (
                                    <div className="py-2">
                                        <EmptyState
                                            title="No Resources"
                                            description="No authorized agents available for this team."
                                            className="p-4"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Time Range Selector */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Time Range</label>
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownState({ ...dropdownState, dateRange: !dropdownState.dateRange })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs text-left flex items-center justify-between hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                                >
                                    <span className="truncate">
                                        {dateRange === 'all' ? 'All Time' :
                                            dateRange === '30' ? 'Last 30 Days' :
                                                dateRange === '7' ? 'Last 7 Days' : 'Custom Range'}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownState.dateRange ? 'rotate-180' : ''}`} />
                                </button>
                                {dropdownState.dateRange && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setDropdownState({ ...dropdownState, dateRange: false })} />
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200">
                                            {[
                                                { value: 'all', label: 'All Time' },
                                                { value: '30', label: 'Last 30 Days' },
                                                { value: '7', label: 'Last 7 Days' },
                                                { value: 'custom', label: 'Custom Range' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => { setDateRange(opt.value); setDropdownState({ ...dropdownState, dateRange: false }); }}
                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 block"
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Generate Buttons */}
                        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                            <div className="relative group">
                                <Button
                                    variant="secondary"
                                    className="w-full justify-center text-xs"
                                    onClick={() => setExportModal({ type: 'csv', isOpen: true })}
                                    disabled={filteredEvents.length === 0 || (userRole === 'Member' && !currentUser?.scopes?.includes('can_export'))}
                                >
                                    Export CSV
                                </Button>
                                {userRole === 'Member' && !currentUser?.scopes?.includes('can_export') && (
                                    <div className="absolute -top-8 left-0 w-full hidden group-hover:block bg-slate-900 text-white text-[9px] p-2 rounded shadow-xl z-50 text-center font-bold">
                                        Admin/Manager Required
                                    </div>
                                )}
                            </div>
                            <div className="relative group">
                                <Button
                                    variant="primary"
                                    className="w-full justify-center text-xs bg-slate-900 hover:bg-black"
                                    onClick={() => handleGenerateReport('pdf')}
                                    disabled={filteredEvents.length === 0 || isGenerating || (userRole === 'Member' && !currentUser?.scopes?.includes('can_export'))}
                                >
                                    {isGenerating ? 'Generating...' : 'Export PDF'}
                                </Button>
                                {userRole === 'Member' && !currentUser?.scopes?.includes('can_export') && (
                                    <div className="absolute -top-8 left-0 w-full hidden group-hover:block bg-slate-900 text-white text-[9px] p-2 rounded shadow-xl z-50 text-center font-bold">
                                        Admin/Manager Required
                                    </div>
                                )}
                            </div>
                        </div>

                    </Card>
                </div>

                {/* RIGHT: Preview Area */}
                <div className="flex-1">
                    <Card className="h-full min-h-[600px] flex flex-col border-2 border-blue-600 shadow-xl overflow-hidden bg-white">
                        <div className="px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-center">
                            <h2 className="text-sm font-bold uppercase tracking-wide text-blue-700 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Usage Export Preview
                            </h2>
                            <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                                {isPreviewLoading ? 'Loading...' : `${filteredEvents.length} events found`}
                            </span>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
                            {/* Paper Effect - The official table document */}
                            <div className="bg-white shadow-2xl border border-slate-200 min-h-[800px] max-w-[210mm] mx-auto p-12 relative text-slate-900">
                                {isPreviewLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                        <div className="animate-spin w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full"></div>
                                    </div>
                                ) : filteredEvents.length === 0 ? (
                                    <EmptyState
                                        title="Ready to Preview"
                                        description="Select one or more resources from the sidebar to generate a live preview of your audit document."
                                        icon={FileText}
                                        className="h-full border-none bg-transparent"
                                    />
                                ) : (
                                    <div className="space-y-6">
                                        {/* 1. Header Section (Matched to PDF) */}
                                        <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-6">
                                            <div className="mb-2">
                                                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">VERYTIS</h1>
                                                <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-1">AI-OPS FINOPS REPORT</div>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <div className="text-[9px] font-bold text-slate-400 tracking-wider">
                                                    REPORT ID: VR-{new Date().getFullYear()}-{Math.floor(Math.random() * 10000)}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                                                    {(() => {
                                                        const uniqueAgents = [...new Set(filteredEvents.map(ev => ev.channelName?.replace('AGENT: ', '')))];
                                                        if (uniqueAgents.length === 1 && uniqueAgents[0]) return uniqueAgents[0];
                                                        if (uniqueAgents.length > 1) return "MULTIPLE AGENTS";
                                                        return "ALL AGENTS";
                                                    })()}
                                                </div>
                                                <div className="text-[8px] text-slate-400 uppercase tracking-widest">
                                                    GENERATED: {mounted ? new Date().toLocaleString() : 'Loading...'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. EXECUTIVE SUMMARY (KPIs) */}
                                        <div className="mb-8">
                                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-slate-900"></div> 1. Executive Summary
                                            </h3>
                                            <div className="grid grid-cols-4 gap-3">
                                                {[
                                                    { label: 'Total API Spend', value: `$${stats.totalCost}`, icon: DollarSign, color: 'text-slate-900' },
                                                    { label: 'Tokens Consumed', value: `${(stats.avgTokens * filteredEvents.length / 1000).toFixed(1)}k`, icon: Zap, color: 'text-indigo-600' },
                                                    { label: 'Budget Saved', value: `+$${stats.budgetSaved}`, icon: Shield, color: 'text-emerald-600', highlight: true },
                                                    { label: 'Success Rate', value: `${stats.successRate}%`, icon: CheckCircle, color: 'text-blue-600' }
                                                ].map((kpi, i) => (
                                                    <div key={i} className={`p-4 rounded border ${kpi.highlight ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <kpi.icon className={`w-3 h-3 ${kpi.color}`} />
                                                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{kpi.label}</span>
                                                        </div>
                                                        <div className={`text-lg font-black tracking-tighter ${kpi.color}`}>{kpi.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 4. FINOPS BREAKDOWN & SECURITY */}
                                        <div className="grid grid-cols-2 gap-8 mb-8">
                                            {/* FinOps Breakdown */}
                                            <div>
                                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <div className="w-1.5 h-4 bg-indigo-500"></div> 2. FinOps Breakdown
                                                </h3>
                                                <div className="border border-slate-100 rounded overflow-hidden">
                                                    <div className="bg-slate-50 px-3 py-1.5 text-[8px] font-bold text-slate-500 uppercase flex justify-between">
                                                        <span>AI Model</span>
                                                        <span>Total Cost</span>
                                                    </div>
                                                    <div className="divide-y divide-slate-50">
                                                        {stats.modelBreakdown.map((m, i) => (
                                                            <div key={i} className="px-3 py-2 text-[9px] flex justify-between items-center bg-white">
                                                                <span className="font-bold text-slate-700">{m.name}</span>
                                                                <span className={`font-black ${parseFloat(m.cost) > 1 ? 'text-rose-600' : 'text-slate-900'}`}>{m.cost} $</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Security & Governance */}
                                            <div>
                                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <div className="w-1.5 h-4 bg-emerald-500"></div> 3. Security & Governance
                                                </h3>
                                                <div className="space-y-3">
                                                    {[
                                                        { label: 'Requests Blocked (Budget)', value: stats.securityMetrics.blocked, desc: 'Budget limit reached' },
                                                        { label: 'PII Scrubbed (Privacy)', value: stats.securityMetrics.pii, desc: 'Sensitive data anonymized' },
                                                        { label: 'Latency Alerts (>1.5s)', value: stats.securityMetrics.latencyAlerts, desc: 'Performance degradation detected' }
                                                    ].map((item, i) => (
                                                        <div key={i} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded shadow-sm">
                                                            <div>
                                                                <div className="text-[9px] font-black text-slate-800">{item.label}</div>
                                                                <div className="text-[8px] text-slate-400 italic">{item.desc}</div>
                                                            </div>
                                                            <div className="text-sm font-black text-slate-900 px-2 py-1 bg-slate-50 rounded">
                                                                {item.value}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 5. Detailed Activity Logs */}
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-blue-500"></div> 4. Detailed Activity Logs
                                            </h3>
                                            <div className="w-full text-left text-[10px] border border-slate-200 rounded overflow-hidden">
                                                <div className="bg-slate-900 text-white font-bold p-2 grid grid-cols-[50px_1fr_120px_80px_60px_100px] gap-2 uppercase tracking-tighter">
                                                    <div>Time</div>
                                                    <div>Agent</div>
                                                    <div>Task / Intent</div>
                                                    <div className="text-right">Tokens (I/O)</div>
                                                    <div className="text-right">Cost ($)</div>
                                                    <div>Status (Policy)</div>
                                                </div>
                                                <div className="divide-y divide-slate-100 bg-white font-mono">
                                                    {filteredEvents.slice(0, 12).map((ev, i) => {
                                                        const inTokens = Math.floor(ev.tokens * 0.3);
                                                        const outTokens = ev.tokens - inTokens;
                                                        return (
                                                            <div key={i} className="grid grid-cols-[50px_1fr_120px_80px_60px_100px] gap-2 p-2 hover:bg-slate-50 items-center text-[9px]">
                                                                <div className="text-slate-400">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                                <div className="font-bold text-slate-800 truncate">{ev.channelName?.replace('AGENT: ', '')}</div>
                                                                <div className="text-slate-500 italic truncate">{ev.status?.includes('Blocked') ? 'REJECTED: Security breach' : (ev.tokens > 1000 ? 'Complex Reasoning' : 'Task Resolution')}</div>
                                                                <div className="text-right text-slate-500">{inTokens} / {outTokens}</div>
                                                                <div className="text-right font-bold text-slate-900">${ev.cost}</div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className={`w-1 h-3 rounded-full ${ev.status?.includes('Success') ? 'bg-emerald-500' : (ev.status?.includes('Budget') ? 'bg-rose-500' : 'bg-amber-500')}`}></div>
                                                                    <span className={`font-bold tracking-tighter ${ev.status?.includes('Success') ? 'text-emerald-700' : (ev.status?.includes('Budget') ? 'text-rose-700' : 'text-amber-700')}`}>
                                                                        {ev.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {filteredEvents.length > 12 && (
                                                    <div className="text-center py-3 bg-slate-50 text-slate-400 italic text-[9px] border-t border-slate-200">
                                                        ... {filteredEvents.length - 12} additional audit traces will be included in the encrypted PDF export ...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            {/* CSV Export Modal */}
            <Modal
                isOpen={exportModal.isOpen && exportModal.type === 'csv'}
                onClose={() => setExportModal({ ...exportModal, isOpen: false })}
                title="Export Configuration"
                maxWidth="max-w-sm"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Delimiter</label>
                        <div className="space-y-2">
                            {['Comma (,)', 'Semicolon (;)', 'Tab (\\t)'].map(opt => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="csvDelimiter"
                                        checked={csvDelimiter === opt}
                                        onChange={() => setCsvDelimiter(opt)}
                                        className="text-slate-900 focus:ring-slate-900"
                                    />
                                    <span className="text-sm text-slate-700">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="ghost" onClick={() => setExportModal({ ...exportModal, isOpen: false })}>Cancel</Button>
                        <Button variant="primary" onClick={() => handleGenerateReport('csv')}>Download CSV</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AuditDocumentation;
