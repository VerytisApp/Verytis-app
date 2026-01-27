import { Download } from 'lucide-react';
import { Card, Button } from '../ui';
import { MOCK_SECURITY_LOGS } from '../../data/mockData';

const AdminSecuritySettings = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
        <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Security Logs & Audits</h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-4 py-2">Event</th>
                            <th className="px-4 py-2">User</th>
                            <th className="px-4 py-2">Details</th>
                            <th className="px-4 py-2 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {MOCK_SECURITY_LOGS.map(log => (
                            <tr key={log.id}>
                                <td className="px-4 py-2 font-medium text-slate-900">{log.event}</td>
                                <td className="px-4 py-2 text-slate-600">{log.user}</td>
                                <td className="px-4 py-2 text-slate-500">{log.details}</td>
                                <td className="px-4 py-2 text-right text-slate-400">{log.time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex justify-end">
                <Button variant="secondary" icon={Download}>Download Access Logs</Button>
            </div>
        </Card>

        <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Admin Session Management</h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div>
                        <div className="text-sm font-medium text-slate-900">Current Session (You)</div>
                        <div className="text-xs text-slate-500">IP: 192.168.1.44 • Paris, FR</div>
                    </div>
                </div>
                <Button variant="secondary" className="text-xs h-7 px-2">Log Out</Button>
            </div>
        </Card>
    </div>
);

export default AdminSecuritySettings;
