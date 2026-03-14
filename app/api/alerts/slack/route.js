import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WebClient } from '@slack/web-api';

// [OBSOLETE - MISE À JOUR MAJEURE DE L'ARCHITECTURE]
// L'envoi direct via Slack Web API est désactivé au profit de l'Orchestrateur API.
// RÈGLE D'OR : EXCLUSIVEMENT via intégrations configurées.

export async function POST(req) {
    return NextResponse.json({ 
        error: "CETTE FONCTION EST DÉFINITIVEMENT OBSOLÈTE ET DÉSACTIVÉE.",
        message: "Veuillez utiliser l'Orchestrateur API et vous assurer que l'intégration Slack est configurée.",
        statut: "RESTRICTION D'ACCÈS"
    }, { status: 410 }); // 410 Gone

    /* --- ANCIEN CODE DÉSACTIVÉ ---
    try {
        // ... code ...
    } catch (error) {
        // ... code ...
    }
    */
}
