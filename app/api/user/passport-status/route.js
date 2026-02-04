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

        // 2. Fetch User Profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, organization_id')
            .eq('id', targetUserId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // 3. Check Slack Status (Auto-Match Logic)
        // Check for active Slack integration
        const { data: orgIntegration } = await supabase
            .from('integrations')
            .select('*')
            .eq('organization_id', profile.organization_id || 'org_123')
            .eq('provider', 'slack')
            //.eq('status', 'active') // Status column does not exist!
            .single();

        let slackStatus = { connected: false };
        let debugInfo = { integrationFound: false };

        // Check recursively for token in known locations
        const accessToken = orgIntegration?.access_token || orgIntegration?.settings?.bot_token || orgIntegration?.settings?.access_token;

        if (accessToken) {
            try {
                debugInfo.integrationFound = true;
                debugInfo.hasToken = true;

                // Determine token to use
                const token = accessToken;

                // Call Slack API to get member list
                debugInfo.apiCallAttempted = true;

                // Note: For production with large workspaces, pagination is required.
                const slackResponse = await fetch('https://slack.com/api/users.list', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const slackData = await slackResponse.json();
                debugInfo.apiCallSuccess = slackData.ok;

                if (slackData.ok && slackData.members) {
                    const userEmail = profile.email.toLowerCase().trim();
                    debugInfo.targetEmail = userEmail;
                    debugInfo.memberCount = slackData.members.length;

                    // Find match
                    const match = slackData.members.find(m =>
                        m.profile?.email?.toLowerCase().trim() === userEmail && !m.deleted
                    );

                    if (match) {
                        slackStatus = {
                            connected: true,
                            lastSync: new Date().toISOString(),
                            email: match.profile.email,
                            source: 'auto_match_api',
                            slackId: match.id,
                            workspaceName: 'Slack Workspace' // Could fetch team.info too
                        };
                    } else {
                        slackStatus = {
                            connected: false,
                            reason: 'email_mismatch',
                            message: `User email (${userEmail}) not found in connected Slack workspace.`,
                            userEmail: userEmail
                        };
                    }
                } else {
                    console.error('Slack API error:', slackData.error);
                    slackStatus = {
                        connected: false,
                        reason: 'api_error',
                        message: `Slack API Error: ${slackData.error}`
                    };
                    debugInfo.apiError = slackData.error;
                }
            } catch (apiError) {
                console.error('Slack API call failed:', apiError);
                slackStatus = {
                    connected: false,
                    reason: 'network_error',
                    message: `Network Error: ${apiError.message}`
                };
                debugInfo.networkError = apiError.message;
            }
        } else {
            debugInfo.integrationFound = !!orgIntegration;
            debugInfo.hasToken = false;
            slackStatus = {
                connected: false,
                reason: 'no_integration_token',
                message: "Organization has not connected Slack, or integration is inactive."
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
