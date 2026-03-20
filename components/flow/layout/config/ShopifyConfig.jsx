import React from 'react';
import { Globe, ChevronRight } from 'lucide-react';

const ShopifyConfig = ({ node }) => {
    return (
        <div className="space-y-4 p-5 bg-emerald-50/30 rounded-3xl border border-emerald-100 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Boutique Connectée</label>
                </div>
                
                {node.data.connectedProviders?.filter(p => (p.provider === 'shopify' || p.id === 'shopify') && p.status === 'Connected').map((conn, idx) => {
                    const shopUrl = conn.metadata?.store_url || '';
                    const adminUrl = shopUrl ? `https://${shopUrl}/admin` : '';
                    const displayName = conn.account_name || shopUrl || 'Boutique Shopify';
                    
                    return (
                        <a 
                            key={idx}
                            href={adminUrl}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group relative flex items-center justify-between p-4 bg-white border border-emerald-100 rounded-2xl hover:border-emerald-400 hover:shadow-md transition-all duration-300"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                    <img 
                                        src="/logos/shopify.svg" 
                                        alt="Shopify"
                                        className="w-6 h-6 object-contain"
                                        onError={(e) => { e.currentTarget.src = `https://www.google.com/s2/favicons?domain=shopify.com&sz=64`; }}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-900 leading-none mb-1">{displayName}</span>
                                    <span className="text-[9px] font-medium text-slate-400 truncate max-w-[140px] italic">{shopUrl}</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </a>
                    );
                })}

                {!node.data.connectedProviders?.some(p => (p.provider === 'shopify' || p.id === 'shopify') && p.status === 'Connected') && (
                    <div className="p-4 text-center border-2 border-dashed border-emerald-100 rounded-2xl">
                        <p className="text-[10px] font-bold text-emerald-700 opacity-60 uppercase tracking-tighter">Boutique non liée</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopifyConfig;
