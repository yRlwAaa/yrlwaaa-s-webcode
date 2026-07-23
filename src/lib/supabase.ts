// 不使用 npm 包，直接通过 CDN 加载 Supabase
// 这个文件只是为了类型提示，实际使用在 LoginModal.svelte 中通过 window.supabase 调用

export interface SupabaseClient {
  auth: {
    signInWithPassword: (params: { email: string; password: string }) => Promise<{
      data: { session: any; user: any };
      error: any;
    }>;
    signUp: (params: { email: string; password: string }) => Promise<{
      data: { user: any };
      error: any;
    }>;
    signInWithOAuth: (params: { provider: string; options: any }) => Promise<{
      data: any;
      error: any;
    }>;
    getSession: () => Promise<{ data: { session: any }; error: any }>;
    getUser: () => Promise<{ data: { user: any }; error: any }>;
    signOut: () => Promise<{ error: any }>;
  };
}

// 获取 Supabase 客户端（从 window 对象获取）
export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!window.supabase) {
    console.warn('Supabase not loaded yet. Please ensure the CDN script is included in Layout.');
    return null;
  }
  return window.supabase;
}

// 兼容旧的导入方式
export const supabase = null;