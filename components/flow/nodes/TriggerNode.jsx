import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Radio, Copy, Check } from 'lucide-react';

const TriggerNode = ({ data, isConnectable }) => {
    const label = data.label || 'User Request';
    const description = data.description || '';
    const agentId = data.agentId || 'bcb58aa1-31d7-4aa2-a735-c1886662a723'; // Fallback or dynamic
    const webhookUrl = `https://api.verytis-ops.com/api/run/${agentId}`;
    const [copied, setCopied] = useState(false);

    // Dynamic Branding Logic
    const triggerMapping = {
        'google_sheets': 'google.com',
        'slack': 'slack.com',
        'datadog': 'datadoghq.com',
        'webhook': 'zapier.com',
        'email': 'gmail.com',
        'discord': 'discord.com',
        'stripe': 'stripe.com',
        'github': 'github.com',
    };

    const getDomain = () => {
        const combined = (label + ' ' + description).toLowerCase();
        for (const [key, domain] of Object.entries(triggerMapping)) {
            if (combined.includes(key)) return domain;
        }
        return null;
    };

    const domain = getDomain();

    const handleCopy = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all group overflow-hidden min-w-[240px]">
            {/* Minimal Square Header */}
            <div className="p-4 flex flex-col items-center gap-3 border-b border-slate-100 bg-emerald-50/20">
                <div className={`p-3 rounded-2xl transition-all group-hover:scale-110 duration-300 flex items-center justify-center ${domain ? 'bg-white shadow-md border border-slate-100 w-16 h-16 overflow-hidden' : 'bg-emerald-100 text-emerald-600'}`}>
                    {domain ? (
                        <img
                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                            alt={label}
                            className="w-10 h-10 object-contain"
                        />
                    ) : (
                        <Zap className="w-8 h-8 fill-emerald-600" />
                    )}
                </div>
                <div className="text-center px-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50 mb-0.5">
                        Trigger / Entry
                    </div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-1">
                        {label}
                    </div>
                </div>
            </div>

            {/* Content & Webhook URL Zone */}
            <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-500 tracking-tight">Listening for POST...</span>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="text-[9px] font-black uppercase text-slate-400 tracking-tighter px-1">Webhook URL</div>
                    <div className="relative group/copy">
                        <input
                            type="text"
                            readOnly
                            value={webhookUrl}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-1.5 pl-3 pr-10 text-[9px] font-mono text-slate-500 outline-none focus:bg-white focus:border-emerald-200 transition-all"
                        />
                        <button
                            onClick={handleCopy}
                            className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all active:scale-90 ${copied ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm'}`}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                    </div>
                </div>

                <div className="text-[9px] text-slate-400 font-medium leading-tight">
                    {description || 'Entry point for the automated agentic flow.'}
                </div>
            </div>

            {/* Output Handle only for Trigger */}
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-emerald-600 border-2 border-white rounded-full transition-colors hover:bg-emerald-400"
            />
        </div>
    );
};

export default memo(TriggerNode);
