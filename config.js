// 全国ランキングの接続先（Supabase）。空のままなら「この端末のランキング」になる
// anon / publishable キーはブラウザに公開して良いキー（書き込み制限は supabase/schema.sql の RLS で行う）
window.RANKING = {
  url: "",
  anonKey: ""
};
