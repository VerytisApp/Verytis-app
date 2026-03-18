'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    Book, 
    Link as LinkIcon, 
    FileText, 
    Plus, 
    Trash2, 
    CloudUpload, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    ChevronDown, 
    ChevronUp,
    File,
    Globe,
    Database,
    Sparkles,
    Brain
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

export default function KnowledgeBaseSettings({ agentId, orgId, knowledge = {}, onUpdate }) {
    const supabase = createClient();
    const { showToast } = useToast();
    
    // Accordion states
    const [openSections, setOpenSections] = useState({ snippets: true, urls: false, files: false });
    
    // Form states
    const [textSnippet, setTextSnippet] = useState(knowledge.text_snippet || '');
    const [urls, setUrls] = useState(knowledge.urls || []);
    const [newUrl, setNewUrl] = useState('');
    const [files, setFiles] = useState(knowledge.files || []);
    
    // UI states
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    // Initial sync
    useEffect(() => {
        setTextSnippet(knowledge.text_snippet || '');
        setUrls(knowledge.urls || []);
        setFiles(knowledge.files || []);
    }, [knowledge]);


    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleTextChange = (e) => {
        const val = e.target.value.substring(0, 5000);
        setTextSnippet(val);
    };

    const saveText = () => {
        onUpdate({ ...knowledge, text_snippet: textSnippet });
    };

    const addUrl = () => {
        if (!newUrl) return;
        if (urls.length >= 3) {
            showToast({ title: 'Limite atteinte', message: 'Maximum 3 URLs autorisées.', type: 'error' });
            return;
        }
        if (!newUrl.startsWith('http')) {
            showToast({ title: 'URL Invalide', message: 'L\'URL doit commencer par http:// ou https://', type: 'error' });
            return;
        }
        const updated = [...urls, newUrl];
        setUrls(updated);
        setNewUrl('');
        onUpdate({ ...knowledge, urls: updated });
    };

    const removeUrl = (index) => {
        const updated = urls.filter((_, i) => i !== index);
        setUrls(updated);
        onUpdate({ ...knowledge, urls: updated });
    };

    const handleFileUpload = async (e) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        // Validations
        if (files.length >= 3) {
            showToast({ title: 'Limite atteinte', message: 'Maximum 3 fichiers par agent.', type: 'error' });
            return;
        }
        if (uploadedFile.size > 5 * 1024 * 1024) {
            showToast({ title: 'Fichier trop lourd', message: 'La limite est de 5 Mo.', type: 'error' });
            return;
        }
        const allowedExtensions = ['.pdf', '.txt', '.csv', '.md'];
        const ext = uploadedFile.name.substring(uploadedFile.name.lastIndexOf('.')).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            showToast({ title: 'Format non supporté', message: 'Seuls PDF, TXT, CSV et MD sont acceptés.', type: 'error' });
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);

        try {
            const path = `organizations/${orgId}/agents/${agentId}/${uploadedFile.name}`;
            
            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('knowledge')
                .upload(path, uploadedFile, { upsert: true });

            if (error) throw error;

            setUploadProgress(100);
            
            const newFileInfo = {
                name: uploadedFile.name,
                storage_path: path,
                size_bytes: uploadedFile.size
            };

            const updatedFiles = [...files, newFileInfo];
            setFiles(updatedFiles);
            onUpdate({ ...knowledge, files: updatedFiles });

            showToast({ title: 'Succès', message: 'Fichier uploadé avec succès.', type: 'success' });
        } catch (err) {
            console.error('Upload failed:', err);
            showToast({ title: 'Erreur', message: 'Échec de l\'upload : ' + err.message, type: 'error' });
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 1000);
        }
    };

    const removeFile = async (index) => {
        const fileToRemove = files[index];
        try {
            const { error } = await supabase.storage
                .from('knowledge')
                .remove([fileToRemove.storage_path]);

            if (error) throw error;

            const updatedFiles = files.filter((_, i) => i !== index);
            setFiles(updatedFiles);
            onUpdate({ ...knowledge, files: updatedFiles });
            showToast({ title: 'Supprimé', message: 'Le fichier a été retiré.', type: 'success' });
        } catch (err) {
            console.error('Delete failed:', err);
            showToast({ title: 'Erreur', message: 'Impossible de supprimer le fichier.', type: 'error' });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ── BRAND HEADER (Comme une App) ────────────────────────── */}
            <div className="relative pt-6 pb-2 flex flex-col items-center text-center overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-0.5 bg-blue-600 opacity-20" />
                <div className="relative mb-4">
                    <div className="absolute -inset-4 rounded-full bg-blue-600 opacity-5 blur-2xl" />
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl border border-blue-100 flex items-center justify-center overflow-hidden p-3 relative z-10 transition-transform hover:scale-105 duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-50" />
                        <Database className="w-8 h-8 text-blue-600 relative z-10" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-lg border border-slate-50">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        </div>
                    </div>
                </div>
                <div className="space-y-1 relative z-10">
                    <h3 className="text-md font-black text-slate-900 tracking-tight leading-none uppercase">Verytis Knowledge</h3>
                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-[0.2em] leading-none opacity-70">Contextual RAG Engine</p>
                </div>
            </div>

            {/* ── SECTIONS ─────────────────────────────────────────── */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Configurations & Accès</h3>
                    <div className="h-px flex-1 ml-4 bg-blue-600 opacity-10" />
                </div>

                <div className="space-y-2.5">
                    {/* 1. TEXT SNIPPETS */}
                    <div className="border border-slate-200/50 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:border-blue-200">
                        <button 
                            onClick={() => toggleSection('snippets')}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight block">Snippets de texte</span>
                                    <span className="text-[9px] text-slate-400 font-medium">Contenu textuel brut</span>
                                </div>
                            </div>
                            {openSections.snippets ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        {openSections.snippets && (
                            <div className="p-4 pt-0 animate-in fade-in slide-in-from-top-1">
                                <textarea
                                    rows={5}
                                    value={textSnippet}
                                    onChange={handleTextChange}
                                    onBlur={saveText}
                                    className="w-full text-[11px] leading-relaxed font-mono px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-400 transition-all resize-none shadow-inner"
                                    placeholder="Collez ici des informations contextuelles..."
                                />
                                <div className="flex justify-between items-center mt-2 px-1">
                                    <span className={`text-[9px] font-bold uppercase tracking-tight ${textSnippet.length > 4500 ? 'text-rose-500' : 'text-slate-400'}`}>
                                        {textSnippet.length} / 5000 caractères
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. URLs */}
                    <div className="border border-slate-200/50 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:border-blue-200">
                        <button 
                            onClick={() => toggleSection('urls')}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                    <Globe className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight block">URLs de référence</span>
                                    <span className="text-[9px] text-slate-400 font-medium">Sites web & documentations</span>
                                </div>
                            </div>
                            {openSections.urls ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        {openSections.urls && (
                            <div className="p-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-1">
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        placeholder="https://docs.exemple.com"
                                        className="flex-1 text-[11px] px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-all shadow-sm"
                                    />
                                    <button 
                                        onClick={addUrl}
                                        disabled={urls.length >= 3}
                                        className="p-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="space-y-2">
                                    {urls.map((url, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 group transition-all hover:bg-blue-50/30">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                                <span className="text-[10px] text-slate-600 truncate font-bold">{url}</span>
                                            </div>
                                            <button onClick={() => removeUrl(i)} className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {urls.length === 0 && (
                                        <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Aucune URL</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. FILES */}
                    <div className="border border-slate-200/50 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:border-blue-200">
                        <button 
                            onClick={() => toggleSection('files')}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                    <Database className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight block">Fichiers & Stockage</span>
                                    <span className="text-[9px] text-slate-400 font-medium">PDF, CSV, TXT (Supabase)</span>
                                </div>
                            </div>
                            {openSections.files ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        {openSections.files && (
                            <div className="p-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-1">
                                {!agentId ? (
                                    <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100 text-slate-300">
                                            <Database className="w-5 h-5" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase leading-relaxed px-4 tracking-tighter">Sauvegardez l'agent pour activer le stockage</p>
                                    </div>
                                ) : (
                                    <>

                                        {/* Dropzone */}
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${isUploading ? 'bg-blue-50 border-blue-200' : 'bg-slate-50/50 border-slate-200 hover:bg-blue-50/30 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 shadow-inner'}`}
                                        >
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                onChange={handleFileUpload}
                                                accept=".pdf,.txt,.csv,.md"
                                            />
                                            {isUploading ? (
                                                <div className="flex flex-col items-center gap-3 w-full max-w-[140px]">
                                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{uploadProgress}%</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                                        <CloudUpload className="w-6 h-6" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[11px] font-black text-slate-900 uppercase">Fichiers Contextuels</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">PDF, TXT, CSV (5 MO MAX)</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* File List */}
                                        <div className="space-y-2">
                                            {files.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-blue-200 transition-all">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                                                            <File className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[10px] font-black text-slate-900 truncate tracking-tight">{file.name}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[8px] text-slate-400 font-bold font-mono uppercase">
                                                                    {(file.size_bytes / 1024 / 1024).toFixed(2)} MB
                                                                </span>
                                                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                                <span className="text-[8px] text-blue-500 font-black uppercase tracking-widest">Stocké</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeFile(i)} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
