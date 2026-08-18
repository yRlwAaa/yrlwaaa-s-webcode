<script>
  import { marked } from 'marked';
  import sanitizeHtml from 'sanitize-html';
  import { onMount } from 'svelte';

  let chatWindowVisible = false;
  let messages = [];
  let input = '';
  let loading = false;
  let msgBox;
  let inputEl;

  let sessionId = crypto.randomUUID();

  // 把聊天窗口传送到 body，避免被悬浮组的 transform 影响 fixed 定位
  function portal(node) {
    document.body.appendChild(node);
    return {};
  }

  onMount(() => {
    // 刷新即新会话，不持久化
  });

  function renderMd(text) {
    return sanitizeHtml(marked.parse(text || ''), {
      allowedTags: ['p','a','strong','em','code','pre','ul','ol','li','h1','h2','h3','h4','blockquote','br','table','thead','tbody','tr','th','td','hr'],
      allowedAttributes: { a: ['href', 'target', 'rel'] },
      transformTags: { a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener' }) },
    });
  }

  function scrollDown() {
    if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;
  }

  function resizeInput() {
    if (!inputEl) return;
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  }

  function toggle() {
    chatWindowVisible = !chatWindowVisible;
    if (chatWindowVisible) {
      messages = [];
    }
  }

  function newSession() {
    sessionId = crypto.randomUUID();
    messages = [];
    input = '';
  }

  async function sendMessage(prefill) {
    const text = (prefill || input).trim();
    if (!text || loading) return;
    input = '';
    if (inputEl) { inputEl.style.height = 'auto'; }
    loading = true;

    messages = [...messages, { role: 'user', content: text, html: null }];
    const aiMsg = { role: 'assistant', content: '', html: '' };
    messages = [...messages, aiMsg];
    scrollDown();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'HTTP ' + res.status);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const payload = trimmed.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            if (json.content) {
              acc += json.content;
              aiMsg.content = acc;
              aiMsg.html = renderMd(acc);
              messages = [...messages];
              scrollDown();
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      aiMsg.content = '出错了：' + e.message;
      messages = [...messages];
    } finally {
      loading = false;
    }
  }

  function onKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="ai-assistant-wrapper">
  <button class="ai-fab-btn" on:click={toggle} title="AI 助手">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-5-1.3L3 22l1.3-5A10 10 0 0 1 2 12 10 10 0 0 1 12 2z"/>
      <path d="M8 10h.01M12 10h.01M16 10h.01"/>
    </svg>
  </button>
</div>

{#if chatWindowVisible}
  <div class="ai-chat" use:portal role="dialog" aria-label="AI 助手">
    <!-- 头部 -->
    <div class="ai-chat-header">
      <div class="ai-chat-brand">
        <div class="ai-avatar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-5-1.3L3 22l1.3-5A10 10 0 0 1 2 12 10 10 0 0 1 12 2z"/>
            <path d="M8 10h.01M12 10h.01M16 10h.01"/>
          </svg>
        </div>
        <div class="ai-brand-info">
          <div class="ai-brand-name">yRlwAaa AI</div>
          <div class="ai-brand-status">
            <span class="ai-status-dot" class:thinking={loading}></span>
            {loading ? '正在思考…' : '在线'}
          </div>
        </div>
      </div>
      <div class="ai-chat-actions">
        <button class="ai-icon-btn" on:click={newSession} title="新对话">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button class="ai-icon-btn ai-close-btn" on:click={toggle} title="关闭">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <!-- 消息区 -->
    <div class="ai-messages" bind:this={msgBox}>
      {#if messages.length === 0}
        <div class="ai-welcome">
          <div class="ai-welcome-avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-5-1.3L3 22l1.3-5A10 10 0 0 1 2 12 10 10 0 0 1 12 2z"/>
              <path d="M8 10h.01M12 10h.01M16 10h.01"/>
            </svg>
          </div>
          <div class="ai-welcome-title">你好，我是 yRlwAaa 的 AI 助手</div>
          <div class="ai-welcome-sub">可以问我网站里的任何内容</div>
          <div class="ai-welcome-chips">
            <button on:click={() => sendMessage('这个网站里有什么？')}>网站里有什么？</button>
            <button on:click={() => sendMessage('最近更新了哪些文章？')}>最近更新了哪些文章？</button>
            <button on:click={() => sendMessage('介绍一下你自己')}>介绍一下你自己</button>
          </div>
        </div>
      {/if}

      {#each messages as msg}
        {#if msg.role === 'user'}
          <div class="ai-row ai-row-user">
            <div class="ai-bubble ai-bubble-user">{msg.content}</div>
          </div>
        {:else}
          <div class="ai-row ai-row-bot">
            <div class="ai-mini-avatar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-5-1.3L3 22l1.3-5A10 10 0 0 1 2 12 10 10 0 0 1 12 2z"/>
                <path d="M8 10h.01M12 10h.01M16 10h.01"/>
              </svg>
            </div>
            <div class="ai-bubble ai-bubble-bot">{@html msg.html}</div>
          </div>
        {/if}
      {/each}

      {#if loading}
        <div class="ai-row ai-row-bot">
          <div class="ai-mini-avatar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-5-1.3L3 22l1.3-5A10 10 0 0 1 2 12 10 10 0 0 1 12 2z"/>
              <path d="M8 10h.01M12 10h.01M16 10h.01"/>
            </svg>
          </div>
          <div class="ai-bubble ai-bubble-bot ai-typing-bubble">
            <span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span>
          </div>
        </div>
      {/if}
    </div>

    <!-- 输入区 -->
    <div class="ai-input-area">
      <textarea
        bind:this={inputEl}
        bind:value={input}
        rows="1"
        placeholder="问我网站里的任何事…（Enter 发送，Shift+Enter 换行）"
        on:keydown={onKeydown}
        on:input={resizeInput}
        disabled={loading}
      ></textarea>
      <button class="ai-send-btn" on:click={() => sendMessage()} disabled={loading || !input.trim()} title="发送">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
      </button>
    </div>
  </div>
{/if}

<style>
  /* =========================================================
     主题色：强调色用 var(--primary)；背景用 color-mix 从主题色派生，
     跟随滑块且比滑块浅，保持深色玻璃质感。
     ========================================================= */

  /* ---------- 悬浮按钮（作为按钮组成员，跟随主题色） ---------- */
  .ai-assistant-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--fab-button-size, 3rem);
    height: var(--fab-button-size, 3rem);
  }
  .ai-fab-btn {
    width: var(--fab-button-size, 3rem);
    height: var(--fab-button-size, 3rem);
    border-radius: 50%;
    background: color-mix(in srgb, var(--primary) 14%, rgba(16, 18, 26, 0.9));
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid color-mix(in srgb, var(--primary) 45%, transparent);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    transition: all 0.25s ease;
    padding: 0;
    box-sizing: border-box;
  }
  .ai-fab-btn:hover {
    background: color-mix(in srgb, var(--primary) 26%, rgba(16, 18, 26, 0.9));
    transform: translateY(-1px);
  }

  /* ---------- 聊天窗口（背景跟随主题色） ---------- */
  .ai-chat {
    position: fixed;
    right: 24px;
    bottom: 24px;
    width: min(560px, calc(100vw - 48px));
    height: min(760px, calc(100dvh - 120px));
    background: color-mix(in srgb, var(--primary) 10%, rgba(16, 18, 26, 0.92));
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid color-mix(in srgb, var(--primary) 30%, rgba(255, 255, 255, 0.1));
    border-radius: 18px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.2);
    z-index: 9998;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: ai-pop 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
  }
  @keyframes ai-pop {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ---------- 头部（背景跟随主题色） ---------- */
  .ai-chat-header {
    padding: 14px 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--primary) 18%, rgba(255, 255, 255, 0.07));
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: color-mix(in srgb, var(--primary) 6%, rgba(20, 22, 32, 0.9));
    flex-shrink: 0;
  }
  .ai-chat-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ai-avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  .ai-brand-name {
    color: #f0f0f2;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
  }
  .ai-brand-status {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #9aa0ad;
    font-size: 11px;
    margin-top: 2px;
  }
  .ai-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #3ddc84;
  }
  .ai-status-dot.thinking {
    background: #f5b041;
    animation: ai-blink 1s infinite;
  }
  @keyframes ai-blink {
    50% { opacity: 0.3; }
  }
  .ai-chat-actions {
    display: flex;
    gap: 4px;
  }
  .ai-icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: none;
    color: #9aa0ad;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .ai-icon-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f0f0f2;
  }
  .ai-close-btn:hover {
    background: rgba(255, 90, 90, 0.15);
    color: #ff7b7b;
  }

  /* ---------- 消息区 ---------- */
  .ai-messages {
    flex: 1;
    padding: 20px 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    scroll-behavior: smooth;
  }
  .ai-messages::-webkit-scrollbar { width: 5px; }
  .ai-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }

  .ai-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 12px;
  }
  .ai-row-user {
    justify-content: flex-end;
  }
  .ai-row-bot {
    justify-content: flex-start;
  }
  .ai-mini-avatar {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
    margin-bottom: 2px;
  }
  .ai-bubble {
    max-width: 82%;
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 14px;
    line-height: 1.65;
    word-wrap: break-word;
    white-space: pre-wrap;
  }
  .ai-bubble-user {
    background: var(--primary);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .ai-bubble-bot {
    background: color-mix(in srgb, var(--primary) 8%, rgba(255, 255, 255, 0.07));
    color: #e8eaef;
    border: 1px solid color-mix(in srgb, var(--primary) 15%, rgba(255, 255, 255, 0.06));
    border-bottom-left-radius: 4px;
  }
  .ai-typing-bubble {
    display: flex;
    gap: 5px;
    padding: 14px 16px;
  }
  .ai-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #8a90a0;
    animation: ai-dot-bounce 1.2s infinite;
  }
  .ai-dot:nth-child(2) { animation-delay: 0.15s; }
  .ai-dot:nth-child(3) { animation-delay: 0.3s; }
  @keyframes ai-dot-bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-5px); opacity: 1; }
  }

  /* Markdown 渲染样式 */
  .ai-bubble-bot :global(p) { margin: 0 0 8px; }
  .ai-bubble-bot :global(p:last-child) { margin: 0; }
  .ai-bubble-bot :global(a) {
    color: color-mix(in srgb, var(--primary) 70%, #fff);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .ai-bubble-bot :global(pre) {
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid color-mix(in srgb, var(--primary) 15%, rgba(255, 255, 255, 0.06));
    padding: 10px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 12.5px;
    margin: 6px 0;
  }
  .ai-bubble-bot :global(code) {
    background: rgba(0, 0, 0, 0.3);
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 12.5px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }
  .ai-bubble-bot :global(pre code) {
    background: none;
    padding: 0;
  }
  .ai-bubble-bot :global(ul), .ai-bubble-bot :global(ol) {
    margin: 4px 0;
    padding-left: 20px;
  }
  .ai-bubble-bot :global(blockquote) {
    margin: 6px 0;
    padding-left: 12px;
    border-left: 3px solid color-mix(in srgb, var(--primary) 50%, transparent);
    color: #b8bdc9;
  }

  /* ---------- 欢迎屏 ---------- */
  .ai-welcome {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px;
    text-align: center;
  }
  .ai-welcome-avatar {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    background: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin-bottom: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
  .ai-welcome-title {
    color: #f0f0f2;
    font-size: 16px;
    font-weight: 600;
  }
  .ai-welcome-sub {
    color: #8a90a0;
    font-size: 13px;
    margin-bottom: 16px;
  }
  .ai-welcome-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  .ai-welcome-chips button {
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--primary) 30%, rgba(255, 255, 255, 0.12));
    background: color-mix(in srgb, var(--primary) 8%, rgba(255, 255, 255, 0.05));
    color: #c8ccd6;
    font-size: 12.5px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ai-welcome-chips button:hover {
    border-color: var(--primary);
    color: #fff;
    background: color-mix(in srgb, var(--primary) 22%, rgba(255, 255, 255, 0.05));
  }

  /* ---------- 输入区（背景跟随主题色） ---------- */
  .ai-input-area {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid color-mix(in srgb, var(--primary) 18%, rgba(255, 255, 255, 0.07));
    background: color-mix(in srgb, var(--primary) 6%, rgba(20, 22, 32, 0.9));
    flex-shrink: 0;
  }
  .ai-input-area textarea {
    flex: 1;
    padding: 11px 14px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--primary) 25%, rgba(255, 255, 255, 0.12));
    background: color-mix(in srgb, var(--primary) 6%, rgba(0, 0, 0, 0.2));
    color: #f0f0f2;
    font-size: 14px;
    line-height: 1.5;
    font-family: inherit;
    outline: none;
    resize: none;
    max-height: 120px;
    transition: border-color 0.2s;
  }
  .ai-input-area textarea:focus {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 12%, rgba(0, 0, 0, 0.2));
  }
  .ai-input-area textarea::placeholder {
    color: #6c7380;
  }
  .ai-send-btn {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    border: none;
    background: var(--primary);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  }
  .ai-send-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  }
  .ai-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }

  /* ---------- 移动端：留出上下空间，卡片式，不全屏 ---------- */
  @media (max-width: 640px) {
    .ai-chat {
      left: 10px;
      right: 10px;
      top: calc(env(safe-area-inset-top) + 64px);
      bottom: calc(env(safe-area-inset-bottom) + 64px);
      width: auto;
      height: auto;
      border-radius: 18px;
      border: 1px solid color-mix(in srgb, var(--primary) 30%, rgba(255, 255, 255, 0.1));
    }
    .ai-bubble {
      max-width: 88%;
    }
    .ai-messages {
      padding: 14px 10px;
    }
  }
</style>