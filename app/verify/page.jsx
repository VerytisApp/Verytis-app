'use client';
import { useState } from 'react';
import { Shield, UploadCloud, CheckCircle, XCircle, Search } from 'lucide-react';
import { Card, Button } from '@/components/ui';

export default function VerificationEngine() {
    const [file, setFile] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setResult(null); // Reset when a new file is picked
        } else {
            alert('Veuillez sélectionner un fichier PDF valide.');
            setFile(null);
        }
    };

    const handleVerify = async () => {
        if (!file) return;

        setIsVerifying(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/reports/verify', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    status: 'authentic',
                    message: data.message,
                    hash: data.computed_hash,
                    details: data.details
                });
            } else {
                setResult({
                    status: 'invalid',
                    message: data.message || "This document is NOT verified.",
                    hash: data.computed_hash
                });
            }
        } catch (error) {
            console.error("Verification error:", error);
            setResult({
                status: 'error',
                message: "A technical error occurred during verification. Please try again.",
            });
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                        <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Cryptographic Verification Engine
                    </h1>
                    <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                        Verify the authenticity of any Verytis Audit Report.
                        Upload the PDF file to recalculate its SHA-256 cryptographic footprint and check it against our tamper-proof WORM registry.
                    </p>
                </div>

                {/* Upload Section */}
                <Card className="p-8 shadow-sm border border-slate-200 bg-white">
                    <div
                        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${file ? 'border-blue-300 bg-blue-50/30' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                            }`}
                    >
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="pdf-upload"
                        />
                        <label
                            htmlFor="pdf-upload"
                            className="cursor-pointer flex flex-col items-center justify-center space-y-4"
                        >
                            <UploadCloud className={`w-12 h-12 ${file ? 'text-blue-500' : 'text-slate-400'}`} />
                            <div className="space-y-1">
                                {file ? (
                                    <>
                                        <p className="font-semibold text-slate-700 text-lg">{file.name}</p>
                                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-medium text-slate-700">Click to select a PDF Audit Report</p>
                                        <p className="text-xs text-slate-500">Only .pdf files are supported for cryptographic checks.</p>
                                    </>
                                )}
                            </div>
                        </label>
                    </div>

                    <div className="mt-8">
                        <Button
                            className="w-full py-4 text-base font-semibold tracking-wide"
                            size="lg"
                            onClick={handleVerify}
                            disabled={!file || isVerifying}
                        >
                            {isVerifying ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Recalculating Cryptographic Footprint...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Search className="w-5 h-5" />
                                    Run Deep Cryptographic Trace
                                </span>
                            )}
                        </Button>
                    </div>
                </Card>

                {/* Results Section */}
                {result && (
                    <div className={`mt-6 animate-in slide-in-from-bottom-4 duration-500 fade-in rounded-xl border p-6 ${result.status === 'authentic' ? 'bg-emerald-50 border-emerald-200' :
                            result.status === 'invalid' ? 'bg-rose-50 border-rose-200' :
                                'bg-slate-100 border-slate-300'
                        }`}>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1">
                                {result.status === 'authentic' ? (
                                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                                ) : result.status === 'invalid' ? (
                                    <XCircle className="w-8 h-8 text-rose-600" />
                                ) : null}
                            </div>
                            <div className="flex-1 space-y-3">
                                <h3 className={`text-lg font-bold ${result.status === 'authentic' ? 'text-emerald-900' :
                                        result.status === 'invalid' ? 'text-rose-900' :
                                            'text-slate-800'
                                    }`}>
                                    {result.status === 'authentic' ? 'Document Authenticity Verified' :
                                        result.status === 'invalid' ? 'Verification Failed. Document is Unrecognized.' :
                                            'System Error'}
                                </h3>

                                <p className={`text-sm leading-relaxed ${result.status === 'authentic' ? 'text-emerald-800' :
                                        result.status === 'invalid' ? 'text-rose-800' :
                                            'text-slate-600'
                                    }`}>
                                    {result.message}
                                </p>

                                {result.hash && (
                                    <div className="mt-4 bg-white/60 p-3 rounded shadow-inner text-xs font-mono break-all text-slate-700 border border-black/5">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1 font-sans">Computed SHA-256 Footprint:</div>
                                        {result.hash}
                                    </div>
                                )}

                                {result.status === 'authentic' && result.details && (
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                                        <div className="space-y-1">
                                            <span className="font-semibold text-emerald-900">Original Platform:</span>
                                            <p className="text-emerald-700 capitalize">{result.details.platform || 'Unknown'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="font-semibold text-emerald-900">Recorded Exact Date:</span>
                                            <p className="text-emerald-700">{new Date(result.details.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
