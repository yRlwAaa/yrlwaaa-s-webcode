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
    background: var(--card-bg, white) !important;
    border-radius: 14px;
    padding: 28px;
    line-height: 2;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    border: 1px solid var(--line-divider, rgba(0,0,0,0.08));
  }
  .res-word {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 4px;
    color: #222222 !important;
  }
  .res-phonetic {
    font-size: 15px;
    margin-bottom: 18px;
    color: #777777 !important;
  }
  .res-trans-cn {
    font-size: 20px;
    color: #e67e22 !important;
    font-weight: 600;
    margin-bottom: 16px;
    padding: 8px 14px;
    background: #fef9e7 !important;
    border-radius: 8px;
    border-left: 4px solid #e67e22;
  }
  .res-item {
    margin-bottom: 16px;
  }
  .res-pos {
    display: inline-block;
    background: #eef2ff !important;
    color: #4a6fc9 !important;
    padding: 2px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .res-meaning {
    font-size: 16px;
    color: #333333 !important;
    margin: 4px 0;
  }
  .res-example {
    font-size: 14px;
    color: #888888 !important;
    padding-left: 14px;
    border-left: 3px solid #4a6fc9;
    margin: 6px 0;
    font-style: italic;
  }
  .err-msg {
    text-align: center;
    color: #e74c3c !important;
    padding: 24px;
    font-size: 16px;
  }
  .loading-text {
    text-align: center;
    color: #999999 !important;
    padding: 24px;
  }

  /* 深色模式覆盖 */
  [data-theme="dark"] .res-word,
  html.dark .res-word,
  html[data-theme="dark"] .res-word {
    color: #ffffff !important;
  }
  [data-theme="dark"] .res-phonetic,
  html.dark .res-phonetic,
  html[data-theme="dark"] .res-phonetic {
    color: #cccccc !important;
  }
  [data-theme="dark"] .res-pos,
  html.dark .res-pos,
  html[data-theme="dark"] .res-pos {
    background: #2a2a4a !important;
    color: #8ab4f8 !important;
  }
  [data-theme="dark"] .res-meaning,
  html.dark .res-meaning,
  html[data-theme="dark"] .res-meaning {
    color: #e0e0e0 !important;
  }
  [data-theme="dark"] .res-example,
  html.dark .res-example,
  html[data-theme="dark"] .res-example {
    color: #bbbbbb !important;
  }
  [data-theme="dark"] .loading-text,
  html.dark .loading-text,
  html[data-theme="dark"] .loading-text {
    color: #aaaaaa !important;
  }
</style>

<script>
(function() {
  const input = document.getElementById('wordInput');
  const btn = document.getElementById('searchBtn');
  const result = document.getElementById('result');

  async function search() {
    const word = input.value.trim();
    if (!word) return;

    result.style.display = 'block';
    result.innerHTML = '<div class="loading-text">🔄 查询中...</div>';

    try {
      const [dictRes, transRes] = await Promise.all([
        fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word)),
        fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=en|zh-CN')
      ]);

      const dictData = await dictRes.json();
      const transData = await transRes.json();

      if ((dictData.title === 'No Definitions Found' || !dictData[0]) && !transData.responseData?.translatedText) {
        result.innerHTML = '<div class="err-msg">❌ 未找到该单词，请检查拼写</div>';
        return;
      }

      let html = '<div class="res-word">' + word + '</div>';

      if (transData.responseData?.translatedText) {
        html += '<div class="res-trans-cn">🇨🇳 ' + transData.responseData.translatedText + '</div>';
      }

      if (dictData[0]) {
        const entry = dictData[0];
        const phonetic = entry.phonetic || (entry.phonetics && entry.phonetics[0]?.text) || '';
        
        if (phonetic) {
          html += '<div class="res-phonetic">音标: /' + phonetic + '/</div>';
        }

        entry.meanings.forEach(meaning => {
          html += '<div class="res-item">';
          html += '<span class="res-pos">' + meaning.partOfSpeech + '</span>';
          
          meaning.definitions.slice(0, 4).forEach((def, i) => {
            html += '<div class="res-meaning">' + (i + 1) + '. ' + def.definition + '</div>';
            if (def.example) {
              html += '<div class="res-example">📝 ' + def.example + '</div>';
            }
          });
          
          html += '</div>';
        });
      } else if (transData.responseData?.translatedText) {
        html += '<div class="res-item"><div class="res-meaning">暂无详细释义和例句</div></div>';
      }

      result.innerHTML = html;

    } catch (err) {
      result.innerHTML = '<div class="err-msg">⚠️ 网络请求失败，请检查网络后重试</div>';
    }
  }

  btn.addEventListener('click', search);
  input.addEventListener('keypress', e => {
    if (e.key === 'Enter') search();
  });
})();
</script>