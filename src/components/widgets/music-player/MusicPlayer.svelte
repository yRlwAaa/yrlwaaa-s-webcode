<script lang="ts">
  import Icon from "@iconify/svelte";
  import { onDestroy, onMount } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { fly } from "svelte/transition";

  // 直接覆盖原配置
  const METING_API = "https://api.injahow.cn/meting";
  const SERVER = "netease";
  const PLAYLIST_ID = "14317071226"; // 你的正确歌单ID
  const TYPE = "playlist";

  // 全局状态
  let playlist: any[] = [];
  let currentIndex = 0;
  let audio: HTMLAudioElement | null = null;
  let isPlaying = false;
  let isLoading = false;
  let currentTime = 0;
  let duration = 0;
  let volume = 0.7;
  let isMuted = false;
  let isShuffled = false;
  let repeatMode: 'none' | 'one' | 'all' = 'none';
  let showPlaylist = false;
  let isExpanded = false;
  let isHidden = false;
  let showError = false;
  let errorMessage = '';

  // 辅助函数
  function formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // 核心API请求
  async function fetchPlaylist() {
    isLoading = true;
    const url = `${METING_API}/?server=${SERVER}&type=${TYPE}&id=${PLAYLIST_ID}`;
    console.log("Fetching playlist:", url);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        playlist = data;
        console.log(`✅ 歌单加载成功，共 ${playlist.length} 首歌`);
        if (playlist.length > 0 && !audio?.src) {
          await playSong(0);
        }
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error: any) {
      console.error('❌ 加载歌单失败:', error);
      showError = true;
      errorMessage = error.message || '加载歌单失败，请稍后重试';
    } finally {
      isLoading = false;
    }
  }

  async function playSong(index: number) {
    if (!playlist.length || index < 0 || index >= playlist.length) return;
    if (audio && audio.src) {
      audio.pause();
    }
    currentIndex = index;
    const song = playlist[currentIndex];
    if (song && song.url) {
      isLoading = true;
      if (!audio) {
        audio = new Audio();
        audio.addEventListener('timeupdate', () => {
          if (audio) currentTime = audio.currentTime;
        });
        audio.addEventListener('durationchange', () => {
          if (audio) duration = audio.duration;
        });
        audio.addEventListener('ended', () => {
          if (repeatMode === 'one') {
            playSong(currentIndex);
          } else if (repeatMode === 'all' || currentIndex < playlist.length - 1) {
            playSong((currentIndex + 1) % playlist.length);
          } else {
            isPlaying = false;
          }
        });
      }
      audio.src = song.url;
      audio.volume = isMuted ? 0 : volume;
      await audio.play();
      isPlaying = true;
      isLoading = false;
    } else {
      console.warn('歌曲URL无效', song);
      showError = true;
      errorMessage = `无法播放: ${song?.name}`;
      isLoading = false;
    }
  }

  function togglePlay() {
    if (!audio || !audio.src) {
      if (playlist.length) playSong(currentIndex);
      return;
    }
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
    } else {
      audio.play();
      isPlaying = true;
    }
  }

  function prev() {
    if (!playlist.length) return;
    let newIndex = currentIndex - 1;
    if (newIndex < 0) newIndex = playlist.length - 1;
    playSong(newIndex);
  }

  function next() {
    if (!playlist.length) return;
    let newIndex = currentIndex + 1;
    if (newIndex >= playlist.length) newIndex = 0;
    playSong(newIndex);
  }

  function setProgress(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audio && duration) audio.currentTime = percent * duration;
  }

  function setVolume(percent: number) {
    let newVol = Math.max(0, Math.min(1, percent));
    volume = newVol;
    if (audio) audio.volume = isMuted ? 0 : volume;
    if (newVol > 0 && isMuted) toggleMute();
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (audio) audio.volume = isMuted ? 0 : volume;
  }

  function toggleShuffle() {
    isShuffled = !isShuffled;
    if (isShuffled) {
      // 简单的洗牌逻辑，可选实现
    }
  }

  function toggleRepeat() {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
    const currentIdx = modes.indexOf(repeatMode);
    repeatMode = modes[(currentIdx + 1) % modes.length];
  }

  function hideError() {
    showError = false;
    errorMessage = '';
  }

  onMount(() => {
    fetchPlaylist();
  });

  onDestroy(() => {
    if (audio) {
      audio.pause();
      audio.src = '';
      audio = null;
    }
  });
</script>

<svelte:window on:keydown={handleVolumeKeyDown} />

{#if showError}
<div class="fixed bottom-20 right-4 z-[60] max-w-sm">
  <div class="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up">
    <Icon icon="material-symbols:error" class="text-xl flex-shrink-0" />
    <span class="text-sm flex-1">{errorMessage}</span>
    <button onclick={hideError} class="text-white/80 hover:text-white transition-colors">
      <Icon icon="material-symbols:close" class="text-lg" />
    </button>
  </div>
</div>
{/if}

<div class="music-player fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out"
     class:expanded={isExpanded} class:hidden-mode={isHidden}>
  <!-- Mini Player UI 简化 -->
  <div class="mini-player">
    <button on:click={togglePlay}>
      {isPlaying ? '⏸️' : '▶️'}
    </button>
    <span>{playlist[currentIndex]?.name} - {playlist[currentIndex]?.artist}</span>
  </div>
</div>

<style>
  .music-player {
    width: 20rem;
    max-width: 20rem;
    min-width: 20rem;
    user-select: none;
  }
  .mini-player {
    position: absolute;
    bottom: 0;
    right: 0;
    background: white;
    padding: 8px 16px;
    border-radius: 40px;
    display: flex;
    gap: 12px;
    align-items: center;
  }
  @media (max-width: 768px) {
    .music-player {
      width: 280px !important;
    }
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>