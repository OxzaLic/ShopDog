
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jsarfituazztwybrsunw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzYXJmaXR1YXp6dHd5YnJzdW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNzcxMjQsImV4cCI6MjA4NjY1MzEyNH0.K9WFwNbrTT2_g03hzdlzf-7y0M-XMXn78PVM-24Wgk0";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearLegacyOrdersColumn() {
    console.log('Cleaning up legacy "orders" column in profiles table...');

    // We update all profiles to have an empty orders array
    const { data, error } = await supabase
        .from('profiles')
        .update({ orders: [] })
        .not('id', 'is', null); // Update all

    if (error) {
        console.error('Error cleaning legacy orders:', error);
    } else {
        console.log('Successfully cleared legacy orders column for all users');
    }
}

clearLegacyOrdersColumn();
