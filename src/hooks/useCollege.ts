import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Returns the current user's college.
 * All data queries that need college-scoping can use this hook.
 *
 * Usage:
 *   const { college, loading } = useCollege();
 */
export function useCollege() {
    const { user } = useAuth();
    const [college, setCollege] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setCollege(null);
            setLoading(false);
            return;
        }

        const fetchCollege = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('college')
                .eq('id', user.id)
                .maybeSingle();

            if (!error && data) {
                setCollege(data.college ?? null);
            }
            setLoading(false);
        };

        fetchCollege();
    }, [user]);

    return { college, loading };
}
