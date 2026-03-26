import { Sparkles } from 'lucide-react';

const TrelloConfig = ({ node, theme, metadata, isLoadingMetadata, onUpdate, onBoardChange, detectedBrand }) => {
    const config = node.data.config || {};
    const isAuto = config.board_id === 'auto' || config.repo_name === 'auto';

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
                <button
                    onClick={() => {
                        const nextBoard = isAuto ? '' : 'auto';
                        const nextList = isAuto ? '' : 'auto';
                        onUpdate('config', { ...config, board_id: nextBoard, list_id: nextList });
                    }}
                    className={`w-10 h-5 rounded-full transition-all duration-300 relative border-2 ${isAuto ? 'bg-white border-white' : 'bg-black/20 border-black/10 hover:bg-black/30'}`}
                >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${isAuto ? `translate-x-5 ${theme?.bg || 'bg-slate-600'}` : 'translate-x-0.5 bg-white/70'}`} />
                </button>
            </div>

            {!isAuto && (
                <>
                    <div className="space-y-4 p-4 bg-blue-50/30 rounded-2xl border border-blue-100 shadow-sm transition-all">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Tableau Trello (Board)</label>
                            <select
                                value={config.board_id || ''}
                                onChange={e => onBoardChange(e.target.value)}
                                className="w-full text-xs font-bold px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 shadow-sm transition-all"
                            >
                                <option value="">Sélectionner un tableau...</option>
                                {metadata.boards.map(b => (
                                    <option key={b.value} value={b.value}>{b.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className={`space-y-1.5 transition-all duration-500 ${config.board_id ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Liste de destination</label>
                            <select
                                value={config.list_id || ''}
                                onChange={e => onUpdate('config', { ...config, list_id: e.target.value })}
                                className="w-full text-xs font-bold px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 shadow-sm transition-all"
                            >
                                <option value="">{isLoadingMetadata ? 'Chargement...' : 'Sélectionner une liste...'}</option>
                                {metadata.lists.map(l => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                            <p className="text-[9px] text-slate-400 mt-1 italic">L'IA créera les cartes directement dans cette liste.</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TrelloConfig;
