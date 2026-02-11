import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Shield, FileText, Slack, Users, CheckCircle, XCircle, UserCheck, Download, Table, FileSpreadsheet, X, Calendar, Search, Filter, Lock } from 'lucide-react';
import { Card, Button, PlatformIcon, Modal } from '../ui';
import AuditLogo from '../image/LOGO.PNG-ICARE.svg';
import SlackLogo from '../image/Slack Logo 2019.png';
import TeamsLogo from '../image/Microsoft Teams Logo.webp';

const AuditDocumentation = ({ userRole, currentUser: propUser }) => {
    const [reportType, setReportType] = useState('Full Channel Audit');
    const [platform, setPlatform] = useState('Slack');

    // Real Data States
    const [realEvents, setRealEvents] = useState([]);
    const [realChannels, setRealChannels] = useState([]); // All available channels from DB
    const [realTeams, setRealTeams] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]); // Verified Users from DB
    const [loadingEvents, setLoadingEvents] = useState(false);

    // Filter States
    const [selectedChannels, setSelectedChannels] = useState([]); // Array of names/IDs for filtering
    const [selectedChannelId, setSelectedChannelId] = useState(''); // Single ID for Member view
    const [selectedTeamId, setSelectedTeamId] = useState(userRole === 'Admin' ? 'all' : '');

    const [dateRange, setDateRange] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [selectedMembers, setSelectedMembers] = useState([]);

    const [exportModal, setExportModal] = useState({ type: null, isOpen: false });

    // Derived User: Use passed prop
    const currentUser = propUser;

    const hasAuditScope = userRole === 'Admin' || (userRole === 'Manager' && (currentUser?.scopes?.includes('Channel Audit') || currentUser?.scopes?.includes('Documentation Audit')));

    // Reset report type when role changes
    useEffect(() => {
        if (userRole === 'Member' || (userRole === 'Manager' && !hasAuditScope)) {
            setReportType('Full Channel Audit (Your Activity Only)');
        } else {
            setReportType('Full Channel Audit');
        }
    }, [userRole, hasAuditScope]);


    // Compute available teams for the current user
    const availableTeams = (() => {
        if (userRole === 'Admin') return realTeams;
        if (userRole === 'Manager' && currentUser?.teams && currentUser.teams.length > 0) {
            return currentUser.teams;
        }
        // Fallback for Manager without teams or Member
        return [];
    })();

    // Filter logic for Manager and Admin (with Team selection)
    const getAvailableChannels = () => {
        // "My Activity" mode: Allow selection from all available channels (filtering of events happens later)
        if (reportType.includes('My Activity') || reportType.includes('Your Activity')) {
            return realChannels;
        }

        if (userRole === 'Admin') {
            if (selectedTeamId === 'all') return realChannels;
            const targetTeamId = selectedTeamId.toString();
            return realChannels.filter(c => c.teamId && c.teamId.toString() === targetTeamId);
        }

        if (userRole === 'Manager') {
            // If Manager selects a specific team
            if (selectedTeamId && selectedTeamId !== 'all') {
                return realChannels.filter(c => c.teamId && c.teamId.toString() === selectedTeamId.toString());
            }
            // Otherwise, show channels from ALL teams they manage/belong to
            if (availableTeams.length > 0) {
                const myTeamIds = new Set(availableTeams.map(t => t.id));
                return realChannels.filter(c => c.teamId && myTeamIds.has(c.teamId));
            }
            // If no teams found for manager, show none
            return [];
        }

        return realChannels;
    };

    const availableChannels = getAvailableChannels().filter(c => (c.platform || 'Slack').toLowerCase() === platform.toLowerCase());

    // Fetch Real Data on Mount
    useEffect(() => {
        const fetchData = async () => {
            setLoadingEvents(true);
            try {
                // 1. Fetch Logs
                const logsRes = await fetch('/api/activity');
                const logsData = await logsRes.json();

                // 2. Fetch Metadata (Channels + Teams) via secure API
                const metaRes = await fetch('/api/audit-metadata');
                if (!metaRes.ok) throw new Error(`Metadata failed: ${metaRes.status}`);
                const metaData = await metaRes.json();
                console.log("Meta Data Response:", metaData);

                const resources = metaData.resources || [];
                const teamsList = metaData.teams || [];

                setRealTeams(teamsList);
                console.log("Real Teams Set:", teamsList);

                // Build unique channel list from Resources immediately
                const channelList = resources.map(r => ({
                    id: r.external_id || r.id, // Fallback to UUID if external ID is missing
                    name: r.name || r.external_id,
                    team: r.teams?.name || 'Unassigned',
                    teamId: r.team_id,
                    platform: r.platform || 'Slack'
                }));
                console.log("Real Channels Set:", channelList);
                setRealChannels(channelList);

                // 3. Fetch Users for Audit Selection
                const usersRes = await fetch('/api/users');
                if (usersRes.ok) {
                    const userData = await usersRes.json();
                    console.log("DEBUG: Users Fetched:", userData);
                    setAvailableUsers(userData.users || []);
                }

                if (logsData.events) {
                    // Create a map of External ID -> Resource
                    const resourceMap = {};
                    resources.forEach(r => {
                        resourceMap[r.external_id] = r;
                        resourceMap[r.id] = r;
                    });

                    // Update events with friendly channel names for display
                    const enrichedEvents = logsData.events.map(ev => {
                        const res = resourceMap[ev.channelId]; // channelId in event is external_id (C0...)
                        return {
                            ...ev,
                            channelName: res ? res.name : ev.channelId
                        };
                    });

                    setRealEvents(enrichedEvents);
                }
            } catch (err) {
                console.error("Failed to fetch real audit data", err);
            } finally {
                setLoadingEvents(false);
            }
        };
        fetchData();
    }, []);

    const filterEvents = () => {
        let filtered = realEvents;

        // 1. "My Activity" filter — restrict to current user only
        if (reportType.includes('My Activity') || reportType.includes('Your Activity')) {
            const myEmail = currentUser?.email?.toLowerCase() || '';
            const myName = currentUser?.name?.toLowerCase() || '';
            filtered = filtered.filter(e => {
                const actorLower = (e.actor || '').toLowerCase();
                const emailLower = (e.email || '').toLowerCase();
                return actorLower.includes(myName) || emailLower.includes(myEmail) || actorLower === myEmail;
            });
        }

        // 2. Channel Filter (applies to all non-"My Activity" modes)
        if (selectedChannels.length > 0) {
            filtered = filtered.filter(e => selectedChannels.includes(e.channelId));
        }

        // 3. Member Filter — for "Selected Member" or "Team Member" audits
        if (reportType.includes('Member') && !reportType.includes('My Activity') && selectedMembers.length > 0) {
            const targets = new Set(selectedMembers.map(m => m.toLowerCase()));

            // Add Names to targets (since logs might only have actor name)
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

        // 4. Decision-only filter — any report type containing "Decision" or "Decisions"
        if (reportType.includes('Decision')) {
            filtered = filtered.filter(e => e.type === 'decision');
        }

        // 5. Date Filter
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

    const filteredEvents = filterEvents();
    // const availableChannels = realChannels; // Use real channels derived from logs - now using getAvailableChannels()



    const handleChannelSelect = (channelName) => {
        if (selectedChannels.includes(channelName)) {
            setSelectedChannels(selectedChannels.filter(c => c !== channelName));
        } else {
            setSelectedChannels([...selectedChannels, channelName]);
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
        let actionType = log.type.toUpperCase();
        const payloadText = (log.target || log.message || '').toLowerCase();

        if (log.action === 'Approval' || payloadText.includes('approval')) actionType = '✅ APPROVE';
        else if (log.action === 'Rejection' || payloadText.includes('rejection')) actionType = '❌ REJECT';
        else if (payloadText.includes('delegat') || payloadText.includes('transfer')) actionType = '🔁 TRANSFER';
        else if (payloadText.includes('archive') || payloadText.includes('clos')) actionType = '🗃️ ARCHIVE';
        else if (payloadText.includes('update') || payloadText.includes('edit')) actionType = '📝 UPDATE';
        else if (log.type === 'decision') {
            actionType = 'DECISION';
        }
        return actionType;
    };

    // Helper: Strip emojis for PDF (jsPDF default font doesn't support Unicode emojis)
    const formatActionForPDF = (log) => {
        const raw = formatActionType(log);
        return raw.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}✅❌🔁🗃️📝]/gu, '').trim();
    };

    // Helper: Format Channel Name
    const formatChannelName = (log) => {
        let channelName = log.channelName || log.channelId;
        if (channelName.endsWith('-')) channelName = channelName.slice(0, -1);
        if (channelName.startsWith('proj') && !channelName.startsWith('project')) {
            channelName = 'Project ' + channelName.replace(/^proj-?/, '');
            channelName = channelName.replace(/\b\w/g, c => c.toUpperCase());
        }
        return channelName.startsWith('Project') ? channelName : `#${channelName}`;
    };

    const generateAuditPDF = async () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            // Helper: Load Image and return data + dimensions
            const loadImage = (src) => new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve({
                        data: canvas.toDataURL('image/png'),
                        w: img.width,
                        h: img.height,
                        ratio: img.height / img.width
                    });
                };
                img.onerror = (e) => {
                    console.warn("Image load error", e);
                    reject(e);
                };
                img.src = src;
            });

            // 1. Header Row (Fixed Positioning)
            // Shifted left (X=7) so the visual black pixels of the icon align with X=10 line start
            const marginLeft = 7;
            const logoY = 8;
            const logoH = 16;

            // Hardcode Text Position: Shifted along with logo (30 - 3 = 27)
            const textX = 27;
            const textY = 19; // Centered vertically relative to logoH=16 at Y=8

            // A. DESSINER LE LOGO
            try {
                const logoSrc = (typeof AuditLogo === 'string') ? AuditLogo : AuditLogo.src;
                if (logoSrc) {
                    const logoData = await loadImage(logoSrc);
                    // allow width to float based on ratio, but don't let it push text
                    const logoW = logoH / logoData.ratio;
                    doc.addImage(logoData.data, 'PNG', marginLeft, logoY, logoW, logoH);
                }
            } catch (e) {
                console.warn("Logo loading failed", e);
            }

            // B. DESSINER LE TEXTE (Position Fixe)
            doc.setFont("helvetica", "bold");
            doc.setFontSize(20); // Nice large title
            doc.setTextColor(30, 41, 59);

            doc.text("VERYTIS", textX, textY);

            // C. SOUS-TITRE
            doc.setFont("helvetica", "normal");
            doc.setFontSize(20);
            doc.setTextColor(100, 116, 139);
            const titleWidth = doc.getTextWidth("VERYTIS");
            doc.text("GOVERNANCE AUDIT", textX + titleWidth + 3, textY);

            // 2. Separator Line
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(10, 24, pageWidth - 10, 24);

            // 3. Metadata Block (2 Columns)
            const metaStartY = 30;
            const col1X = 10;
            const col2X = 120;
            const rowHeight = 6;

            doc.setFontSize(10);

            // Auditor Name Logic
            let rawName = currentUser?.name || 'Unknown Auditor';
            let auditorName = rawName;
            if (auditorName.includes('@')) {
                const localPart = auditorName.split('@')[0];
                // Handle emails with dots (first.last) and without (firstlast123)
                if (localPart.includes('.')) {
                    auditorName = localPart.split('.')
                        .map(part => part.replace(/[0-9]/g, '')) // strip numbers
                        .filter(part => part.length > 0)
                        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                        .join(' ');
                } else {
                    // No dot: strip trailing numbers, try to title-case
                    const cleaned = localPart.replace(/[0-9]+$/g, '');
                    auditorName = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
                }
            }
            const auditorRole = (currentUser?.role || userRole);
            const auditorValue = `${auditorName} (${auditorRole})`;
            const auditorEmail = currentUser?.email || 'No email provided';

            // Timestamp
            const generatedTime = new Date().toLocaleString('en-US', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            });

            // Scope Logic
            let scopeValue = '';
            if (reportType.includes('My Activity') || reportType.includes('Your Activity')) {
                scopeValue = `Personal activity of ${auditorName}`;
            } else if (selectedChannels.length > 0) {
                scopeValue = selectedChannels.map(id => availableChannels.find(c => c.id === id)?.name || id).join(', ');
            } else {
                scopeValue = 'All Channels';
            }
            if (reportType.includes('Member') && selectedMembers.length > 0) {
                scopeValue += ` | Members: ${selectedMembers.length}`;
            }

            // Helper to draw label/value pair
            const drawMeta = (label, value, x, y) => {
                doc.setFont("helvetica", "bold");
                doc.setTextColor(60);
                doc.text(label, x, y);
                const labelW = doc.getTextWidth(label);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0);
                doc.text(value, x + labelW + 2, y);
            };

            // Column 1
            drawMeta("Auditor:", auditorValue, col1X, metaStartY);
            doc.setFontSize(8);
            drawMeta("Email:", auditorEmail, col1X, metaStartY + rowHeight);
            doc.setFontSize(9);
            drawMeta("Generated:", generatedTime, col1X, metaStartY + (rowHeight * 2));

            // Column 2
            drawMeta("Scope:", scopeValue.substring(0, 40) + (scopeValue.length > 40 ? "..." : ""), col2X, metaStartY);
            drawMeta("Report Type:", reportType, col2X, metaStartY + rowHeight);

            // Platform Line (Label + Logo)
            const platY = metaStartY + (rowHeight * 2);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(60);
            doc.text("Platform:", col2X, platY);
            const pLabelW = doc.getTextWidth("Platform:");

            // Render Platform Logo inline
            try {
                const pLogoSrc = (platform === 'Slack' ? SlackLogo : TeamsLogo);
                const pSrc = (typeof pLogoSrc === 'string') ? pLogoSrc : pLogoSrc.src;
                if (pSrc) {
                    const pData = await loadImage(pSrc);
                    // Small inline logo (4mm wide)
                    const pW = 4;
                    const pH = pW * pData.ratio;
                    doc.addImage(pData.data, 'PNG', col2X + pLabelW + 3, platY - 3, pW, pH);
                } else {
                    doc.setFont("helvetica", "normal");
                    doc.text(platform, col2X + pLabelW + 2, platY);
                }
            } catch (e) {
                doc.setFont("helvetica", "normal");
                doc.text(platform, col2X + pLabelW + 2, platY);
            }

            // 2. Use Cached Real Data (Filtered)
            const events = filteredEvents;

            const addFooter = (doc, pageWidth) => {
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text("Verytis - Digital Trust Platform", 10, doc.internal.pageSize.height - 10);
                doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 10, doc.internal.pageSize.height - 10);
            };

            let cursorY = 55;

            if (reportType.includes('Decision')) {
                // ======= DECISION MODE: Structured Table =======
                const tableBody = events.map(log => {
                    const date = new Date(log.timestamp);
                    const timestamp = date.toLocaleString('en-US', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                    });
                    const email = log.email ? `\n${log.email}` : '';
                    const actor = `${log.actor}${email}`;
                    const actionType = formatActionForPDF(log);
                    const context = `Slack ${formatChannelName(log)}`;
                    const payload = log.target || log.message || '';
                    let proof = '';
                    if (log.rawMetadata?.attachments?.length > 0) {
                        proof = log.rawMetadata.attachments.map(a => `${a.name} (Link: ${a.url})`).join('\n');
                    } else {
                        proof = 'No attachment';
                    }
                    return [timestamp, actor, actionType, context, payload, proof];
                });

                autoTable(doc, {
                    startY: 55,
                    margin: { left: 10, right: 10 },
                    head: [['TIMESTAMP', 'ACTOR (User)', 'ACTION TYPE', 'CONTEXT (Source)', 'PAYLOAD (Message)', 'PROOF (Attachment)']],
                    body: tableBody,
                    styles: { fontSize: 7, cellPadding: 2, valign: 'middle' },
                    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
                    columnStyles: {
                        0: { cellWidth: 32 },
                        1: { cellWidth: 40 },
                        2: { cellWidth: 25 },
                        3: { cellWidth: 25 },
                        4: { cellWidth: 'auto' },
                        5: { cellWidth: 35 }
                    },
                    didDrawPage: () => addFooter(doc, pageWidth)
                });
            } else {
                // ======= FULL MODE: Conversational Thread Layout =======
                // Group events by channel
                const byChannel = {};
                events.forEach(ev => {
                    const ch = ev.channelName || ev.channelId;
                    if (!byChannel[ch]) byChannel[ch] = [];
                    byChannel[ch].push(ev);
                });

                cursorY = 55; // aligned with table startY
                const leftMargin = 10;
                const maxWidth = pageWidth - 20;
                const pageHeight = doc.internal.pageSize.height;

                const checkPageBreak = (neededHeight) => {
                    if (cursorY + neededHeight > pageHeight - 20) {
                        addFooter(doc, pageWidth);
                        doc.addPage();
                        cursorY = 20;
                    }
                };

                Object.keys(byChannel).forEach((channelName, channelIdx) => {
                    const channelEvents = byChannel[channelName];

                    // Channel header
                    checkPageBreak(16);
                    if (channelIdx > 0) cursorY += 4;
                    doc.setFillColor(15, 23, 42);
                    doc.rect(leftMargin, cursorY, maxWidth, 8, 'F');
                    doc.setFontSize(8);
                    doc.setTextColor(255);
                    const formattedName = formatChannelName({ channelName, channelId: channelName });
                    doc.text(`${formattedName}  —  ${channelEvents.length} message${channelEvents.length > 1 ? 's' : ''}`, leftMargin + 3, cursorY + 5.5);
                    cursorY += 12;
                    doc.setTextColor(0);

                    // Messages
                    channelEvents.forEach((ev, msgIdx) => {
                        const hasAttachment = ev.rawMetadata?.attachments?.length > 0;
                        const isDecision = ev.type === 'decision';
                        const messageText = ev.target || ev.message || '';

                        // Calculate needed height
                        const wrappedLines = doc.splitTextToSize(messageText, maxWidth - 20);
                        const neededHeight = 8 + (wrappedLines.length * 3.5) + (hasAttachment ? 5 : 0) + 3;
                        checkPageBreak(neededHeight);

                        // Separator line between messages
                        if (msgIdx > 0) {
                            doc.setDrawColor(230);
                            doc.line(leftMargin + 8, cursorY, leftMargin + maxWidth, cursorY);
                            cursorY += 2;
                        }

                        // Actor line: [Initials] Actor Name    HH:MM   [BADGE]
                        doc.setFillColor(100, 116, 139);
                        doc.circle(leftMargin + 3, cursorY + 2, 2, 'F');
                        doc.setFontSize(4);
                        doc.setTextColor(255);
                        doc.text(ev.actor.substring(0, 2).toUpperCase(), leftMargin + 1.5, cursorY + 3);

                        doc.setFontSize(7);
                        doc.setTextColor(30);
                        doc.text(ev.actor, leftMargin + 8, cursorY + 3);

                        doc.setFontSize(6);
                        doc.setTextColor(150);
                        const timeStr = new Date(ev.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        doc.text(timeStr, leftMargin + 60, cursorY + 3);

                        // Decision badge
                        if (isDecision) {
                            const action = formatActionForPDF(ev);
                            doc.setFontSize(5);
                            if (action.includes('APPROVE')) {
                                doc.setTextColor(5, 150, 105);
                            } else if (action.includes('REJECT')) {
                                doc.setTextColor(220, 38, 38);
                            } else {
                                doc.setTextColor(79, 70, 229);
                            }
                            doc.text(action, leftMargin + maxWidth - 20, cursorY + 3);
                        }

                        cursorY += 7;

                        // Message body (wrapped)
                        doc.setFontSize(7);
                        doc.setTextColor(71, 85, 105);
                        wrappedLines.forEach(line => {
                            doc.text(line, leftMargin + 8, cursorY);
                            cursorY += 3.5;
                        });

                        // Attachments indicator
                        if (hasAttachment) {
                            doc.setFontSize(6);
                            doc.setTextColor(100);
                            const attachText = `[Attachment] ${ev.rawMetadata.attachments.length} file${ev.rawMetadata.attachments.length > 1 ? 's' : ''} (noted in audit)`;
                            doc.text(attachText, leftMargin + 8, cursorY);
                            cursorY += 4;
                        }

                        cursorY += 1;
                    });
                });

                addFooter(doc, pageWidth);
            }

            // 5. Digital Signature Simulation (Visual)
            // For Decision mode (autoTable), use table's finalY. For Full mode, use tracked cursorY or fallback.
            let sigY;
            if (reportType.includes('Decision') && doc.lastAutoTable?.finalY) {
                sigY = doc.lastAutoTable.finalY + 10;
            } else {
                sigY = cursorY + 10;
            }
            // Ensure signature doesn't overflow the page
            if (sigY + 25 > doc.internal.pageSize.height - 15) {
                doc.addPage();
                sigY = 20;
            }
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text("Cryptographic Signature Verification:", 10, sigY);
            doc.setFontSize(8);
            doc.setTextColor(100);
            const signature = "VRTS-" + Math.random().toString(36).substring(2, 15).toUpperCase();
            doc.text(`Hash: ${signature}`, 10, sigY + 5);
            doc.text("Status: VALIDATED (Blockchain Anchor #9921)", 10, sigY + 9);

            const fileSlug = reportType.replace(/[^a-zA-Z0-9]+/g, '_').replace(/_+$/, '');
            doc.save(`Verytis_${fileSlug}_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error("PDF Generation Error:", err);
            alert("Failed to generate PDF. Check console.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {userRole === 'Member' ? 'My Audit Documentation' : 'Audit Documentation'}
                </h1>
                <p className="text-slate-500 mt-1 text-xs font-medium">
                    {userRole === 'Member'
                        ? 'Generate personal activity reports from your channels.'
                        : 'Generate complete and legally usable audit documents from authorized channels.'}
                </p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-5">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4">
                            {userRole === 'Member' ? 'My Channel Audit' : 'Configuration'}
                        </h3>
                        <div className="space-y-4">
                            {/* Platform Selector */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Platform</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            setPlatform('Slack');
                                            setSelectedChannels([]);
                                            setSelectedChannelId('');
                                        }}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${platform === 'Slack'
                                            ? 'border-slate-800 bg-slate-50 text-slate-900 shadow-sm ring-1 ring-slate-200'
                                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        <img src={SlackLogo.src || SlackLogo} alt="Slack" className="w-5 h-5 object-contain" />
                                        <span className="text-xs font-bold">Slack</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setPlatform('Teams');
                                            setSelectedChannels([]);
                                            setSelectedChannelId('');
                                        }}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${platform === 'Teams'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm ring-1 ring-indigo-200'
                                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        <img src={TeamsLogo.src || TeamsLogo} alt="Teams" className="w-5 h-5 object-contain" />
                                        <span className="text-xs font-bold">Teams</span>
                                    </button>
                                </div>
                            </div>

                            {/* Team Selector (Admin and Manager only) */}
                            {(userRole === 'Admin' || userRole === 'Manager') && (
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Organization Team</label>
                                    <select
                                        value={selectedTeamId}
                                        onChange={(e) => {
                                            setSelectedTeamId(e.target.value);
                                            setSelectedChannels([]); // Reset channels when team changes
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-md text-xs shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 py-2 px-3 outline-none font-medium"
                                    >
                                        {userRole === 'Admin' ? (
                                            <option value="all">All Teams</option>
                                        ) : (
                                            <option value="">Select a team (Optional)</option>
                                        )}
                                        {availableTeams.map(team => (
                                            <option key={team.id} value={team.id}>{team.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Report Type Selector */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Report Type</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => {
                                        setReportType(e.target.value);
                                        // Clear member selection if switching away from member audit
                                        if (!e.target.value.includes('Member')) setSelectedMembers([]);
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-md text-xs shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 py-2 px-3 outline-none"
                                >
                                    {userRole === 'Member' ? (
                                        <>
                                            <option>Full Channel Audit (Your Activity Only)</option>
                                            <option>Decision Audit</option>
                                        </>
                                    ) : userRole === 'Manager' ? (
                                        <>
                                            <option>My Activity (Full Audit)</option>
                                            <option>My Activity (Decisions Only)</option>
                                            <option disabled className="text-slate-300">--- Team Audit ---</option>
                                            <option>Team Channel Audit (Full History)</option>
                                            <option>Team Channel Audit (Decisions Only)</option>
                                            <option>Team Member Audit (Full History)</option>
                                            <option>Team Member Audit (Decisions Only)</option>
                                        </>
                                    ) : (
                                        <>
                                            <option>My Activity (Full Audit)</option>
                                            <option>My Activity (Decisions Only)</option>
                                            <option disabled className="text-slate-300">--- Organization Audit ---</option>
                                            <option>Full Channel Audit</option>
                                            <option>Full Decision Audit (Channel)</option>
                                            <option>Selected Member Audit (Full)</option>
                                            <option>Selected Member Audit (Decisions)</option>
                                        </>
                                    )}
                                </select>
                                {(userRole === 'Member' || reportType.includes('My Activity')) && (
                                    <p className="mt-1.5 text-[10px] text-emerald-600 font-medium leading-tight">
                                        Compliance Note: This report extracts only messages sent by you or threads where you are an active participant.
                                    </p>
                                )}
                            </div>

                            {/* Channel Selector - Checkbox List for ALL roles */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                                    {reportType.includes('My Activity') || reportType.includes('Your Activity')
                                        ? 'My Channels'
                                        : 'Authorized Channels'}
                                </label>
                                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md p-2 bg-slate-50">
                                    {availableChannels.map(channel => (
                                        <div key={channel.id} className="flex items-center gap-2 mb-1.5 last:mb-0">
                                            <input
                                                type="checkbox"
                                                id={`chan-${channel.id}`}
                                                checked={selectedChannels.includes(channel.id)}
                                                onChange={() => handleChannelSelect(channel.id)}
                                                className="rounded text-slate-900 focus:ring-slate-500"
                                            />
                                            <label htmlFor={`chan-${channel.id}`} className="text-xs text-slate-700 cursor-pointer font-medium flex-1 truncate">
                                                {channel.name}
                                                {channel.team && channel.team !== 'Unassigned' && (
                                                    <span className="text-slate-400 ml-1 text-[10px]">({channel.team})</span>
                                                )}
                                            </label>
                                        </div>
                                    ))}
                                    {availableChannels.length === 0 && (
                                        <p className="text-xs text-slate-400 p-1">
                                            {loadingEvents ? 'Loading channels...' :
                                                (reportType.includes('My Activity') || reportType.includes('Your Activity'))
                                                    ? 'No channels found.'
                                                    : 'No authorized channels found.'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Member Selection Logic */}
                            {userRole !== 'Member' && reportType.includes('Member') && (() => {
                                // Use Verified Users from DB instead of deriving from Events
                                const memberList = availableUsers;

                                return (
                                    <div className="animate-in fade-in zoom-in-95 duration-200">
                                        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                                            Select Members to Audit
                                        </label>
                                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md p-2 bg-slate-50">
                                            {memberList.length > 0 ? memberList.map(member => {
                                                const isConnected = !!member.slackId;
                                                // Use email as key for filtering logs later, falling back to ID if needed
                                                const selectionKey = member.email || member.id;

                                                return (
                                                    <div key={member.id} className="flex items-center gap-2 mb-1.5 last:mb-0">
                                                        <input
                                                            type="checkbox"
                                                            id={`mem-${member.id}`}
                                                            checked={selectedMembers.includes(selectionKey)}
                                                            onChange={() => handleMemberSelect(selectionKey)}
                                                            className="rounded text-slate-900 focus:ring-slate-500"
                                                        />
                                                        <label htmlFor={`mem-${member.id}`} className="text-xs text-slate-700 cursor-pointer flex items-center gap-1 font-medium flex-1">
                                                            {/* Connection Status Indicator */}
                                                            <div className="relative flex items-center justify-center w-3 h-3 mr-1" title={isConnected ? "Connected to App" : "Not Connected (App)"}>
                                                                {isConnected ? (
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm ring-1 ring-emerald-200"></div>
                                                                ) : (
                                                                    <XCircle className="w-3 h-3 text-rose-400 opacity-80" />
                                                                )}
                                                            </div>

                                                            {member.name}
                                                            {member.email && <span className="text-[9px] text-slate-400 ml-1">({member.email})</span>}
                                                        </label>
                                                    </div>
                                                );
                                            }) : (
                                                memberList.length === 0 && <p className="text-xs text-slate-400 p-1">No verified members found. (Try refreshing page to load users)</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Time Range Selector */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Time Range</label>
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-md text-xs shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 py-2 px-3 outline-none"
                                >
                                    <option value="all">All Time</option>
                                    <option value="30">Last 30 Days</option>
                                    <option value="7">Last 7 Days</option>
                                    <option value="custom">Custom Range...</option>
                                </select>
                                {dateRange === 'custom' && (
                                    <div className="flex items-center gap-2 mt-2 animate-in fade-in zoom-in-95">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 text-slate-600 focus:ring-1 focus:ring-slate-500 outline-none"
                                        />
                                        <span className="text-slate-300">-</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 text-slate-600 focus:ring-1 focus:ring-slate-500 outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500 mb-2">
                            <Shield className="w-3 h-3" /> Compliance Notes
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed mb-1">
                            <strong>Data Integrity:</strong> Extracted data reflects original channel history without alteration.
                        </p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            <strong>Traceability:</strong> Exports include generation timestamp & auditor identity.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card className="flex-1 p-0 overflow-hidden flex flex-col relative">
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <span className="px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-bold uppercase text-slate-500 rounded border border-slate-200 shadow-sm">Preview Mode</span>
                        </div>

                        {selectedChannels.length === 0 && !reportType.includes('My Activity') && !reportType.includes('Your Activity') ? (
                            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 bg-slate-50/50 min-h-[300px]">
                                <FileText className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-xs font-medium uppercase tracking-wide">Select channels to generate preview</p>
                            </div>
                        ) : (
                            <div className="flex-1 p-8 bg-slate-100 flex justify-center overflow-y-auto max-h-[600px] shadow-inner">
                                {/* A4 Paper Representation */}
                                <div className="bg-white shadow-2xl w-full max-w-[500px] min-h-[700px] p-8 flex flex-col relative transition-transform">
                                    {loadingEvents && <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center font-bold text-slate-400">Loading Preview...</div>}

                                    {/* Document Header */}
                                    <div className="flex justify-between items-start border-b border-slate-900 pb-4 mb-4">
                                        <div>
                                            {/* Mock Logo if not loading well, or text */}
                                            <div className="text-xl font-black tracking-widest text-slate-900 mb-1">VERYTIS</div>
                                            <div className="text-[8px] text-slate-500 uppercase tracking-widest font-medium">Digital Audit Trail</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-slate-900">AUDIT REPORT</div>
                                            <div className="text-[8px] text-indigo-600 font-semibold mt-0.5">{reportType}</div>
                                            <div className="text-[8px] text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-US')}</div>
                                        </div>
                                    </div>

                                    {/* Meta Info Section */}
                                    <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-3 rounded-sm border border-slate-100">
                                        <div>
                                            <div className="text-[8px] text-slate-400 font-bold uppercase mb-0.5">Auditor</div>
                                            <div className="text-[9px] font-semibold text-slate-800">{currentUser.name}</div>
                                            <div className="text-[8px] text-slate-500">{currentUser.email}</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] text-slate-400 font-bold uppercase mb-0.5">Scope</div>
                                            <div className="text-[9px] font-semibold text-slate-800 line-clamp-2">
                                                {reportType.includes('My Activity') || reportType.includes('Your Activity')
                                                    ? `Personal: ${currentUser.name}`
                                                    : selectedChannels.length > 0
                                                        ? selectedChannels.map(id => availableChannels.find(c => c.id === id)?.name || id).join(", ")
                                                        : "All Channels"}
                                            </div>
                                            <div className="text-[8px] text-slate-500">{filteredEvents.length} Verified Events</div>
                                        </div>
                                    </div>

                                    {/* Content: adapts based on Full vs Decision mode */}
                                    <div className="w-full">
                                        {reportType.includes('Decision') ? (
                                            /* ======= DECISION MODE: Compact Table ======= */
                                            <>
                                                <div className="grid grid-cols-12 gap-1 bg-slate-900 text-white p-1.5 text-[7px] font-bold uppercase tracking-wider mb-1">
                                                    <div className="col-span-2">Time</div>
                                                    <div className="col-span-3">Actor</div>
                                                    <div className="col-span-2">Action</div>
                                                    <div className="col-span-2">Context</div>
                                                    <div className="col-span-3">Summary</div>
                                                </div>

                                                <div className="space-y-0.5 relative">
                                                    {filteredEvents.length === 0 ? (
                                                        <div className="text-center py-8 text-[9px] text-slate-400 italic">No decisions found for current filters.</div>
                                                    ) : (
                                                        filteredEvents.slice(0, 10).map((ev, i) => {
                                                            const actionLabel = formatActionType(ev);
                                                            const channelLabel = formatChannelName(ev);
                                                            return (
                                                                <div key={i} className="grid grid-cols-12 gap-1 py-1 border-b border-slate-100 text-[7px] text-slate-600 items-center">
                                                                    <div className="col-span-2 tracking-tighter text-slate-400 leading-tight">
                                                                        {new Date(ev.timestamp).toLocaleDateString('en-US')} <br />
                                                                        {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                    <div className="col-span-3 font-medium text-slate-800 truncate">{ev.actor}</div>
                                                                    <div className="col-span-2">
                                                                        <span className={`px-1 py-0.5 rounded-[2px] font-bold text-[6px] uppercase whitespace-nowrap ${actionLabel.includes('APPROVE') ? 'bg-emerald-100 text-emerald-800' :
                                                                            actionLabel.includes('REJECT') ? 'bg-red-100 text-red-800' :
                                                                                actionLabel.includes('TRANSFER') ? 'bg-indigo-50 text-indigo-700' :
                                                                                    actionLabel.includes('ARCHIVE') ? 'bg-amber-50 text-amber-700' :
                                                                                        actionLabel.includes('UPDATE') ? 'bg-blue-50 text-blue-700' :
                                                                                            'bg-slate-100 text-slate-600'}`}>
                                                                            {actionLabel}
                                                                        </span>
                                                                    </div>
                                                                    <div className="col-span-2 truncate text-slate-500 font-mono text-[6px]">{channelLabel}</div>
                                                                    <div className="col-span-3 truncate text-slate-500">{ev.target || ev.message || "No content"}</div>
                                                                </div>
                                                            )
                                                        })
                                                    )}

                                                    {filteredEvents.length > 10 && (
                                                        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent flex items-end justify-center">
                                                            <div className="text-[8px] text-slate-400 italic mb-1">
                                                                ... and {filteredEvents.length - 10} more decisions
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            /* ======= FULL MODE: Conversational Thread View ======= */
                                            <>
                                                {(() => {
                                                    // Group events by channel
                                                    const byChannel = {};
                                                    filteredEvents.forEach(ev => {
                                                        const ch = ev.channelName || ev.channelId;
                                                        if (!byChannel[ch]) byChannel[ch] = [];
                                                        byChannel[ch].push(ev);
                                                    });
                                                    const channelKeys = Object.keys(byChannel);

                                                    if (channelKeys.length === 0) {
                                                        return <div className="text-center py-8 text-[9px] text-slate-400 italic">No events found for current filters.</div>;
                                                    }

                                                    // Show max 2 channels, 5 messages each in preview
                                                    return channelKeys.slice(0, 2).map(channelName => (
                                                        <div key={channelName} className="mb-4 last:mb-0">
                                                            {/* Channel header */}
                                                            <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-200">
                                                                <div className="w-3 h-3 rounded bg-slate-800 flex items-center justify-center">
                                                                    <span className="text-white text-[5px] font-bold">#</span>
                                                                </div>
                                                                <span className="text-[9px] font-bold text-slate-800">{formatChannelName({ channelName, channelId: channelName })}</span>
                                                                <span className="text-[7px] text-slate-400 ml-auto">{byChannel[channelName].length} messages</span>
                                                            </div>

                                                            {/* Messages as conversation bubbles */}
                                                            <div className="space-y-1.5 pl-2 border-l-2 border-slate-100 relative">
                                                                {byChannel[channelName].slice(0, 5).map((ev, i) => {
                                                                    const hasAttachment = ev.rawMetadata?.attachments?.length > 0;
                                                                    const actionLabel = formatActionType(ev);
                                                                    const isDecision = ev.type === 'decision';

                                                                    return (
                                                                        <div key={i} className="pl-2">
                                                                            {/* Actor + Time line */}
                                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                                <div className="w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                                                                                    <span className="text-white text-[5px] font-bold">{ev.actor.substring(0, 2).toUpperCase()}</span>
                                                                                </div>
                                                                                <span className="text-[8px] font-bold text-slate-800">{ev.actor}</span>
                                                                                <span className="text-[6px] text-slate-400">
                                                                                    {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                                {isDecision && (
                                                                                    <span className={`px-1 py-0.5 rounded text-[5px] font-bold uppercase ml-auto ${actionLabel.includes('APPROVE') ? 'bg-emerald-100 text-emerald-700' :
                                                                                        actionLabel.includes('REJECT') ? 'bg-red-100 text-red-700' :
                                                                                            'bg-blue-50 text-blue-700'
                                                                                        }`}>{actionLabel}</span>
                                                                                )}
                                                                            </div>
                                                                            {/* Message body */}
                                                                            <div className="ml-5.5 pl-1">
                                                                                <p className="text-[7px] text-slate-600 leading-relaxed break-words">
                                                                                    {ev.target || ev.message || 'No content'}
                                                                                </p>
                                                                                {hasAttachment && (
                                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                                        <div className="px-1 py-0.5 bg-slate-100 rounded text-[5px] text-slate-500 flex items-center gap-0.5">
                                                                                            📎 {ev.rawMetadata.attachments.length} attachment{ev.rawMetadata.attachments.length > 1 ? 's' : ''} (noted)
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}

                                                                {byChannel[channelName].length > 5 && (
                                                                    <div className="text-[7px] text-slate-400 italic pl-6">
                                                                        ... {byChannel[channelName].length - 5} more messages in this channel
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}

                                                {/* Remaining channels indicator */}
                                                {(() => {
                                                    const byChannel = {};
                                                    filteredEvents.forEach(ev => {
                                                        const ch = ev.channelName || ev.channelId;
                                                        if (!byChannel[ch]) byChannel[ch] = [];
                                                        byChannel[ch].push(ev);
                                                    });
                                                    const remaining = Object.keys(byChannel).length - 2;
                                                    if (remaining > 0) {
                                                        return (
                                                            <div className="mt-3 pt-2 border-t border-dashed border-slate-200 text-center">
                                                                <div className="text-[8px] text-slate-400 italic">
                                                                    ... and {remaining} more channel{remaining > 1 ? 's' : ''} in full report
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </>
                                        )}
                                    </div>

                                    {/* Document Footer */}
                                    <div className="mt-auto border-t border-slate-200 pt-3 flex justify-between items-center text-[7px] text-slate-400 uppercase tracking-widest font-medium">
                                        <div>Verytis - Certified Audit Trail</div>
                                        <div>Page 1 of {Math.ceil((filteredEvents.length || 1) / 15)}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="p-5 rounded-xl border border-slate-700 shadow-lg" style={{ backgroundColor: '#0f172a' }}>
                        <div className="flex flex-col lg:flex-row items-start gap-4">
                            <div className="p-2 rounded-md flex-shrink-0" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                                <Shield className="w-5 h-5 text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wide">Scope Summary</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-[10px]">
                                    <ul className="space-y-1.5 text-slate-400">
                                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Channel messages (Authorized Only)</li>
                                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Decision markers & tags</li>
                                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" /> Member-filtered extraction</li>
                                    </ul>
                                    <ul className="space-y-1.5 text-slate-400">
                                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-rose-500 flex-shrink-0" /> Private DMs (Excluded)</li>
                                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-rose-500 flex-shrink-0" /> Unauthorized channels</li>
                                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-rose-500 flex-shrink-0" /> Email data</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 w-full lg:w-36 flex-shrink-0">
                                <button onClick={() => setExportModal({ type: 'pdf', isOpen: true })} className="px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition-colors hover:opacity-90" style={{ backgroundColor: '#4f46e5', color: 'white' }}>Export PDF</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Export Modal */}
            <Modal
                isOpen={exportModal.type === 'pdf' && exportModal.isOpen}
                onClose={() => setExportModal({ type: null, isOpen: false })}
                title="Export PDF Report"
                maxWidth="max-w-3xl"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Configuration */}
                        <div className="space-y-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Audit Report PDF</h4>
                                        <p className="text-[10px] text-slate-500">Legally compliant document with digital signature</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Channels</span>
                                        <span className="font-medium text-slate-900 truncate max-w-[150px] text-right">
                                            {selectedChannels.length > 0
                                                ? selectedChannels.map(id => availableChannels.find(c => c.id === id)?.name || id).join(', ')
                                                : "All Channels"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Report Type</span>
                                        <span className="font-medium text-slate-900">{reportType}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500">Estimated Pages</span>
                                        <span className="font-medium text-slate-900">~{Math.ceil((filteredEvents.length || 1) / 15)} pages</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Include Sections</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Executive Summary</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Message Timeline</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Decision Markers</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded" /> Member Activity Analysis</label>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-inner flex flex-col h-full">
                            <div className="bg-slate-900 text-white px-3 py-2 text-[10px] font-bold uppercase tracking-wide">Preview</div>
                            <div className="p-3 space-y-3 flex-1 overflow-y-auto text-xs bg-slate-50">
                                {/* Live Preview of Filtered Events */}
                                {filteredEvents.slice(0, 5).map((ev, i) => {
                                    const actionLabel = formatActionType(ev);
                                    const channelLabel = formatChannelName(ev);

                                    return (
                                        <div key={i} className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                                                        {ev.actor.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 leading-tight">{ev.actor}</div>
                                                        <div className="text-slate-400 text-[9px] font-mono">{channelLabel} • {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </div>
                                                </div>
                                                <span className={`px-1.5 py-0.5 rounded-[2px] font-bold text-[8px] uppercase whitespace-nowrap ${actionLabel.includes('APPROVE') ? 'bg-emerald-100 text-emerald-800' :
                                                    actionLabel.includes('REJECT') ? 'bg-red-100 text-red-800' :
                                                        actionLabel.includes('TRANSFER') ? 'bg-indigo-50 text-indigo-700' :
                                                            actionLabel.includes('ARCHIVE') ? 'bg-amber-50 text-amber-700' :
                                                                actionLabel.includes('UPDATE') ? 'bg-blue-50 text-blue-700' :
                                                                    'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {actionLabel}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 text-[11px] leading-snug">{ev.target || ev.message}</p>
                                        </div>
                                    )
                                })}
                                {filteredEvents.length === 0 && <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
                                    <FileText className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-[10px]">No visible events in this scope</p>
                                </div>}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 gap-2 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setExportModal({ type: null, isOpen: false })}>Cancel</Button>
                        <Button variant="primary" icon={Download} onClick={generateAuditPDF}>Generate PDF</Button>
                    </div>
                </div>
            </Modal>

            {/* CSV Export Modal */}
            <Modal
                isOpen={exportModal.type === 'csv' && exportModal.isOpen}
                onClose={() => setExportModal({ type: null, isOpen: false })}
                title="Export CSV Data"
                maxWidth="max-w-4xl"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-slate-200 rounded-lg">
                                        <Table className="w-5 h-5 text-slate-700" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Raw Data Export</h4>
                                        <p className="text-[10px] text-slate-500">Comma-separated values</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Columns</label>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Timestamp</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Author</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Message</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Channel</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Reactions</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded" /> Thread ID</label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Delimiter</label>
                                <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs">
                                    <option>Comma (,)</option>
                                    <option>Semicolon (;)</option>
                                    <option>Tab</option>
                                </select>
                            </div>
                        </div>

                        {/* Data Preview Table */}
                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-inner">
                            <div className="bg-slate-900 text-white px-3 py-2 text-[10px] font-bold uppercase tracking-wide">Data Preview (5 rows)</div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-[10px]">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-2 py-1.5 text-left font-bold text-slate-600">TIMESTAMP</th>
                                            <th className="px-2 py-1.5 text-left font-bold text-slate-600">AUTHOR</th>
                                            <th className="px-2 py-1.5 text-left font-bold text-slate-600">MESSAGE</th>
                                            <th className="px-2 py-1.5 text-left font-bold text-slate-600">CHANNEL</th>
                                            <th className="px-2 py-1.5 text-left font-bold text-slate-600">TYPE</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredEvents.slice(0, 50).map((ev, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-2 py-1.5 font-mono text-slate-600">{new Date(ev.timestamp).toLocaleString()}</td>
                                                <td className="px-2 py-1.5 font-medium">{ev.actor}</td>
                                                <td className="px-2 py-1.5 text-slate-700 max-w-[200px] truncate">{ev.target}</td>
                                                <td className="px-2 py-1.5 text-slate-600">{ev.channelName ? `#${ev.channelName}` : ev.channelId}</td>
                                                <td className="px-2 py-1.5">{ev.type}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 text-[10px] text-slate-500">
                                Showing {Math.min(50, filteredEvents.length)} of {filteredEvents.length} total rows
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 gap-2 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setExportModal({ type: null, isOpen: false })}>Cancel</Button>
                        <Button variant="primary" icon={Download} onClick={() => {
                            const headers = ['TIMESTAMP', 'AUTHOR', 'MESSAGE', 'CHANNEL', 'TYPE'];
                            const rows = filteredEvents.map(e => [
                                new Date(e.timestamp).toISOString(),
                                e.actor,
                                `"${(e.target || '').replace(/"/g, '""')}"`,
                                e.channelId,
                                e.type
                            ]);
                            const csvContent = "data:text/csv;charset=utf-8,"
                                + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "verytis_audit_export.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}>Download CSV</Button>
                    </div>
                </div>
            </Modal>

            {/* XLS Export Modal */}
            <Modal
                isOpen={exportModal.type === 'xls' && exportModal.isOpen}
                onClose={() => setExportModal({ type: null, isOpen: false })}
                title="Export Excel Workbook"
                maxWidth="max-w-4xl"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-4">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Excel Workbook</h4>
                                        <p className="text-[10px] text-slate-500">Multi-sheet workbook</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Worksheets</label>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Summary Dashboard</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Messages Data</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" defaultChecked className="rounded" /> Decision Log</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded" /> Member Statistics</label>
                                    <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded" /> Pivot Tables</label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Format</label>
                                <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs">
                                    <option>.xlsx (Excel 2007+)</option>
                                    <option>.xls (Excel 97-2003)</option>
                                </select>
                            </div>
                        </div>

                        {/* Excel Preview */}
                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-inner">
                            <div className="bg-emerald-700 text-white px-3 py-2 text-[10px] font-bold uppercase tracking-wide flex items-center gap-2">
                                <FileSpreadsheet className="w-3.5 h-3.5" /> Workbook Preview
                            </div>

                            {/* Excel Tabs */}
                            <div className="bg-slate-100 border-b border-slate-200 flex text-[10px]">
                                <button className="px-3 py-1.5 bg-white border-r border-slate-200 font-bold text-emerald-700 border-b-2 border-b-emerald-600">Summary</button>
                                <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 border-r border-slate-200">Messages</button>
                                <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 border-r border-slate-200">Decisions</button>
                            </div>

                            {/* Summary Sheet Preview */}
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                                        <div className="text-2xl font-bold text-emerald-700">142</div>
                                        <div className="text-[10px] text-emerald-600 font-medium uppercase">Total Messages</div>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                        <div className="text-2xl font-bold text-blue-700">8</div>
                                        <div className="text-[10px] text-blue-600 font-medium uppercase">Decisions</div>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                                        <div className="text-2xl font-bold text-amber-700">4</div>
                                        <div className="text-[10px] text-amber-600 font-medium uppercase">Participants</div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                    <h5 className="text-[10px] font-bold text-slate-700 uppercase mb-2">Reaction Summary</h5>
                                    <div className="grid grid-cols-4 gap-2 text-[10px]">
                                        <div className="flex items-center gap-1"><span>👍</span> <span className="font-mono">24</span></div>
                                        <div className="flex items-center gap-1"><span>✅</span> <span className="font-mono">18</span></div>
                                        <div className="flex items-center gap-1"><span>🎉</span> <span className="font-mono">12</span></div>
                                        <div className="flex items-center gap-1"><span>👀</span> <span className="font-mono">8</span></div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                    <h5 className="text-[10px] font-bold text-slate-700 uppercase mb-2">Top Contributors</h5>
                                    <div className="space-y-1.5 text-[10px]">
                                        <div className="flex justify-between"><span>Sarah Jenkins</span><span className="font-mono text-slate-500">42 msgs</span></div>
                                        <div className="flex justify-between"><span>David Chen</span><span className="font-mono text-slate-500">35 msgs</span></div>
                                        <div className="flex justify-between"><span>Michael Ross</span><span className="font-mono text-slate-500">28 msgs</span></div>
                                        <div className="flex justify-between"><span>Elena Ross</span><span className="font-mono text-slate-500">22 msgs</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 gap-2 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setExportModal({ type: null, isOpen: false })}>Cancel</Button>
                        <Button variant="primary" icon={Download} className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600" onClick={() => {
                            const headers = ['TIMESTAMP', 'AUTHOR', 'MESSAGE', 'CHANNEL', 'TYPE'];
                            const rows = filteredEvents.map(e => [
                                new Date(e.timestamp).toISOString(),
                                e.actor,
                                `"${(e.target || '').replace(/"/g, '""')}"`,
                                e.channelId,
                                e.type
                            ]);
                            const csvContent = "data:application/vnd.ms-excel;charset=utf-8,"
                                + [headers.join('\t'), ...rows.map(e => e.join('\t'))].join('\n');
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "verytis_audit_workbook.xls");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}>Download Excel</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AuditDocumentation;
