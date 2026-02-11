import { SWRConfig } from 'swr';

export function SWRProvider({ children }) {
    return (
        <SWRConfig
            value={{
                fetcher: (url) => fetch(url).then(r => r.json()),
                revalidateOnFocus: false,
                revalidateOnReconnect: true,
                dedupingInterval: 5000, // Dedupe requests within 5s
                errorRetryCount: 2,
                errorRetryInterval: 3000,
                // Keep data fresh for 30s
                refreshInterval: 30000,
            }}
        >
            {children}
        </SWRConfig>
    );
}
