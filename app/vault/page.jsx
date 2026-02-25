'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
    Fingerprint, Bot, ShieldCheck, Server,
    Trash2, Search, ChevronRight, ChevronDown, Clock, Eye, RotateCcw, AlertTriangle,
    FolderOpen, Package, Calendar, X, FileJson, Lock, Hash, Activity, FileText, ClipboardList,
    Users, Shield, CheckCircle, MessageSquare, Download, AlertCircle, Fingerprint as FingerIcon,
    History
} from 'lucide-react';
import { Modal } from '../../components/ui';
import Timeline from '../../components/pages/Timeline';

const fetcher = (url) => fetch(url).then(r => r.json());

const PROVIDERS = [
    { key: 'slack', label: 'Slack', favicon: 'https://www.google.com/s2/favicons?domain=slack.com&sz=32', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { key: 'github', label: 'GitHub', favicon: 'https://www.google.com/s2/favicons?domain=github.com&sz=32', color: 'text-slate-900', bg: 'bg-slate-100', border: 'border-slate-200' },
    { key: 'trello', label: 'Trello', favicon: 'https://www.google.com/s2/favicons?domain=trello.com&sz=32', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { key: 'agent', label: 'AI Agents', icon: Bot, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    { key: 'identity', label: 'Identity / Passport', icon: Fingerprint, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-200' },
    { key: 'governance', label: 'Governance', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { key: 'system', label: 'System', icon: Server, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
];

function ProviderIcon({ provider, size = 14, className = '' }) {
    if (provider?.favicon) {
        return <img src={provider.favicon} alt={provider.label} width={size} height={size} className={`rounded-sm ${className}`} />;
    }
    const Icon = provider?.icon || FolderOpen;
    return <Icon className={`${className}`} style={{ width: size, height: size }} />;
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function daysUntilPurge(purgeAt) {
    if (!purgeAt) return 0;
    const diff = new Date(purgeAt) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function VaultPage() {
    const [activeYear, setActiveYear] = useState(new Date().getFullYear().toString());
    const [activeProvider, setActiveProvider] = useState(null);
    const [activeContext, setActiveContext] = useState(null);
    const [viewTrash, setViewTrash] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [viewHistoryId, setViewHistoryId] = useState(null);
    const [viewMode, setViewMode] = useState('archive'); // 'archive' or 'reports'
    const [expandedYears, setExpandedYears] = useState({ [new Date().getFullYear()]: true });

    // API
    let apiUrl = '/api/archive';
    if (viewMode === 'reports') {
        apiUrl += '?source=governance';
    } else if (viewTrash) {
        apiUrl += '?view=trash';
    } else {
        const params = [];
        if (activeProvider) params.push(`source=${activeProvider}`);
        if (activeContext) params.push(`context=${activeContext}`);
        if (params.length) apiUrl += '?' + params.join('&');
    }

    const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher);
    const items = data?.items || [];
    const providerCounts = data?.providerCounts || {};

    // Filter by year and search
    const filteredItems = useMemo(() => {
        let result = items;
        if (!viewTrash && activeYear) {
            result = result.filter(i => {
                const date = new Date(i.archived_at);
                return date.getFullYear().toString() === activeYear;
            });
        }
        if (searchQuery) {
            result = result.filter(i => i.label?.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return result;
    }, [items, activeYear, searchQuery, viewTrash]);

    // Years available
    const years = useMemo(() => {
        const y = new Set();
        y.add(new Date().getFullYear().toString());
        items.forEach(i => {
            if (i.archived_at) y.add(new Date(i.archived_at).getFullYear().toString());
        });
        return Array.from(y).sort().reverse();
    }, [items]);

    const toggleYear = (year) => {
        setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
        setActiveYear(year);
        setActiveProvider(null);
        setActiveContext(null);
        setViewTrash(false);
    };

    const handleTrashAction = async (itemId, action) => {
        await fetch('/api/archive/trash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, item_id: itemId })
        });
        mutate();
        setSelectedItem(null);
    };

    // Fetch full item for side panel
    const { data: itemDetail } = useSWR(
        selectedItem ? `/api/archive/${selectedItem}` : null,
        fetcher
    );

    return (
        <div className="flex h-[calc(100vh-56px)]">
            {/* ─── Left Sidebar: Year > Section Tree ──────── */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search archive..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-0.5">
                    {/* Year folders */}
                    {years.map(year => (
                        <div key={year}>
                            <button
                                onClick={() => toggleYear(year)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeYear === year && !viewTrash && viewMode === 'archive'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    {expandedYears[year]
                                        ? <ChevronDown className="w-3.5 h-3.5" />
                                        : <ChevronRight className="w-3.5 h-3.5" />
                                    }
                                    <Calendar className="w-3.5 h-3.5" />
                                    {year}
                                </span>
                            </button>

                            {/* Provider list */}
                            {expandedYears[year] && (
                                <div className="ml-5 mt-0.5 space-y-0.5 border-l-2 border-slate-100 pl-2">
                                    {PROVIDERS.map(prov => {
                                        const isActive = activeProvider === prov.key && activeYear === year && !viewTrash;
                                        return (
                                            <button
                                                key={prov.key}
                                                onClick={() => { setActiveYear(year); setActiveProvider(prov.key); setActiveContext(null); setViewTrash(false); setViewMode('archive'); }}
                                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${isActive
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <ProviderIcon provider={prov} size={14} className={isActive ? 'text-blue-500' : prov.color} />
                                                    {prov.label}
                                                </span>
                                                {providerCounts[prov.key] > 0 && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                                                        {providerCounts[prov.key]}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="h-px bg-slate-100 my-3" />

                    {/* Reports Zone */}
                    <button
                        onClick={() => { setViewMode('reports'); setViewTrash(false); setSelectedItem(null); }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'reports'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                    >
                        <ClipboardList className="w-3.5 h-3.5" />
                        Audit Reports
                    </button>

                    {/* Trash */}
                    <button
                        onClick={() => { setViewTrash(true); setActiveContext(null); setViewMode('archive'); setSelectedItem(null); }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${viewTrash
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                            }`}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Trash (30-Day Purge)
                    </button>
                </nav>

                {/* Vault info footer */}
                <div className="p-3 border-t border-slate-100">
                    <div className="text-[9px] text-slate-400 font-mono space-y-1">
                        <div className="flex items-center gap-1.5">
                            <Lock className="w-3 h-3" /> AES-256-GCM Encryption
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Hash className="w-3 h-3" /> SHA-256 Integrity
                        </div>
                    </div>
                </div>
            </aside>

            {/* ─── Center: Data Grid ──────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                {/* Breadcrumb */}
                <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        {viewMode === 'reports' ? 'Audit Cloud' : 'Vault'}
                    </span>
                    {viewMode === 'archive' && !viewTrash && activeYear && (
                        <>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">{activeYear}</span>
                        </>
                    )}
                    {viewMode === 'reports' && (
                        <>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono">Lifecycle Reports</span>
                            {activeYear && (
                                <>
                                    <ChevronRight className="w-3 h-3 text-slate-300" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">{activeYear}</span>
                                </>
                            )}
                        </>
                    )}
                    {activeProvider && (
                        <>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono">
                                {PROVIDERS.find(p => p.key === activeProvider)?.label || activeProvider}
                            </span>
                        </>
                    )}
                    {activeContext && (
                        <>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider font-mono italic">
                                {activeContext}
                            </span>
                        </>
                    )}
                    {viewTrash && (
                        <>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider font-mono">Trash</span>
                        </>
                    )}
                    <div className="ml-auto text-[10px] text-slate-400 font-mono">
                        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-sm text-slate-400 animate-pulse font-mono">Decrypting records...</div>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <Package className="w-10 h-10 text-slate-300 mb-3" />
                            <p className="text-sm font-medium text-slate-500">
                                {viewTrash ? 'Trash is empty' : 'No archived items'}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 font-mono">
                                {viewTrash ? 'Deleted items will appear here for 30 days.' : 'Select a section to explore.'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-xs text-left">
                            <thead className="bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 border-b border-slate-200">{viewMode === 'reports' ? 'Audit Subject' : 'Label'}</th>
                                    <th className="px-4 py-3 border-b border-slate-200">{viewMode === 'reports' ? 'Entity Type' : 'Section'}</th>
                                    <th className="px-4 py-3 border-b border-slate-200">{viewTrash ? 'Deleted' : (viewMode === 'reports' ? 'Closure Date' : 'Archived')}</th>
                                    <th className="px-4 py-3 border-b border-slate-200">{viewMode === 'reports' ? 'Audit Status' : 'Integrity'}</th>
                                    {viewTrash && <th className="px-4 py-3 border-b border-slate-200">Purge</th>}
                                    <th className="px-4 py-3 border-b border-slate-200 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredItems.map(item => {
                                    const provObj = PROVIDERS.find(p => p.key === item.source_provider);
                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => !viewTrash && setSelectedItem(item.id)}
                                            className={`transition-colors cursor-pointer ${selectedItem === item.id
                                                ? 'bg-blue-50'
                                                : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`p-1.5 rounded ${provObj?.bg || 'bg-slate-100'}`}>
                                                        <ProviderIcon provider={provObj} size={14} className={provObj?.color || 'text-slate-500'} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-xs">{item.label}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">
                                                            {item.source_provider} {item.context_label ? `› ${item.context_label}` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${provObj?.bg || 'bg-slate-50'} ${provObj?.color || 'text-slate-500'} ${provObj?.border || 'border-slate-200'}`}>
                                                    <ProviderIcon provider={provObj} size={12} />
                                                    {provObj?.label || item.source_provider || item.section}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    {formatDate(viewTrash ? item.deleted_at : item.archived_at)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.content_hash ? (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                        <ShieldCheck className="w-3 h-3" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                        <AlertTriangle className="w-3 h-3" /> Pending
                                                    </span>
                                                )}
                                            </td>
                                            {viewMode === 'reports' && (
                                                <>
                                                    <ChevronRight className="w-3 h-3 text-slate-300" />
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono">Lifecycle Reports</span>
                                                    {activeYear && (
                                                        <>
                                                            <ChevronRight className="w-3 h-3 text-slate-300" />
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">{activeYear}</span>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                            {viewTrash && (
                                                <td className="px-4 py-3">
                                                    {(() => {
                                                        const days = daysUntilPurge(item.purge_at);
                                                        return (
                                                            <span className={`text-[10px] font-bold font-mono ${days <= 7 ? 'text-rose-600' : 'text-amber-600'}`}>
                                                                {days}d remaining
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            )}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                                    {viewTrash ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleTrashAction(item.id, 'restore')}
                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                                                            >
                                                                <RotateCcw className="w-3 h-3" /> Restore
                                                            </button>
                                                            <button
                                                                onClick={() => handleTrashAction(item.id, 'purge')}
                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                                                            >
                                                                <AlertTriangle className="w-3 h-3" /> Destroy
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => setSelectedItem(item.id)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                                                        >
                                                            <Eye className="w-3 h-3" /> Inspect
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ─── Right: Detail Panel (JSON Viewer) ──────── */}
            {selectedItem && (
                <aside className="w-96 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
                    {/* Panel header */}
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {viewMode === 'reports' ? (
                                <ClipboardList className="w-4 h-4 text-blue-500" />
                            ) : (
                                <FileJson className="w-4 h-4 text-blue-500" />
                            )}
                            <span className="text-xs font-bold text-slate-900">
                                {viewMode === 'reports' ? 'Lifecycle Audit Report' : 'Data Snapshot'}
                            </span>
                        </div>
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Panel Content (Reports or JSON) */}
                    <div className="flex-1 overflow-y-auto p-4" key={`scroll-${selectedItem}`}>
                        {itemDetail?.item ? (
                            viewMode === 'reports' ? (
                                <GovernanceReport
                                    item={itemDetail.item}
                                    date={formatDate(itemDetail.item.archived_at)}
                                    onViewHistory={() => setViewHistoryId(itemDetail.item.original_id)}
                                />
                            ) : (
                                <div key={`data-populated-${itemDetail.item.id}`}>
                                    <div className="px-1 py-1 space-y-2 mb-4 border-b border-slate-50 pb-3">
                                        <div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Label</div>
                                            <div className="text-xs font-bold text-slate-900 mt-0.5">{itemDetail.item.label}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Source Table</div>
                                                <div className="text-[10px] text-slate-600 font-mono mt-0.5">{itemDetail.item.original_table}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Archived</div>
                                                <div className="text-[10px] text-slate-600 font-mono mt-0.5">{formatDate(itemDetail.item.archived_at)}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 mt-2" key={`status-${itemDetail.item.id}`}>
                                            {itemDetail.item.content_hash ? (
                                                <span key="hash-verified" className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 w-fit">
                                                    <ShieldCheck className="w-3 h-3" /> Integrity Verified
                                                </span>
                                            ) : (
                                                <span key="hash-pending" className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                                                    <AlertTriangle className="w-3 h-3" /> Hash Pending
                                                </span>
                                            )}

                                            {itemDetail.item.original_table === 'teams' && (
                                                <button
                                                    key="history-link"
                                                    onClick={() => setViewHistoryId(itemDetail.item.original_id)}
                                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm w-full"
                                                >
                                                    <Activity className="w-3.5 h-3.5" />
                                                    View Action History
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <pre className="text-[11px] text-slate-600 font-mono whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-4 border border-slate-200">
                                        {JSON.stringify(itemDetail.item.data, null, 2)}
                                    </pre>
                                </div>
                            )
                        ) : (
                            <div key="data-loading" className="text-center text-xs text-slate-400 mt-12 animate-pulse font-mono">
                                Decrypting audit record...
                            </div>
                        )}
                    </div>
                </aside>
            )}

            {/* History Modal */}
            <Modal
                isOpen={!!viewHistoryId}
                onClose={() => setViewHistoryId(null)}
                title="Archived Action History"
                maxWidth="max-w-5xl"
            >
                <div className="min-h-[500px]">
                    <Timeline teamId={viewHistoryId} isEmbedded={true} />
                </div>
            </Modal>
        </div>
    );
}

function GovernanceReport({ item, date, onViewHistory }) {
    const { data: activityData, isLoading: activityLoading } = useSWR(`/api/activity?teamId=${item.original_id}`, fetcher);
    const { data: memberData } = useSWR(`/api/archive?category=removed_members`, fetcher);

    const [platformFilter, setPlatformFilter] = useState('all');

    const events = activityData?.events || [];

    // Member Roster Enrichment: Combine archived members + active actors from history
    const roster = useMemo(() => {
        const membersMap = new Map();

        // 1. Add archived members found in the vault
        if (memberData?.items) {
            memberData.items
                .filter(m => m.data?.team_id === item.original_id)
                .forEach(m => {
                    const id = m.data?.user_id || m.original_id;
                    membersMap.set(id, {
                        id,
                        name: m.data?.profiles?.full_name || 'Archived User',
                        email: m.data?.email || m.data?.profiles?.email,
                        role: m.data?.role || 'Member',
                        status: 'archived'
                    });
                });
        }

        // 2. Add actors from activity history (to capture "active" users)
        events.forEach(e => {
            if (e.actorId && !membersMap.has(e.actorId)) {
                membersMap.set(e.actorId, {
                    id: e.actorId,
                    name: e.actor,
                    email: e.rawMetadata?.actor_email,
                    role: 'Active Contributor',
                    status: 'active'
                });
            }
        });

        return Array.from(membersMap.values());
    }, [memberData, events, item.original_id]);

    const filteredEvents = useMemo(() => {
        let baseEvents = events;
        if (platformFilter !== 'all') {
            baseEvents = events.filter(e => {
                const platform = (e.rawMetadata?.platform || (e.channelId?.startsWith('C') ? 'slack' : 'system')).toLowerCase();
                return platform.includes(platformFilter);
            });
        }

        // Grouping logic: Trello > Slack > GitHub
        const priority = { trello: 1, slack: 2, github: 3, system: 4 };
        return [...baseEvents].sort((a, b) => {
            const getP = (e) => {
                const p = (e.rawMetadata?.platform || (e.channelId?.startsWith('C') ? 'slack' : 'system')).toLowerCase();
                if (p.includes('trello')) return 'trello';
                if (p.includes('slack')) return 'slack';
                if (p.includes('git')) return 'github';
                return 'system';
            };
            const pA = priority[getP(a)] || 99;
            const pB = priority[getP(b)] || 99;
            if (pA !== pB) return pA - pB;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
    }, [events, platformFilter]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Header & ID Card */}
            <div className="relative overflow-hidden p-5 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl shadow-blue-900/10">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                    <History className="w-32 h-32 text-white" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Verytis Governance</h3>
                            <div className="text-[10px] text-blue-100 font-medium">Unified Audit Certificate</div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-white leading-tight">{item.label?.replace('Team: ', '')}</h2>
                        <div className="flex items-center gap-2 text-blue-100/80 text-[10px] font-mono">
                            <Hash className="w-3 h-3" /> {item.original_id}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Operational Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <Calendar className="w-4 h-4 text-blue-500 mb-2" />
                    <div className="text-[11px] font-bold text-slate-900 truncate">
                        {item.data?.created_at ? new Date(item.data.created_at).toLocaleDateString() : 'Dec 2025'}
                    </div>
                    <div className="text-[11px] font-bold text-slate-400">to {new Date(item.archived_at).toLocaleDateString()}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Collection Range</div>
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <Users className="w-4 h-4 text-blue-500 mb-2" />
                    <div className="text-xl font-bold text-slate-900">{roster.length || '—'}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Participation</div>
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <Lock className="w-4 h-4 text-blue-500 mb-2" />
                    <div className="text-[10px] font-mono font-bold text-slate-700 truncate">{item.content_hash?.substring(0, 8)}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Integrity Seal</div>
                </div>
            </div>

            {/* 3. Member Roster (Enriched) */}
            <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Team Composition (Roster)</h4>
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="space-y-3">
                    {roster.length > 0 ? roster.map(member => (
                        <div key={member.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border uppercase ${member.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}>
                                    {member.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-slate-900">{member.name}</div>
                                    <div className="text-[9px] text-slate-500">{member.email || 'Historical Actor'}</div>
                                </div>
                            </div>
                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${member.role === 'lead' ? 'text-blue-700 bg-blue-50 border-blue-100' :
                                member.status === 'active' ? 'text-blue-500 bg-blue-50 border-blue-50' :
                                    'text-slate-500 bg-slate-50 border-slate-100'}`}>
                                {member.role}
                            </span>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <Users className="w-6 h-6 text-slate-200 mb-1" />
                            <span className="text-[10px] text-slate-400 italic">No historical members detected.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Audit Trace / Timeline Bridge */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Historical Audit Trace</h4>
                    <div className="flex gap-1.5 pb-1">
                        {['all', 'slack', 'github', 'trello'].map(p => (
                            <button
                                key={p}
                                onClick={() => setPlatformFilter(p)}
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${platformFilter === p
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {activityLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse border border-slate-100" />
                        ))
                    ) : filteredEvents.length > 0 ? (
                        filteredEvents.map(event => (
                            <div key={event.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${(event.rawMetadata?.platform || '').toLowerCase().includes('git') ? 'bg-slate-900' :
                                        (event.rawMetadata?.platform || '').toLowerCase().includes('trello') ? 'bg-blue-500' :
                                            (event.rawMetadata?.platform || (event.channelId?.startsWith('C') ? 'slack' : '')).toLowerCase().includes('slack') ? 'bg-blue-400' :
                                                'bg-blue-600'
                                        }`}>
                                        <Activity className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[11px] font-bold text-slate-900 truncate">{event.action}</span>
                                            <span className="text-[9px] font-mono text-slate-400">{new Date(event.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                                            <span className="text-blue-600 font-bold uppercase text-[8px] tracking-tight">
                                                {(event.rawMetadata?.platform || (event.channelId?.startsWith('C') ? 'slack' : 'system')).toUpperCase()}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                            {event.actor}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <div className="text-[10px] text-slate-400 font-medium">No activity records for this filter.</div>
                        </div>
                    )}
                </div>
            </div>

            {/* 5. Access Bridge Action */}
            <button
                onClick={onViewHistory}
                className="w-full relative group overflow-hidden py-4 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-center gap-2 relative z-10">
                    <Activity className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    Certify Archive Integrity & View Full History
                </div>
            </button>

            <p className="text-[10px] text-center text-slate-400 italic">
                This document is a WORM-certified record from the Verytis Archive Vault.
            </p>
        </div>
    );
}
