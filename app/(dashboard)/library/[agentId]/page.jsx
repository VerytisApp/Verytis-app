'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { agents } from '@/lib/data/agents';
import {
    ArrowLeft, Shield, CheckCircle2, Copy, Check, Terminal, FileCode2,
    Zap, Key, Lock, AlertTriangle, Blocks, Play, PlusCircle, Link as LinkIcon,
    DollarSign, Ban, Database, Cpu, Info, Heart, Bot
} from 'lucide-react';
import { Card, Button, Modal } from '@/components/ui';
import useSWR from 'swr';
const fetcher = (url) => fetch(url).then(r => r.json());
export default function AgentDetailsPage({ params }) {
    const router = useRouter();
    const agentId = params.agentId;
    const agent = agents.find(a => a.id === agentId);

    // DB Agent fetching
    const { data: dbData } = useSWR(agentId?.length > 20 ? `/api/library/${agentId}` : null, fetcher);
    // Merge static and DB agents
    const resolvedAgent = agent || dbData?.agent;

    const [isCopiedId, setIsCopiedId] = useState(false);
    const [isCopiedCode, setIsCopiedCode] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(''); // Updated dynamically below
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(resolvedAgent?.likes || 0);

    // Report State
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportMessage, setReportMessage] = useState('');
    const [isReporting, setIsReporting] = useState(false);

    // Initial sync
    React.useEffect(() => {
        if (resolvedAgent?.likes !== undefined) setLikesCount(resolvedAgent.likes);
    }, [resolvedAgent]);

    if (!resolvedAgent) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center animate-in fade-in duration-300">
                <Shield className="w-16 h-16 text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Agent Introuvable</h1>
                <p className="text-slate-500 mb-6 text-center max-w-md">L'agent avec l'identifiant <span className="font-mono text-slate-700 bg-slate-200 px-1 py-0.5 rounded">{agentId}</span> n'existe pas ou a été retiré de la librairie.</p>
                <Link href="/library">
                    <Button variant="secondary" icon={ArrowLeft}>Retour à la Librairie</Button>
                </Link>
            </div>
        );
    }

    const copyToClipboard = (text, setter) => {
        navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    const availableLanguages = resolvedAgent?.codeSnippets ? Object.keys(resolvedAgent.codeSnippets) : ['Python'];
    const safeActiveLanguage = activeLanguage && availableLanguages.includes(activeLanguage)
        ? activeLanguage
        : availableLanguages[0];

    const currentCode = resolvedAgent?.codeSnippets ? resolvedAgent.codeSnippets[safeActiveLanguage] : '// Code en cours de chargement...';

    const handleToggleLike = async () => {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            await fetch(`/api/library/${agentId}/like`, { method: 'POST' });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-[calc(100vh-2rem)] bg-slate-50 p-6 pb-20 animate-in fade-in duration-300 relative">

            {/* Header Navigation */}
            <div className="mb-6 flex items-center justify-between">
                <button
                    onClick={() => router.push('/library')}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:shadow"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour à la Librairie
                </button>
            </div>

            {/* Page Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 border border-slate-100/50 mix-blend-multiply pointer-events-none"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className={`w-20 h-20 rounded-2xl flex justify-center items-center shrink-0 shadow-inner ring-1 ring-black/5 ${resolvedAgent.bgColor || 'bg-slate-100'}`}>
                        {resolvedAgent.icon ? <resolvedAgent.icon className={`w-10 h-10 ${resolvedAgent.color || 'text-slate-600'}`} /> : <Bot className="w-10 h-10 text-slate-600" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{resolvedAgent.name}</h1>
                            {resolvedAgent.is_verified && (
                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shadow-sm">
                                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                    Vérifié
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                                {resolvedAgent.category}
                            </span>
                            <span className="text-slate-500 font-medium">Proposé par <span className="text-slate-900">{resolvedAgent.author}</span></span>
                            {/* Like Toggle */}
                            <button
                                onClick={handleToggleLike}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ml-2 ${isLiked
                                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                                    }`}
                            >
                                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                                {likesCount} J'aime
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: Setup & Integration Guide */}
                <div className="lg:col-span-7 space-y-8">

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Blocks className="w-5 h-5 text-blue-600" />
                            Guide d'Intégration
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Découvrez ci-dessous le code source et le prompt système de cet agent. Vous pouvez utiliser ce code dans vos applications avec notre SDK proxy pour que les règles de gouvernance s'appliquent automatiquement, ou l'utiliser comme base d'inspiration.
                        </p>
                    </div>

                    {/* Code Source Viewer */}
                    <Card className="overflow-hidden border-slate-200 shadow-sm">

                        {/* Header Tabs */}
                        <div className="bg-slate-900 px-5 pt-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 pb-2 sm:pb-0">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs ring-1 ring-blue-500/50">
                                    <FileCode2 className="w-3.5 h-3.5" />
                                </div>
                                <h3 className="text-sm font-semibold text-white">Code Source de l'Agent</h3>
                            </div>

                            {/* Actions & Language Selector */}
                            <div className="flex items-center gap-2 pb-2 sm:pb-0">
                                <div className="flex items-center bg-slate-800 p-1 rounded-lg">
                                    {availableLanguages.map(lang => (
                                        <button
                                            key={lang}
                                            onClick={() => setActiveLanguage(lang)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${safeActiveLanguage === lang ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => copyToClipboard(currentCode, setIsCopiedCode)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors ml-2"
                                >
                                    {isCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span className="hidden sm:inline">{isCopiedCode ? 'Copié' : 'Copier'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Code Display */}
                        <div className="bg-[#0D1117] p-5 overflow-x-auto custom-scrollbar max-h-[600px] overflow-y-auto">
                            <pre className="text-sm font-mono leading-relaxed text-slate-300">
                                <code>
                                    {currentCode}
                                </code>
                            </pre>
                        </div>

                        {/* Footer Tips (Integration Guide) */}
                        <div className="bg-blue-50/50 p-6 border-t border-blue-100">
                            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                Comment utiliser ce code ?
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-blue-100/50 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center mb-3 relative z-10">1</div>
                                    <h5 className="font-bold text-slate-900 text-sm mb-1 relative z-10">Copiez le code</h5>
                                    <p className="text-xs text-slate-500 relative z-10">Récupérez le snippet et collez-le dans votre application (ce qui fait tourner votre Agent IA).</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-blue-100/50 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center mb-3 relative z-10">2</div>
                                    <h5 className="font-bold text-slate-900 text-sm mb-1 relative z-10">Créez votre Agent</h5>
                                    <p className="text-xs text-slate-500 relative z-10">Allez dans <span className="font-semibold text-slate-700">Agents IA</span> et générez un Agent ID unique.</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-blue-100/50 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center mb-3 relative z-10">3</div>
                                    <h5 className="font-bold text-slate-900 text-sm mb-1 relative z-10">Liez l'identité</h5>
                                    <p className="text-xs text-slate-500 relative z-10">Placez votre <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-600">agt_live_...</span> dans l'en-tête de votre requête.</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                </div>

                {/* RIGHT COLUMN: Info & Governance */}
                <div className="lg:col-span-5 space-y-6">

                    {/* About */}
                    <Card className="p-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-3">À propos de cet agent</h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-6">
                            {resolvedAgent.description}
                        </p>

                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Fonctions</h4>
                            {resolvedAgent.capabilities?.map((capability, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                    <span className="font-medium leading-snug">{capability}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Governance Policies applied by Verytis */}
                    <Card className="p-6 border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Shield className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Policies Suggérées</h3>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Gouvernance Suggérée</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2 border-t border-slate-100">
                            {/* 1. Budget Limits */}
                            <section>
                                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                                    <DollarSign className="w-3 h-3 text-blue-500" /> budget_limits
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">daily_max_usd</span>
                                        <span className="text-xs font-mono font-medium text-slate-900">50.00</span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">per_request_max_usd</span>
                                        <span className="text-xs font-mono font-medium text-slate-400 italic">null</span>
                                    </div>
                                </div>
                            </section>

                            {/* 2. Action Restrictions */}
                            <section>
                                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                                    <Ban className="w-3 h-3 text-blue-500" /> action_restrictions
                                </h4>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">blocked_actions</span>
                                    <div className="flex gap-1.5 flex-wrap">
                                        <span className="px-1.5 py-0.5 bg-rose-100/50 text-rose-700 border border-rose-200/50 text-[9px] font-mono font-bold rounded">DELETE</span>
                                        <span className="px-1.5 py-0.5 bg-rose-100/50 text-rose-700 border border-rose-200/50 text-[9px] font-mono font-bold rounded">DROP_TABLE</span>
                                    </div>
                                </div>
                            </section>

                            {/* 3. Data Access */}
                            <section>
                                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                                    <Database className="w-3 h-3 text-blue-500" /> data_access
                                </h4>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">forbidden_keywords</span>
                                    <div className="flex gap-1.5 flex-wrap">
                                        <span className="px-1.5 py-0.5 bg-amber-100/50 text-amber-700 border border-amber-200/50 text-[9px] font-mono font-bold rounded">SALARY</span>
                                        <span className="px-1.5 py-0.5 bg-amber-100/50 text-amber-700 border border-amber-200/50 text-[9px] font-mono font-bold rounded">PASSWORD</span>
                                    </div>
                                </div>
                            </section>

                            {/* 4. Output Control */}
                            <section>
                                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                                    <Cpu className="w-3 h-3 text-blue-500" /> output_control
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">min_confidence</span>
                                        <span className="text-xs font-mono font-medium text-slate-900">0.80</span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">max_tokens</span>
                                        <span className="text-xs font-mono font-medium text-slate-900">4096</span>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="mt-5 p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex gap-2.5 items-start">
                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                                Ceci est la configuration recommandée. <strong className="font-bold text-slate-900 block mt-1">À régler à travers l'onglet "Policies" dans votre board Agent IA personnel après l'avoir créé.</strong>
                            </p>
                        </div>
                    </Card>

                </div>
            </div>

            {/* Report Problem Link */}
            <div className="pt-2 pb-6 text-center mt-12">
                <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 font-medium transition-colors flex items-center justify-center gap-1.5 mx-auto opacity-70 hover:opacity-100"
                >
                    🚩 Signaler un problème avec cet agent
                </button>
            </div>

            {/* Report Modal */}
            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Signaler un problème">
                <div className="p-4 space-y-4">
                    <p className="text-sm text-slate-500">
                        Décrivez le problème rencontré avec l'agent <strong>{resolvedAgent?.name}</strong>. Un email sera envoyé à l'équipe de modération de la librairie.
                    </p>
                    <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                        placeholder="Veuillez décrire le comportement inattendu, une faille ou le problème avec ce code..."
                        value={reportMessage}
                        onChange={(e) => setReportMessage(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>Annuler</Button>
                        <Button
                            variant="danger"
                            disabled={isReporting || !reportMessage.trim()}
                            onClick={async () => {
                                setIsReporting(true);
                                try {
                                    const res = await fetch(`/api/library/${agentId}/report`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            message: reportMessage,
                                            agentName: resolvedAgent?.name
                                        })
                                    });

                                    if (res.ok) {
                                        setIsReportModalOpen(false);
                                        setReportMessage('');
                                        alert("Votre signalement a bien été envoyé par email à l'équipe de modération !");
                                    } else {
                                        alert("Erreur lors de l'envoi du signalement. Veuillez réessayer.");
                                    }
                                } catch (error) {
                                    console.error(error);
                                    alert("Erreur de connexion serveur.");
                                } finally {
                                    setIsReporting(false);
                                }
                            }}
                        >
                            {isReporting ? 'Envoi en cours...' : 'Envoyer le signalement'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
