---
title: 英语词典
layout: ../layouts/MainGridLayout.astro
---

<div class="dict-container">
  <div class="search-box">
    <input type="text" id="wordInput" placeholder="输入英语单词，按回车查询..." />
    <button id="searchBtn">🔍 查询</button>
  </div>
  <div id="result" class="result-area" style="display:none;"></div>
</div>

<style>
  .dict-container {
    width: 100%;
    padding: 20px 0;
  }
  .search-box {
    display: flex;
    gap: 12px;
    margin-bottom: 28px;
    justify-content: center;
  }
  .search-box input {
    width: 100%;
    max-width: 480px;
    padding: 14px 20px;
    font-size: 16px;
    border: 2px solid var(--color-border, #e0e0e0);
    border-radius: 12px;
    background: var(--color-bg-card, #fff);
    color: var(--color-text, #333);
    outline: none;
    transition: border-color 0.2s;
  }
  .search-box input:focus {
    border-color: var(--color-primary, #4a90d9);
  }
  .search-box button {
    padding: 14px 24px;
    font-size: 16px;
    background: var(--color-primary, #4a90d9);
    color: #fff;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.2s;
  }
  .search-box button:hover {
    opacity: 0.85;
  }
  .result-area {
    background: var(--color-bg-card, #fff);
    border-radius: 14px;
    padding: 28px;
    line-height: 2;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .res-word {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .res-phonetic {
    color: var(--color-text-secondary, #888);
    font-size: 15px;
    margin-bottom: 18px;
  }
  .res-item {
    margin-bottom: 16px;
  }
  .res-pos {
    display: inline-block;
    background: var(--color-primary-light, #eef2ff);
    color: var(--color-primary, #4a90d9);
    padding: 2px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .res-meaning {
    font-size: 16px;
    color: var(--color-text, #333);
    margin: 4px 0;
  }
  .res-example {
    font-size: 14px;
    color: var(--color-text-secondary, #888);
    padding-left: 14px;
    border-left: 3px solid var(--color-primary, #4a90d9);
    margin: 6px 0;
    font-style: italic;
  }
  .err-msg {
    text-align: center;
    color: #e74c3c;
    padding: 24px;
    font-size: 16px;
  }
  .loading-text {
    text-align: center;
    color: var(--color-text-secondary, #999);
    padding: 24px;
  }
</style>

<script>
(function() {
  const input = document.getElementById('wordInput');
  const btn = document.getElementById('searchBtn');
  const result = document.getElementById('result');

  function search() {
    const word = input.value.trim();
    if (!word) return;

    result.style.display = 'block';
    result.innerHTML = '<div class="loading-text">🔄 查询中...</div>';

    // 使用 MyMemory API 获取中文翻译
    fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=en|zh-CN')
      .then(res => res.json())
      .then(data => {
        if (data.responseStatus !== 200 || !data.responseData.translatedText) {
          result.innerHTML = '<div class="err-msg">❌ 未找到翻译结果，请检查单词拼写</div>';
          return;
        }

        const translation = data.responseData.translatedText;
        const match = data.matches[0];
        
        let html = '<div class="res-word">' + word + '</div>';
        
        // 如果有音标等信息
        if (match && match.segment) {
          html += '<div class="res-phonetic">📖 翻译结果</div>';
        }
        
        html += '<div class="res-item">';
        html += '<div class="res-meaning">🇨🇳 ' + translation + '</div>';
        
        // 尝试获取例句
        if (data.matches && data.matches.length > 0) {
          const matchData = data.matches[0];
          if (matchData['created-by'] === 'MT!') {
            html += '<div class="res-example" style="margin-top:12px;border-left-color:#f39c12;">💡 机器翻译结果，仅供参考</div>';
          }
        }
        
        html += '</div>';
        result.innerHTML = html;
      })
      .catch(() => {
        result.innerHTML = '<div class="err-msg">⚠️ 网络请求失败，请检查网络后重试</div>';
      });
  }

  btn.addEventListener('click', search);
  input.addEventListener('keypress', e => {
    if (e.key === 'Enter') search();
  });
})();
</script>