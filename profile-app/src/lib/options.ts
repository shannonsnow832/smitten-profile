const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qgctltxcgsnbrdtbhmay.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnY3RsdHhjZ3NuYnJkdGJobWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjgwNTcsImV4cCI6MjA5MDYwNDA1N30.-TS1CofnGMGAj38OrZAvtphbHPXQWZWtysO83_960M4';

let cachedOptions: Record<string, {value: string, label: string}[]> | null = null;
let fetchPromise: Promise<Record<string, {value: string, label: string}[]>> | null = null;

export async function getProfileOptions(): Promise<Record<string, {value: string, label: string}[]>> {
  if (cachedOptions) return cachedOptions;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch(`${SUPABASE_URL}/rest/v1/profile_options?select=category,value,label,sort_order&is_active=eq.true&order=category,sort_order`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  }).then(res => {
    if (!res.ok) throw new Error('Failed to fetch options');
    return res.json();
  }).then((data: any[]) => {
    const grouped: Record<string, {value: string, label: string}[]> = {};
    for (const row of data) {
      if (!grouped[row.category]) {
        grouped[row.category] = [];
      }
      grouped[row.category].push({ value: row.value, label: row.label });
    }
    cachedOptions = grouped;
    return grouped;
  }).catch(err => {
    fetchPromise = null;
    throw err;
  });

  return fetchPromise;
}
