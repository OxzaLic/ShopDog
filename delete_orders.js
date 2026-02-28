
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jsarfituazztwybrsunw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzYXJmaXR1YXp6dHd5YnJzdW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNzcxMjQsImV4cCI6MjA4NjY1MzEyNH0.K9WFwNbrTT2_g03hzdlzf-7y0M-XMXn78PVM-24Wgk0";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteOrders() {
    const ids = ['ORD2BPDH7', 'ORD4WD5TI'];
    console.log(`Deleting orders: ${ids.join(', ')}`);

    const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('Error deleting orders:', error);
    } else {
        console.log('Successfully deleted orders');
    }
}

deleteOrders();
