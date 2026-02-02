'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function TestDB() {
    const [status, setStatus] = useState('Checking...')
    const [error, setError] = useState(null)

    useEffect(() => {
        async function checkConnection() {
            try {
                const supabase = createClient()
                const { data, error } = await supabase.auth.getSession()

                if (error) throw error

                setStatus('✅ Connexion Supabase Client: OK')
                console.log('Supabase Session:', data)
            } catch (err) {
                console.error('Supabase Error:', err)
                setStatus('❌ Erreur de connexion')
                setError(err.message)
            }
        }

        checkConnection()
    }, [])

    return (
        <div className="p-10 flex flex-col gap-4 items-center justify-center min-h-screen bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-800">Test de Connexion</h1>

            <div className={`p-4 rounded-lg border ${error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <p className={`text-lg font-mono ${error ? 'text-red-700' : 'text-green-700'}`}>
                    {status}
                </p>

                {error && (
                    <p className="mt-2 text-sm text-red-600 font-mono">
                        {error}
                    </p>
                )}
            </div>

            <div className="text-sm text-gray-500 max-w-md text-center">
                Ce test initialise le client Supabase et vérifie si la connexion au projet <code>{process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20)}...</code> est établie.
            </div>
        </div>
    )
}
