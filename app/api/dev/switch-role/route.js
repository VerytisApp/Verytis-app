import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const TEST_ACCOUNTS = {
    Admin: {
        email: 'tychiqueesteve2005@gmail.com',
        password: 'admin123' // You'll need to set this
    },
    Manager: {
        email: 'manager@verytis.test',
        password: 'manager123'
    },
    Member: {
        email: 'member@verytis.test',
        password: 'member123'
    }
};

export async function POST(req) {
    try {
        const { role } = await req.json();

        if (!TEST_ACCOUNTS[role]) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        const account = TEST_ACCOUNTS[role];

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // Sign in with the test account
        const { data, error } = await supabase.auth.signInWithPassword({
            email: account.email,
            password: account.password
        });

        if (error) {
            console.error('Switch role error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            session: data.session,
            user: data.user
        });

    } catch (error) {
        console.error('Switch role API error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
