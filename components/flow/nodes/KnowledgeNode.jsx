import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Book, CheckCircle2, CloudUpload } from 'lucide-react';

const KnowledgeNode = ({ data, isConnectable }) => {
    // Determine status based on data
    const hasKnowledge = data.knowledge_configuration && (
        (data.knowledge_configuration.text_snippet && data.knowledge_configuration.text_snippet.trim().length > 0) ||
        (data.knowledge_configuration.urls && data.knowledge_configuration.urls.length > 0) ||
        (data.knowledge_configuration.files && data.knowledge_configuration.files.length > 0)
    );

    return (
        <div className={`bg-white border-2 rounded-2xl transition-all group overflow-hidden min-w-[240px] shadow-sm ${hasKnowledge ? 'border-blue-200 shadow-blue-500/5' : 'border-dashed border-slate-300'}`}>
            {/* Logo Zone */}
            <div className={`p-4 flex flex-col items-center gap-3 border-b border-slate-100/50 ${hasKnowledge ? 'bg-blue-50/30' : 'bg-slate-50/50'}`}>
                <div className={`w-16 h-16 rounded-2xl transition-all group-hover:scale-110 duration-500 flex items-center justify-center overflow-hidden relative ${hasKnowledge ? 'bg-white shadow-md border border-blue-100' : 'bg-white border-dashed border-2 border-slate-200'}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-50" />
                    <Database className={`w-8 h-8 relative z-10 ${hasKnowledge ? 'text-blue-600' : 'text-slate-300'}`} />
                    {hasKnowledge && (
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-lg border border-slate-50">
                            <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="text-center w-full">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1">
                        VERYTIS KNOWLEDGE
                    </div>
                    <div className={`text-[13px] font-black line-clamp-1 px-4 tracking-tight ${hasKnowledge ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                        {data.label || 'Base de Connaissance'}
                    </div>
                </div>
            </div>

            {/* Content Zone */}
            <div className="px-5 py-4 space-y-3">
                {hasKnowledge ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between text-[11px] font-black text-slate-600 uppercase tracking-tight">
                            <div className="flex items-center gap-2">
                                <Book className="w-3.5 h-3.5 text-blue-500" />
                                <span>Contextual RAG Ready</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {data.knowledge_configuration?.text_snippet && (
                                <div className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md text-[8px] font-bold text-blue-600 uppercase">Text Snippet</div>
                            )}
                             {data.knowledge_configuration?.urls?.length > 0 && (
                                <div className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[8px] font-bold text-indigo-600 uppercase">{data.knowledge_configuration.urls.length} URLs</div>
                            )}
                            {data.knowledge_configuration?.files?.length > 0 && (
                                <div className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md text-[8px] font-bold text-emerald-600 uppercase">{data.knowledge_configuration.files.length} FILES</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="py-2 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-tight">
                            Injectez des données pour enrichir l'intelligence.
                        </p>
                    </div>
                )}
            </div>

            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                className="w-4 h-4 bg-slate-200 border-4 border-white rounded-full transition-all hover:bg-blue-500 z-10 -top-2"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="w-4 h-4 bg-blue-600 border-4 border-white rounded-full transition-all hover:bg-blue-700 z-10 -bottom-2"
            />
        </div>
    );
};

export default memo(KnowledgeNode);
