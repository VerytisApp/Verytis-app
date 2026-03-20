import React from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { PanelNumField, PanelTagInput } from './ConfigUtils';

const GovernanceConfig = ({ policies, orgSettings, policiesSaved, onPolicyUpdate, onSavePolicies }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">Politiques de Gouvernance</h3>
                <div className="h-px flex-1 ml-4 bg-rose-600 opacity-10" />
            </div>

            <div className="space-y-6">
                {/* Finance */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 opacity-50">
                        <div className="h-px flex-1 bg-rose-600" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-rose-900">Finance & Quotas</span>
                        <div className="h-px flex-1 bg-rose-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <PanelNumField
                            label="Budget Jour ($)"
                            value={policies.budget_daily_max}
                            onChange={val => onPolicyUpdate('budget_daily_max', val)}
                            placeholder="Ex: 50"
                        />
                        <PanelNumField
                            label="Budget / Req ($)"
                            value={policies.budget_per_request_max}
                            onChange={val => onPolicyUpdate('budget_per_request_max', val)}
                            placeholder="Ex: 1"
                        />
                    </div>
                </div>

                {/* Sécurité */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 opacity-50">
                        <div className="h-px flex-1 bg-rose-600" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-rose-900">Sécurité & Filtres</span>
                        <div className="h-px flex-1 bg-rose-600" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Mots-clés interdits</label>
                        <PanelTagInput
                            tags={policies.forbidden_keywords}
                            mandatoryTags={orgSettings?.global_blocked_keywords || []}
                            onChange={tags => onPolicyUpdate('forbidden_keywords', tags)}
                            placeholder="MOT_CLE"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Actions à valider</label>
                        <PanelTagInput
                            tags={policies.require_approval}
                            mandatoryTags={orgSettings?.global_require_approval || []}
                            onChange={tags => onPolicyUpdate('require_approval', tags)}
                            placeholder="ACTION"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Scopes autorisés</label>
                        <PanelTagInput
                            tags={policies.allowed_scopes}
                            onChange={tags => onPolicyUpdate('allowed_scopes', tags)}
                            placeholder="SCOPE_API"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Actions bloquées</label>
                        <PanelTagInput
                            tags={policies.blocked_actions}
                            onChange={tags => onPolicyUpdate('blocked_actions', tags)}
                            placeholder="BLOCKED_ACTION"
                        />
                    </div>
                </div>

                {/* Fiabilité */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 opacity-50">
                        <div className="h-px flex-1 bg-rose-600" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-rose-900">Fiabilité & Performance</span>
                        <div className="h-px flex-1 bg-rose-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <PanelNumField
                            label="Échecs Max"
                            value={policies.max_consecutive_failures}
                            onChange={val => onPolicyUpdate('max_consecutive_failures', val)}
                            placeholder="3"
                        />
                        <PanelNumField
                            label="Score Confiance"
                            value={policies.min_confidence_score}
                            onChange={val => onPolicyUpdate('min_confidence_score', val)}
                            placeholder="0.8"
                            step="0.1"
                        />
                        <PanelNumField
                            label="Retries Max"
                            value={policies.max_retries}
                            onChange={val => onPolicyUpdate('max_retries', val)}
                            placeholder="5"
                        />
                        <PanelNumField
                            label="Rate Limit / min"
                            value={policies.rate_limit_per_min}
                            onChange={val => onPolicyUpdate('rate_limit_per_min', val)}
                            placeholder="100"
                        />
                    </div>
                </div>

                {/* Planification */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 opacity-50">
                        <div className="h-px flex-1 bg-rose-600" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-rose-900">Heures d'activité</span>
                        <div className="h-px flex-1 bg-rose-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <PanelNumField
                            label="Début (HH)"
                            value={policies.active_hours_start}
                            onChange={val => onPolicyUpdate('active_hours_start', val)}
                            placeholder="08"
                            min={0}
                            max={23}
                        />
                        <PanelNumField
                            label="Fin (HH)"
                            value={policies.active_hours_end}
                            onChange={val => onPolicyUpdate('active_hours_end', val)}
                            placeholder="18"
                            min={0}
                            max={23}
                        />
                    </div>
                </div>

                <button
                    onClick={onSavePolicies}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${policiesSaved ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-md'}`}
                >
                    {policiesSaved ? <><CheckCircle2 className="w-4 h-4" /> Sauvegardé</> : <><Save className="w-4 h-4" /> Appliquer la gouvernance</>}
                </button>
            </div>
        </div>
    );
};

export default GovernanceConfig;
