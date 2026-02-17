import { NextResponse } from 'next/server';

const { searchParams } = new URL(req.url);
const organizationId = searchParams.get('organizationId');
// If not provided, maybe fallback to test org or fail?
// For now, let's allow it to be optional but encourage providing it.

const state = JSON.stringify({
    type: 'app_install',
    organizationId: organizationId || '5db477f6-c893-4ec4-9123-b12160224f70' // Default to Test Corp for now
});

const appSlug = 'VerytisApp'; // App Name provided by user
const installUrl = `https://github.com/apps/${appSlug}/installations/new?state=${encodeURIComponent(state)}`;

// Note: ensure your GitHub App settings have "Request user authorization (OAuth) during installation" 
// enabled so that the callback receives a 'code' parameter.
return NextResponse.redirect(installUrl);
