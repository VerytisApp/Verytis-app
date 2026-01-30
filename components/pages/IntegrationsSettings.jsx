import { Slack, Mail, Shield, CheckCircle, XCircle, Lock } from 'lucide-react';
import { Card, Button } from '../ui';

const IntegrationsSettings = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-200 pb-2">Active Connections</h3>
                <Card className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#4A154B]/5 rounded border border-[#4A154B]/10">
                                <Slack className="w-5 h-5 text-[#4A154B]" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-sm">Slack</h4>
                                <p className="text-xs text-slate-500">ICARE Corp</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Connected</span>
                        </div>
                    </div>
                    <div className="bg-slate-50/50 rounded p-3 border border-slate-100 space-y-3">
                        <div>
                            <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Authorized Scopes</h5>
                            <ul className="text-xs text-slate-600 space-y-1.5">
                                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-600" /> Public Channels</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-600" /> Reaction Markers</li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Excluded Scopes</h5>
                            <ul className="text-xs text-slate-400 space-y-1.5">
                                <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-slate-400" /> Direct Messages</li>
                                <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-slate-400" /> Private Channels</li>
                            </ul>
                        </div>
                        <div className="pt-2 border-t border-slate-200/50 text-[10px] text-slate-400 text-right">
                            Last Sync: 2 mins ago
                        </div>
                    </div>
                </Card>
                <Card className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded border border-blue-100">
                                <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-sm">Microsoft 365</h4>
                                <p className="text-xs text-slate-500">Metadata Only</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Active</span>
                        </div>
                    </div>
                    <div className="bg-slate-50/50 rounded p-3 border border-slate-100 space-y-3">
                        <div>
                            <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Authorized Scopes</h5>
                            <ul className="text-xs text-slate-600 space-y-1.5">
                                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-600" /> Headers (To/From/Date)</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-600" /> Subject Lines</li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Excluded Scopes</h5>
                            <ul className="text-xs text-slate-400 space-y-1.5">
                                <li className="flex items-center gap-2"><Lock className="w-3 h-3 text-slate-400" /> Email Body</li>
                                <li className="flex items-center gap-2"><Lock className="w-3 h-3 text-slate-400" /> Attachments</li>
                            </ul>
                        </div>
                        <div className="pt-2 border-t border-slate-200/50 text-[10px] text-slate-400 text-right">
                            Last Sync: 30 secs ago
                        </div>
                    </div>
                </Card>
            </div>
            <div className="space-y-6">
                <Card className="p-6 bg-gradient-to-br from-white to-slate-50/50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-6 text-sm">
                        <Shield className="w-4 h-4 text-slate-400" />
                        Transparency & Control
                    </h3>
                    <div className="space-y-4">
                        <p className="text-xs text-slate-600 leading-relaxed">
                            ICARE operates on a principle of "Least Privilege". Administrators cannot decrypt excluded scopes.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="secondary" className="w-full text-xs">Modify Permissions</Button>
                            <Button variant="secondary" className="w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50">Disconnect</Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </div>
);

export default IntegrationsSettings;
