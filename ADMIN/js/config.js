// Use var to avoid "already declared" errors in global scope
var SUPABASE_PROJECT_ID = 'eipokhqnemfzuwertewt';
var SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcG9raHFuZW1menV3ZXJ0ZXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDA2NTYsImV4cCI6MjA4MzgxNjY1Nn0.WNTvbflRCmd2QDkCTl0b90yUota9NQMOSzF0TD3w2_o';

// Global variable for the client instance
var supabase;

function initSupabase() {
    // Check if the library factory is available
    // window.supabase is the factory (has .createClient)
    // We check if it.createClient exists to ensure it's not our own instance already
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            const factory = window.supabase;
            // Create the client
            const client = factory.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Assign to global variable
            supabase = client;

            // For extra reliability, also put it on window
            window.supabaseInstance = client;

            // NOTE: We don't overwrite window.supabase here because it might 
            // interfere with the factory if config.js re-runs.
            // But our managers use the 'supabase' variable directly.

            console.log('✅ Supabase client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
        }
    } else if (window.supabase && window.supabase.from) {
        // Already initialized as a client instance
        supabase = window.supabase;
    } else {
        // Library not ready yet, keep retrying
        console.warn('Supabase library not yet loaded, retrying...');
        setTimeout(initSupabase, 50);
    }
}

// Helper to format currency
var formatCurrency = (amount) => {
    return '₦' + (amount || 0).toLocaleString();
};

// Utility to wait for supabase to be ready
var onSupabaseReady = (callback) => {
    if (supabase && typeof supabase.from === 'function') {
        callback(supabase);
    } else {
        setTimeout(() => onSupabaseReady(callback), 50);
    }
};

// Start initialization
initSupabase();

