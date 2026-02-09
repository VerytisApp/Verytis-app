import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { searchParams } = new URL(req.url);
        const impersonateId = searchParams.get('userId'); // DEV ID from Switcher

        let targetUserId;

        // 1. Determine Target User
        if (impersonateId) {
            targetUserId = impersonateId;
        } else {
            // Standard Auth Fallback
            const cookieStore = await cookies();
            const authToken = cookieStore.get('sb-access-token');
            if (authToken) {
                const { data: { user } } = await supabase.auth.getUser(authToken.value);
                targetUserId = user?.id;
            }
        }

        if (!targetUserId) {
            return NextResponse.json({ error: 'User not identified' }, { status: 401 });
        }

        // 2. Fetch User Profile (INCLUDING slack_user_id)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, organization_id, slack_user_id')
            .eq('id', targetUserId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // 3. Get Integration Token
        const { data: orgIntegration } = await supabase
            .from('integrations')
            .select('*')
            .eq('organization_id', profile.organization_id || 'org_123')
            .eq('provider', 'slack')
            .single();

        let slackStatus = { connected: false };
        let debugInfo = { mode: 'init' };

        // Check recursively for token in known locations
        const accessToken = orgIntegration?.access_token || orgIntegration?.settings?.bot_token || orgIntegration?.settings?.access_token;

        // --- STRATEGY A: DATABASE LINK (Confirmed Manual Link) ---
        if (profile.slack_user_id) {
            debugInfo.mode = 'database_link';
            slackStatus = {
                connected: true,
                source: 'database_link',
                slackId: profile.slack_user_id,
                email: 'Linked Account', // Placeholder
                lastSync: new Date().toISOString()
            };

            // Enhance with real data from Slack API if token available
            if (accessToken) {
                try {
                    const slackRes = await fetch(`https://slack.com/api/users.info?user=${profile.slack_user_id}`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    const slackData = await slackRes.json();

                    if (slackData.ok && slackData.user) {
                        slackStatus.email = slackData.user.profile.email;
                        slackStatus.workspaceName = 'Slack Workspace';
                        slackStatus.avatar = slackData.user.profile.image_48;
                    }
                } catch (e) {
                    console.error("Slack Enrichment Error:", e);
                }
            }
        }

        // --- STRATEGY B: AUTO-DISCOVERY (Fallback) ---
        else if (accessToken) {
            debugInfo.mode = 'auto_discovery';
            try {
                // Call Slack API to get member list
                const slackResponse = await fetch('https://slack.com/api/users.list', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                const slackData = await slackResponse.json();

                if (slackData.ok && slackData.members) {
                    const userEmail = profile.email.toLowerCase().trim();

                    // Find match
                    const match = slackData.members.find(m =>
                        m.profile?.email?.toLowerCase().trim() === userEmail && !m.deleted
                    );

                    if (match) {
                        slackStatus = {
                            connected: true, // It's "connected" in terms of visibility, but not linked in DB yet
                            source: 'auto_match_api',
                            slackId: match.id,
                            email: match.profile.email,
                            workspaceName: 'Slack Workspace'
                        };
                    } else {
                        slackStatus = {
                            connected: false,
                            reason: 'email_mismatch',
                            message: `User email (${userEmail}) not found in connected Slack workspace.`,
                            userEmail: userEmail
                        };
                    }
                }
            } catch (apiError) {
                console.error('Slack API call failed:', apiError);
                slackStatus = {
                    connected: false,
                    reason: 'network_error',
                    message: `Network Error: ${apiError.message}`
                };
            }
        } else {
            slackStatus = {
                connected: false,
                reason: 'no_integration_token',
                message: "No Slack integration found."
            };
        }

        // Teams (Statique pour l'instant)
        const teamsStatus = { connected: false };

        return NextResponse.json({
            userId: targetUserId,
            userEmail: profile.email,
            debug: debugInfo,
            connections: {
                slack: slackStatus,
                teams: teamsStatus
            }
        });

    } catch (error) {
        console.error('Error in passport-status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
