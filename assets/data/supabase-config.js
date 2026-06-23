// Supabase 連線設定（anon key 為公開金鑰，可提交到 GitHub）
// 寫入權限由 RLS + Auth 控管，anon 只能讀。
window.SUPABASE_CONFIG = {
  url: 'https://pjcwiskivlwipvgiaqpz.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqY3dpc2tpdmx3aXB2Z2lhcXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTY2MzUsImV4cCI6MjA5Nzc3MjYzNX0.6gMSL79FscTIqGgfGE5r4711GgAC_mITwf_hz8Q_kLI',
  bucket: 'product-images',
};
