import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided for verification' }, { status: 400 });
        }

        // 1. Lire exactement les octets du PDF fourni par le client
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Refaire un HASH Local (SHA-256) pour comparaison stricte
        const computedHash = crypto.createHash('sha256').update(buffer).digest('hex');

        // 3. Initialiser Supabase et vérifier l'existence du Hash dans l'index
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: record, error } = await supabase
            .from('report_exports')
            .select('created_at, platform, file_url, file_name')
            .eq('file_hash', computedHash)
            .single();

        if (error || !record) {
            console.log("Hash introuvable ou erreur DB:", error);
            // Si la base ne connait pas ce Hash, ce PDF n'a pas été généré par Verytis ou a été falsifié.
            return NextResponse.json({
                status: "invalid",
                message: "This document is NOT verified. Its cryptographic footprint does not exist in our tamper-evident registry.",
                computed_hash: computedHash
            }, { status: 404 });
        }

        // Si le Hash correspond parfaitement
        return NextResponse.json({
            status: "authentic",
            message: "This document is AUTHENTIC and securely anchored.",
            computed_hash: computedHash,
            details: record
        });

    } catch (err) {
        console.error('File verification parsing error:', err);
        return NextResponse.json({ error: 'Server error during digital verification process' }, { status: 500 });
    }
}
