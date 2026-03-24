import React from 'react';
import { Sparkles, ShoppingBag, ExternalLink } from 'lucide-react';

const ShopifyConfig = ({ node, theme }) => {
    // Collect specific shopify provider info
    const shopifyConnection = node.data.connectedProviders?.find(p => (p.provider === 'shopify' || p.id === 'shopify') && p.status === 'Connected');
    const shopUrl = shopifyConnection?.metadata?.store_url || '';
    const displayName = shopifyConnection?.account_name || shopUrl || 'BOUTIQUE SHOPIFY';
    const adminUrl = shopUrl ? `https://${shopUrl}/admin` : '#';

    return (
        <div className="space-y-6">
            <div className={`flex items-center justify-between p-3 ${theme?.bg || 'bg-emerald-600'} rounded-2xl shadow-lg`}>
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/20 shadow-inner rounded-xl">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Mode Automatique</span>
                        <span className="text-[9px] text-white/70 font-bold italic opacity-80">L'Agent choisit la cible</span>
                    </div>
                </div>
                {/* Forced and blocked for Shopify automation */}
                <div className="w-10 h-5 rounded-full transition-all duration-300 relative border-2 bg-white border-white opacity-80 cursor-not-allowed">
                    <div className={`absolute top-0.5 right-0.5 w-3 h-3 rounded-full ${theme?.bg || 'bg-emerald-600'} shadow-sm`} />
                </div>
            </div>

            {/* Organization Info Block */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100/50">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none mb-1">
                            {shopifyConnection ? 'Connexion Active' : 'Aucune Connexion'}
                        </span>
                        <span className="text-[11px] font-black text-slate-800 tracking-tight uppercase max-w-[140px] truncate">{displayName}</span>
                    </div>
                </div>
                {shopUrl && (
                    <a 
                        href={adminUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all group lg:min-w-fit"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
            </div>

            {/* Descriptive Block */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Ciblage Intelligent</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    Par défaut, comme le mode <b>Auto</b> est activé, l'Agent utilisera ses outils de recherche pour identifier dynamiquement la destination la plus pertinente (Commandes, Clients, Produits) en fonction du contexte de la requête Shopify.
                </p>
            </div>
            
        </div>
    );
};

export default ShopifyConfig;
