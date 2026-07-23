<script lang="ts">
  import { onMount } from "svelte";

  export let show = false;
  export let onLoginSuccess: () => void = () => {};

  let email = "";
  let password = "";
  let loading = false;
  let errorMsg = "";

  async function handleLogin() {
    if (!email || !password) {
      errorMsg = "请输入邮箱和密码";
      return;
    }

    loading = true;
    errorMsg = "";

    try {
      const supabase = window.supabase;
      if (!supabase) {
        errorMsg = "Supabase 未加载，请刷新页面重试";
        loading = false;
        return;
      }

      const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
      const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      loading = false;

      if (error) {
        errorMsg = error.message;
        return;
      }

      if (data.session) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        show = false;
        onLoginSuccess();
        window.location.reload();
      }
    } catch (err: any) {
      loading = false;
      errorMsg = err.message || "登录失败，请重试";
    }
  }

  async function handleGoogleLogin() {
    try {
      const supabase = window.supabase;
      if (!supabase) {
        errorMsg = "Supabase 未加载，请刷新页面重试";
        return;
      }

      const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
      const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        errorMsg = error.message;
      }
    } catch (err: any) {
      errorMsg = err.message || "Google 登录失败";
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") show = false;
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeyDown);
    
    // 监听自定义事件打开弹窗
    const handleOpenModal = () => {
      show = true;
    };
    document.addEventListener("openLoginModal", handleOpenModal);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("openLoginModal", handleOpenModal);
    };
  });
</script>

{#if show}
  <div class="modal-overlay" on:click={() => show = false}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>🔐 登录</h2>
        <button class="close-btn" on:click={() => show = false}>×</button>
      </div>

      <div class="modal-body">
        {#if errorMsg}
          <div class="error-msg">{errorMsg}</div>
        {/if}

        <input
          type="email"
          placeholder="邮箱"
          bind:value={email}
          on:keydown={(e) => e.key === "Enter" && handleLogin()}
        />
        <input
          type="password"
          placeholder="密码"
          bind:value={password}
          on:keydown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button class="login-btn" on:click={handleLogin} disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </button>

        <div class="divider">或</div>

        <button class="google-btn" on:click={handleGoogleLogin}>
          <svg viewBox="0 0 48 48" width="20" height="20">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.97-5.97z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          使用 Google 登录
        </button>

        <p class="signup-text">
          还没有账号？<a href="/signup">注册</a>
        </p>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease;
  }

  .modal-content {
    background: var(--card-bg, #fff);
    border-radius: 16px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    animation: slideUp 0.3s ease;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 12px;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.3rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--text-secondary);
  }

  .close-btn:hover {
    color: var(--text);
  }

  .modal-body {
    padding: 8px 24px 24px;
  }

  .modal-body input {
    width: 100%;
    padding: 12px 14px;
    margin-bottom: 12px;
    border: 2px solid var(--line-divider, #e0e0e0);
    border-radius: 8px;
    font-size: 14px;
    background: var(--input-bg, #f5f5f5);
    color: var(--text);
    box-sizing: border-box;
  }

  .modal-body input:focus {
    border-color: var(--primary, #4a90d9);
    outline: none;
  }

  .login-btn {
    width: 100%;
    padding: 12px;
    background: var(--primary, #4a90d9);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .login-btn:hover {
    opacity: 0.85;
  }

  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .divider {
    text-align: center;
    color: var(--text-secondary, #999);
    font-size: 13px;
    padding: 16px 0;
    position: relative;
  }

  .divider::before,
  .divider::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: var(--line-divider, #e0e0e0);
  }

  .divider::before { left: 0; }
  .divider::after { right: 0; }

  .google-btn {
    width: 100%;
    padding: 10px;
    background: var(--card-bg, #fff);
    border: 2px solid var(--line-divider, #e0e0e0);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--text);
  }

  .google-btn:hover {
    background: var(--hover-bg, #f0f0f0);
  }

  .signup-text {
    text-align: center;
    font-size: 13px;
    color: var(--text-secondary, #666);
    margin-top: 16px;
  }

  .signup-text a {
    color: var(--primary, #4a90d9);
    text-decoration: none;
  }

  .signup-text a:hover {
    text-decoration: underline;
  }

  .error-msg {
    background: #fee;
    color: #c0392b;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 12px;
    border: 1px solid #f5c6cb;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  [data-theme="dark"] .modal-content {
    background: #1a1a1a;
    border: 1px solid #333;
  }

  [data-theme="dark"] .modal-body input {
    background: #2a2a2a;
    border-color: #444;
    color: #eee;
  }

  [data-theme="dark"] .google-btn {
    border-color: #444;
    background: #2a2a2a;
  }

  [data-theme="dark"] .google-btn:hover {
    background: #333;
  }

  [data-theme="dark"] .error-msg {
    background: #2a1515;
    color: #e74c3c;
    border-color: #442222;
  }
</style>