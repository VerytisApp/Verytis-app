import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allows up to 60s for PDF upload if Vercel plan supports it

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        const platform = formData.get('platform') || 'Unknown';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 1. Lire le buffer physique du fichier binaire
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Générer le HASH Cryptographique Ultime (SHA-256) du fichier exact
        const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

        const fileName = file.name || `Audit_Report_${Date.now()}.pdf`;
        const filePath = `${platform}/${fileHash}_${fileName}`;

        // 3. Initialiser Supabase (Service Role pour contourner les potentielles RLS et garantir l'upload)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 4. Uploader le fichier dans le bucket "reports" (WORM/Append-Only)
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('reports')
            .upload(filePath, buffer, {
                contentType: 'application/pdf',
                upsert: false // Ne jamais écraser un fichier existant (Sécurité WORM)
            });

        if (uploadError && uploadError.statusCode !== '409') { // 409 means file already exists, which is fine if same hash
            console.error("Storage upload failed:", uploadError);
            return NextResponse.json({ error: 'Failed to securely upload file' }, { status: 500 });
        }

        // Récupérer l'URL Publique (si bucket public, ou signée si privé)
        const { data: urlData } = supabase.storage.from('reports').getPublicUrl(filePath);
        const fileUrl = urlData.publicUrl;

        // 5. Inscrire la Trace indélébile (Hash + Metadata) dans la DB `report_exports`
        const { error: dbError } = await supabase.from('report_exports').insert({
            file_hash: fileHash,
            file_url: fileUrl,
            platform: platform,
            file_name: fileName
        });

        // "duplicate key value violates unique constraint" -> Le hash est déjà en base, c'est ok.
        if (dbError && dbError.code !== '23505') {
            console.error("Database insert failed:", dbError);
            return NextResponse.json({ error: 'Failed to record export footprint' }, { status: 500 });
        }

        return NextResponse.json({
            status: "success",
            hash: fileHash,
            url: fileUrl,
            message: "Report securely hashed and archived."
        });

    } catch (err) {
        console.error('Report upload exception:', err);
        return NextResponse.json({ error: 'Server error during report processing' }, { status: 500 });
    }
}
