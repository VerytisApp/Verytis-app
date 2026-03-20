import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Garde du Corps: Ensures a valid Shopify token is available for the organization.
 * Note: Shopify Offline tokens generally do not expire.
 */
export async function getValidShopifyToken({ organizationId }) {
    if (!organizationId) {
        throw new Error('organizationId must be provided');
    }

    const supabase = createAdminClient();
    
    // Unified search: find the latest Shopify connection for this organization
    const { data: connection, error } = await supabase
        .from('user_connections')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('provider', 'shopify')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('[SHOPIFY HELPER] Error fetching connection:', error.message);
        throw error;
    }

    if (!connection) {
        console.warn(`[SHOPIFY HELPER] No Shopify connection found for organization: ${organizationId}`);
        return null;
    }

    // Shopify access tokens are typically long-lived (offline mode)
    // If we ever support online modes with refresh tokens, logic goes here.
    return connection.access_token;
}
