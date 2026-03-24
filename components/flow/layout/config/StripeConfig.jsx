import React from 'react';
import { Sparkles, CreditCard, Building2 } from 'lucide-react';

const StripeConfig = ({ node, theme, onUpdate }) => {
    // Try to find the stripe connection name from the node data
    const stripeConnection = node.data.connectedProviders?.find(p => p.id === 'stripe' || p.domain === 'stripe.com');
    const orgName = stripeConnection?.account_name || stripeConnection?.metadata?.account_name || 'WORKSPACE STRIPE CONNECTÉ';

    return (
        <div className="space-y-6">
            <div className={`flex items-center justify-between p-3 ${theme?.bg || 'bg-slate-600'} rounded-2xl shadow-lg`}>
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/20 rounded-xl shadow-inner">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Mode Automatique</span>
                        <span className="text-[9px] text-white/70 font-bold italic opacity-80">L'Agent choisit la cible</span>
                    </div>
                </div>
                {/* Forced and blocked for Stripe automation */}
                <div className="w-10 h-5 rounded-full transition-all duration-300 relative border-2 bg-white border-white opacity-80 cursor-not-allowed">
                    <div className={`absolute top-0.5 right-0.5 w-3 h-3 rounded-full ${theme?.bg || 'bg-slate-600'} shadow-sm`} />
                </div>
            </div>

            {/* Organization Info Block */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div className="p-2 bg-blue-50 rounded-xl border border-blue-100/50">
                    <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none mb-1">Connexion Active</span>
                    <span className="text-[11px] font-black text-slate-800 tracking-tight uppercase">{orgName}</span>
                </div>
            </div>

            {/* Descriptive Block (matched with Slack style) */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Ciblage Intelligent</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    Par défaut, comme le mode <b>Auto</b> est activé, l'Agent utilisera ses outils de recherche pour identifier dynamiquement la destination la plus pertinente (Checkout, Invoices, Refunds, etc) en fonction du contexte de la requête.
                </p>
            </div>
            
        </div>
    );
};

export default StripeConfig;
