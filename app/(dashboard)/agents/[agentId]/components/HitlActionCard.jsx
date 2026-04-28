'use client';

import React from 'react';

/**
 * HitlActionCard - A universal, data-driven Human-In-The-Loop component.
 * 
 * @param {Object} payload - The action metadata (label, target_field, type, options, new_value).
 * @param {Function} onExecute - Callback function to trigger validation/refusal.
 * @param {Number} index - The unique index of the message in the chat array.
 * @param {Object} actionRef - Ref to store selected values before execution.
 * @param {String} messageId - The unique ID of the message.
 */
export default function HitlActionCard({ payload, onExecute, index, actionRef, messageId, iconUrl }) {
    if (!payload) return null;

    return (
        <div className="mt-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm animate-in zoom-in-95 duration-500 text-left">
            <div className="flex items-center gap-3 mb-4">
                {iconUrl && (
                    <img src={iconUrl} alt="Integration Logo" className="w-5 h-5 object-contain drop-shadow-sm" />
                )}
                <h4 className="font-bold text-slate-800 text-sm">
                    {payload.label}
                </h4>
            </div>

            {/* Dynamic Rendering Based on Type */}
            <div className="mb-4">
                {payload.type === 'select' && (
                    <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        defaultValue={actionRef.current[index] || payload.new_value || (payload.options?.[0])}
                        onChange={(e) => { actionRef.current[index] = e.target.value; }}
                    >
                        {(payload.options || []).map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                )}

                {payload.type === 'text' && (
                    <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px]"
                        defaultValue={payload.new_value}
                        onChange={(e) => { actionRef.current[index] = e.target.value; }}
                        placeholder="Saisissez ou modifiez la valeur ici..."
                    />
                )}

                {payload.type === 'confirm' && (
                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg text-sm font-medium text-slate-700 shadow-sm leading-relaxed">
                        {payload.new_value}
                    </div>
                )}

                {payload.type === 'multiselect' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(payload.options || []).map(option => (
                            <label key={option} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors group">
                                <input 
                                    type="checkbox" 
                                    className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all"
                                    defaultChecked={Array.isArray(actionRef.current[index]) && actionRef.current[index].includes(option)}
                                    onChange={(e) => {
                                        const current = Array.isArray(actionRef.current[index]) ? actionRef.current[index] : [];
                                        if (e.target.checked) {
                                            actionRef.current[index] = [...current, option];
                                        } else {
                                            actionRef.current[index] = current.filter(v => v !== option);
                                        }
                                    }}
                                />
                                <span className="text-sm text-slate-600 font-bold group-hover:text-slate-800 transition-colors">{option}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Buttons (HITL) */}
            <div className="flex gap-2.5">
                <button 
                    onClick={() => onExecute(payload, true, messageId, index)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-lg shadow-blue-500/10"
                >
                    Valider
                </button>
                <button 
                    onClick={() => onExecute(payload, false, messageId, index)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold py-2 px-4 rounded-lg text-xs transition-all"
                >
                    Refuser
                </button>
            </div>
        </div>
    );
}
