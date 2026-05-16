---
title: 英语词典
published: 2026-05-16
---

<style>
  .dict-wrapper {
    max-width: 650px;
    margin: 60px auto;
    padding: 0 20px;
  }
  .dict-wrapper h1 {
    text-align: center;
    margin-bottom: 30px;
    font-size: 28px;
    color: #333;
  }
  .search-row {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
  }
  #wordInput {
    flex: 1;
    padding: 14px 18px;
    font-size: 16px;
    border: 2px solid #ddd;
    border-radius: 10px;
    outline: none;
    transition: border-color .2s;
  }
  #wordInput:focus {
    border-color: #4a90d9;
  }
  #searchBtn {
    padding: 14px 28px;
    font-size: 16px;
    background: #4a90d9;
    color: #fff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background .2s;
  }
  #searchBtn:hover {
    background: #357abd;
  }
  #result {
    display: none;
    background: #f8f9fb;
    border-radius: 12px;
    padding: 24px;
    line-height: 1.8;
  }
  .res-word {
    font-size: 24px;
    font-weight: 700;
    color: #222;
    margin-bottom: 6px;
  }
  .res-phonetic {
    color: #888;
    font-size: 15px;
    margin-bottom: 16px;
  }
  .res-trans {
    font-size: 18px;
    color: #2c3e50;
    margin-bottom: 14px;
    padding: 12px;
    background: #eef2ff;
    border-radius: 8px;
  }
  .res-examples {
    font-size: 15px;
    color: #555;
  }
  .res-examples p {
    margin: 6px 0;
    padding-left: 12px;
    border-left: 3px solid #4a90d9;
  }
  .err-msg {
    color: #e74c3c;
    text-align: center;
    padding: 20px;
  }
  .loading-text {
    text-align: center;
    color: #999;
    padding: 20px;
  }
  @media (max-width: 500px) {
    .search-row {
      flex-direction: column;
    }
    #searchBtn {
      width: 100%;
    }
  }
</style>

<div class="dict-wrapper">
  <h1>📖 英语词典</h1>
  <div class="search-row">
    <input type="text" id="wordInput" placeholder="输入英语单词，按回车查询..." />
    <button id="searchBtn">查询</button>
  </div>
  <div id="result"></div>
</div>

<script>
(function() {
  var input = document.getElementById('wordInput');
  var btn = document.getElementById('searchBtn');
  var result = document.getElementById('result');

  function search() {
    var word = input.value.trim();
    if (!word) return;

    result.style.display = 'block';
    result.innerHTML = '<div class="loading-text">查询中...</div>';

    fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.title === 'No Definitions Found') {
          result.innerHTML = '<div class="err-msg">未找到该单词的定义</div>';
          return;
        }
        var entry = data[0];
        var phonetic = entry.phonetic || (entry.phonetics[0] && entry.phonetics[0].text) || '';
        var meaning = entry.meanings[0];
        var definitions = meaning.definitions.slice(0, 3);
        
        var html = '<div class="res-word">' + entry.word + '</div>';
        if (phonetic) html += '<div class="res-phonetic">/' + phonetic + '/</div>';
        html += '<div class="res-trans"><strong>' + meaning.partOfSpeech + '</strong></div>';
        
        definitions.forEach(function(def, i) {
          html += '<p>' + (i + 1) + '. ' + def.definition + '</p>';
          if (def.example) html += '<div class="res-examples"><p>例句: ' + def.example + '</p></div>';
        });
        
        result.innerHTML = html;
      })
      .catch(function() {
        result.innerHTML = '<div class="err-msg">查询失败，请检查网络后重试</div>';
      });
  }

  btn.addEventListener('click', search);
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') search();
  });
})();
</script>