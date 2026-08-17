<script>
  let chatWindowVisible = false;

  function toggleChat() {
    chatWindowVisible = !chatWindowVisible;
  }

  let inputValue = '';
  let messages = [
    { role: 'bot', content: '你好！我是 yRlwAaa 的 AI 助手，有什么可以帮你的？' }
  ];
  let isLoading = false;

  async function sendMessage() {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    messages.push({ role: 'user', content: text });
    inputValue = '';
    isLoading = true;

    const typingIndex = messages.length;
    messages.push({ role: 'bot', content: '正在输入...' });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }] })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      messages[typingIndex] = { role: 'bot', content: '' };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        messages[typingIndex] = { role: 'bot', content: fullText };
      }
    } catch (err) {
      messages[typingIndex] = { role: 'bot', content: '请求失败，请稍后再试' };
    }
    isLoading = false;
  }
</script>

<div id="ai-assistant" class="ai-assistant-wrapper">
  <button class="ai-fab-btn" on:click={toggleChat}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-5-1.3L3 22l1.3-5A10 10 0 0 1 2 12 10 10 0 0 1 12 2z"/>
      <path d="M8 10h.01M12 10h.01M16 10h.01"/>
    </svg>
  </button>

  {#if chatWindowVisible}
    <div class="ai-chat">
      <div class="ai-chat-header">
        <span>AI 助手</span>
        <button on:click={toggleChat}>✕</button>
      </div>
      <div class="ai-messages">
        {#each messages as msg, index}
          <div class="ai-msg {msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-bot'}">
            {msg.content}
          </div>
        {/each}
      </div>
      <div class="ai-input-area">
        <input type="text" placeholder="输入消息..." bind:value={inputValue} on:keydown={(e) => e.key === 'Enter' && sendMessage()} />
        <button on:click={sendMessage} disabled={isLoading}>发送</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .ai-assistant-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ai-fab-btn {
    width: var(--fab-button-size, 3rem);
    height: var(--fab-button-size, 3rem);
    border-radius: 50%;
    background: var(--card-bg, rgba(255,255,255,0.05));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.12);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary, #667eea);
    transition: all 0.3s ease;
    padding: 0;
    font-size: 1rem;
  }
  .ai-fab-btn:hover {
    background: var(--card-bg, rgba(255,255,255,0.15));
    border-color: var(--primary, #667eea);
    transform: scale(1.05);
  }

  .ai-chat {
    position: fixed;
    bottom: calc(var(--fab-group-bottom, 10rem) + var(--fab-button-size, 3rem) + 2rem);
    right: var(--fab-group-right, 1.5rem);
    width: 380px;
    max-height: 500px;
    background: var(--card-bg, #1a1a2e);
    border-radius: 16px;
    border: 1px solid var(--border-color, rgba(255,255,255,0.08));
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    z-index: 9998;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ai-chat-header {
    padding: 14px 18px;
    background: rgba(255,255,255,0.05);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    color: #ffffff;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ai-chat-header button {
    background: none;
    border: none;
    color: #999;
    font-size: 18px;
    cursor: pointer;
  }
  .ai-chat-header button:hover {
    color: #fff;
  }

  .ai-messages {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    max-height: 350px;
    min-height: 200px;
    display: flex;
    flex-direction: column;
  }
  .ai-msg {
    margin-bottom: 10px;
    padding: 10px 14px;
    border-radius: 12px;
    max-width: 85%;
    word-wrap: break-word;
    font-size: 14px;
    line-height: 1.6;
  }
  .ai-msg-bot {
    background: rgba(255,255,255,0.08);
    color: #ffffff;
    align-self: flex-start;
  }
  .ai-msg-user {
    background: var(--primary, #667eea);
    color: #ffffff;
    align-self: flex-end;
    margin-left: auto;
  }

  .ai-input-area {
    display: flex;
    padding: 12px;
    gap: 8px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .ai-input-area input {
    flex: 1;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.06);
    color: #ffffff;
    outline: none;
  }
  .ai-input-area input::placeholder {
    color: #888;
  }
  .ai-input-area button {
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    background: var(--primary, #667eea);
    color: #ffffff;
    font-weight: 600;
    cursor: pointer;
  }
  .ai-input-area button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .ai-input-area button:hover:not(:disabled) {
    opacity: 0.9;
  }
</style>