// supabase-config.js - THAY THẾ VỚI KEY THẬT CỦA BẠN
const SUPABASE_URL = 'https://tkagnktiqdstmsycgamk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYWdua3RpcWRzdG1zeWNnYW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NjY3MzUsImV4cCI6MjA4NTU0MjczNX0.AQTs-WeQ6zMenItpO9Fe1kSTw7XU53sv8JU6A04iLXg';

// Khởi tạo Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        }
    }
});

// Gán vào window để sử dụng toàn cục
window.supabase = supabaseClient;
console.log('✅ Supabase client initialized:', SUPABASE_URL);