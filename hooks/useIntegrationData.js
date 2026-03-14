import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export const useIntegrationData = (provider, isConnected) => {
    const [data, setData] = useState({
        items: [],
        subItems: [],
        loading: false,
        error: null,
        connectionInfo: null
    });

    const supabase = createClient();

    useEffect(() => {
        if (!isConnected || !provider) return;

        const fetchData = async () => {
            setData(prev => ({ ...prev, loading: true, error: null }));
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('User not found');

                // Get organization_id
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single();

                if (!profile?.organization_id) throw new Error('No organization found');

                setData(prev => ({ ...prev, connectionInfo: { userName: user.email.split('@')[0] } }));

                // Fetch logic based on provider
                if (provider === 'github') {
                    // Logic for fetching repos would go here
                    // For now, mocking data until real API endpoints are ready
                    setData(prev => ({ 
                        ...prev, 
                        items: [
                            { id: '1', name: 'Verytis-AI-Ops' },
                            { id: '2', name: 'internal-automation' }
                        ],
                        loading: false 
                    }));
                } else if (provider === 'slack') {
                    setData(prev => ({ 
                        ...prev, 
                        items: [
                            { id: 'C123', name: 'general' },
                            { id: 'C456', name: 'alerts-critical' }
                        ],
                        loading: false 
                    }));
                } else if (provider === 'trello') {
                    setData(prev => ({ 
                        ...prev, 
                        items: [
                            { id: 'B1', name: 'Product Roadmap' },
                            { id: 'B2', name: 'Growth Experiments' }
                        ],
                        loading: false 
                    }));
                }
            } catch (err) {
                console.error('Error fetching integration data:', err);
                setData(prev => ({ ...prev, loading: false, error: err.message }));
            }
        };

        fetchData();
    }, [provider, isConnected]);

    const fetchSubItems = async (parentId) => {
        if (provider === 'trello' && parentId) {
            setData(prev => ({ ...prev, loading: true }));
            // Mocking list fetch based on board
            setTimeout(() => {
                setData(prev => ({
                    ...prev,
                    subItems: [
                        { id: 'L1', name: 'To Do' },
                        { id: 'L2', name: 'In Progress' }
                    ],
                    loading: false
                }));
            }, 500);
        }
    };

    return { ...data, fetchSubItems };
};
