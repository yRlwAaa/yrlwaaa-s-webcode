import Key from "../i18nKey";
import type { Translation } from "../translation";

export const ja: Translation = {
	[Key.home]: "ホーム",
	[Key.about]: "このブログについて",
	[Key.archive]: "アーカイブ",
	[Key.search]: "検索",
	[Key.other]: "その他",

	// ナビゲーションバータイトル
	[Key.navLinks]: "リンク",
	[Key.navMy]: "私の",
	[Key.navAbout]: "情報",
	[Key.navOthers]: "その他",

	[Key.tags]: "タグ",
	[Key.categories]: "カテゴリー",
	[Key.recentPosts]: "最近の投稿",
	[Key.postList]: "投稿の一覧",
	[Key.tableOfContents]: "目次",
	[Key.tocEmpty]: "目次はありません",

	// お知らせ
	[Key.announcement]: "お知らせ",
	[Key.announcementClose]: "閉じる",

	[Key.comments]: "コメント",
	[Key.friends]: "友達",
	[Key.friendsSubtitle]: "もっと素敵なウェブサイトを見つける",
	[Key.friendsSearchPlaceholder]: "友達の名前または説明を検索...",
	[Key.friendsFilterAll]: "すべて",
	[Key.friendsNoResults]: "一致する友達が見つかりません",
	[Key.friendsVisit]: "訪問",
	[Key.friendsCopyLink]: "リンク",
	[Key.friendsCopySuccess]: "コピーしました",
	[Key.friendsTags]: "タグ",
	[Key.untitled]: "無題",
	[Key.uncategorized]: "未分類",
	[Key.noTags]: "タグはありません",

	[Key.wordCount]: "文字",
	[Key.wordsCount]: "文字",
	[Key.minuteCount]: "分",
	[Key.minutesCount]: "分",
	[Key.postCount]: "件の投稿",
	[Key.postsCount]: "件の投稿",

	[Key.themeColor]: "テーマの色",

	[Key.lightMode]: "ライト",
	[Key.darkMode]: "ダーク",
	[Key.systemMode]: "システム",

	[Key.more]: "詳細を表示",

	[Key.author]: "著者",
	[Key.publishedAt]: "公開日",
	[Key.license]: "ライセンス",
	[Key.anime]: "視聴したアニメ",
	[Key.diary]: "日記",

	// アニメページ
	[Key.animeTitle]: "視聴したアニメ",
	[Key.animeSubtitle]: "アニメの旅の記録です",
	[Key.animeStatusWatching]: "視聴中",
	[Key.animeStatusCompleted]: "完了",
	[Key.animeStatusPlanned]: "検討中",
	[Key.animeStatusOnHold]: "保留中",
	[Key.animeStatusDropped]: "中断",
	[Key.animeFilterAll]: "すべて",
	[Key.animeYear]: "年",
	[Key.animeStudio]: "スタジオ",
	[Key.animeEmpty]: "アニメのデータはありません",
	[Key.animeEmptyBangumi]:
		"Bangumiの構成またはネットワークの接続を確認してください",
	[Key.animeEmptyBilibili]:
		"Bilibiliの構成またはネットワークの接続を確認してください",
	[Key.animeEmptyLocal]:
		"src/data/anime.tsファイルにアニメの情報を追加してください",
	[Key.animeConfigBilibili]:
		"src/config.tsファイルにBilibiliのvmidを設定してください",
	[Key.animeConfigBangumi]:
		"src/config.tsファイルにBangumiのユーザーIDを設定してください",

	// 日記ページ
	[Key.diarySubtitle]: "いつでも、どこでも生活を共有",
	[Key.diaryNoResults]: "一致するモーメントはありません",
	[Key.diaryCount]: "件の日記のエントリー",

	[Key.diaryTips]: "最新の30件の日記のエントリーのみを表示",
	[Key.diaryMinutesAgo]: "分前",
	[Key.diaryHoursAgo]: "時間前",
	[Key.diaryDaysAgo]: "日前",

	// 404ページ
	[Key.notFound]: "404",
	[Key.notFoundTitle]: "ページが見つかりません",
	[Key.notFoundDescription]:
		"申し訳ありません、アクセスしたページは存在しないか移動されています。",
	[Key.backToHome]: "ホームに戻る",

	// 音楽プレーヤー
	[Key.musicPlayer]: "音楽プレーヤー",
	[Key.musicPlayerShow]: "音楽プレーヤーを表示",
	[Key.musicPlayerHide]: "音楽プレーヤーを非表示",
	[Key.musicPlayerExpand]: "音楽プレーヤーを展開",
	[Key.musicPlayerCollapse]: "音楽プレーヤーを折りたたむ",
	[Key.musicPlayerPause]: "一時停止",
	[Key.musicPlayerPlay]: "再生",
	[Key.musicPlayerPrevious]: "前へ",
	[Key.musicPlayerNext]: "次へ",
	[Key.musicPlayerShuffle]: "シャッフル",
	[Key.musicPlayerRepeat]: "リピート",
	[Key.musicPlayerRepeatOne]: "1曲のみリピート",
	[Key.musicPlayerVolume]: "音量のコントロール",
	[Key.musicPlayerProgress]: "再生状況",
	[Key.musicPlayerCover]: "カバー",
	[Key.musicPlayerPlaylist]: "プレイリスト",
	[Key.musicPlayerLoading]: "読み込み中...",
	[Key.musicPlayerErrorPlaylist]: "プレイリストを取得できませんでした。",
	[Key.musicPlayerErrorSong]:
		"曲の読み込みに失敗しました。次の曲を再生します。",
	[Key.musicPlayerErrorEmpty]: "プレイリストに利用可能な曲がありません。",
	[Key.unknownSong]: "不明な曲",
	[Key.unknownArtist]: "不明なアーティスト",

	// アルバムページ
	[Key.albums]: "アルバム",
	[Key.albumsSubtitle]: "人生の美しい瞬間の記録です",
	[Key.albumsEmpty]: "コンテンツはありません",
	[Key.albumsEmptyDesc]:
		"まだアルバムが作成されていません。美しい思い出を追加しましょう!",
	[Key.albumsBackToList]: "アルバムに戻る",

	// デバイスページ
	[Key.devices]: "デバイス",
	[Key.devicesSubtitle]: "日常的に使用しているデバイスを紹介",
	[Key.devicesViewDetails]: "詳細を表示",
	[Key.albumsPhotoCount]: "件の写真",
	[Key.albumsPhotosCount]: "件の写真",
	[Key.albumsFilterAll]: "すべて",
	[Key.albumsNoResults]: "一致するアルバムはありません",

	// プロジェクトページ
	[Key.projects]: "プロジェクト",
	[Key.projectsSubtitle]: "開発プロジェクトのポートフォリオ",
	[Key.projectsAll]: "すべて",
	[Key.projectsWeb]: "ウェブアプリ",
	[Key.projectsMobile]: "モバイルアプリ",
	[Key.projectsDesktop]: "デスクトップアプリ",
	[Key.projectsOther]: "その他",
	[Key.projectTechStack]: "技術スタック",
	[Key.projectLiveDemo]: "ライブデモ",
	[Key.projectSourceCode]: "ソースコード",
	[Key.projectDescription]: "プロジェクトの説明",
	[Key.projectStatus]: "ステータス",
	[Key.projectStatusCompleted]: "完了",
	[Key.projectStatusInProgress]: "進行中",
	[Key.projectStatusPlanned]: "計画中",
	[Key.projectsTotal]: "プロジェクトの合計",
	[Key.projectsCompleted]: "完了",
	[Key.projectsInProgress]: "進行中",
	[Key.projectsTechStack]: "技術スタック",
	[Key.projectsFeatured]: "注目のプロジェクト",
	[Key.projectsPlanned]: "計画中",
	[Key.projectsDemo]: "ライブデモ",
	[Key.projectsSource]: "ソースコード",
	[Key.projectsVisit]: "プロジェクトを開く",
	[Key.projectsGitHub]: "GitHub",

	// RSSページ
	[Key.rss]: "RSSフィード",
	[Key.rssDescription]: "最新情報を受け取るために購読する",
	[Key.rssSubtitle]:
		"RSSフィードを購読すると最新の記事や更新情報をすぐに確認できます。",
	[Key.rssLink]: "RSSフィードのリンク",
	[Key.rssCopyToReader]: "RSSリーダーへのリンクをコピーします",
	[Key.rssCopyLink]: "コピー",
	[Key.rssLatestPosts]: "最新の投稿",
	[Key.rssWhatIsRSS]: "RSSとは何ですか?",
	[Key.rssWhatIsRSSDescription]:
		"RSS(Really Simple Syndication)は、頻繁に更新されるコンテンツを公開するための標準フォーマットです:",
	[Key.rssBenefit1]:
		"手動でウェブサイトにアクセスすることなく、最新のコンテンツをタイムリーに入手できます",
	[Key.rssBenefit2]: "複数のウェブサイトへの購読を一括で管理できます",
	[Key.rssBenefit3]: "重要な更新情報や記事を見逃すこともありません",
	[Key.rssBenefit4]: "広告なしのクリーンな読書体験を楽しめます",
	[Key.rssHowToUse]:
		"このサイトの購読はFeedly、Inoreaderまたはその他のRSSリーダーの使用をおすすめします。",
	[Key.rssCopied]: "RSSのリンクをクリップボードにコピーしました!",
	[Key.rssCopyFailed]:
		"コピーに失敗しました。リンクを手動で追加してください。",

	// Atomページ
	[Key.atom]: "Atomフィード",
	[Key.atomDescription]: "最新情報を受け取るために購読する",
	[Key.atomSubtitle]:
		"Atomフィードを購読すると最新の記事や更新情報をすぐに確認できます。",
	[Key.atomLink]: "Atomフィードのリンク",
	[Key.atomCopyToReader]: "Atomリーダーへのリンクをコピーします",
	[Key.atomCopyLink]: "コピー",
	[Key.atomLatestPosts]: "最新の投稿",
	[Key.atomWhatIsAtom]: "Atomとは何ですか?",
	[Key.atomWhatIsAtomDescription]:
		"Atom(Atom Syndication Format)はフィードとその項目を記述するためのXMLベースの標準フォーマットです:",
	[Key.atomBenefit1]:
		"手動でウェブサイトにアクセスすることなく、最新のコンテンツをタイムリーに入手できます",
	[Key.atomBenefit2]: "複数のウェブサイトへの購読を一括で管理できます",
	[Key.atomBenefit3]: "重要な更新情報や記事を見逃すこともありません",
	[Key.atomBenefit4]: "広告なしのクリーンな読書体験を楽しめます",
	[Key.atomHowToUse]:
		"このサイトの購読はFeedly、Inoreaderまたはその他のAtomリーダーの使用をおすすめします。",
	[Key.atomCopied]: "Atomのリンクをクリップボードにコピーしました!",
	[Key.atomCopyFailed]:
		"コピーに失敗しました。リンクを手動で追加してください。",

	// 壁紙モード
	[Key.wallpaperBanner]: "バナーモード",
	[Key.wallpaperFullscreen]: "フルスクリーンモード",
	[Key.wallpaperNone]: "壁紙を非表示",

	// スキルページ
	[Key.skills]: "スキル",
	[Key.skillsSubtitle]: "技術スキルと専門知識",
	[Key.skillsFrontend]: "フロントエンド開発",
	[Key.skillsBackend]: "バックエンド開発",
	[Key.skillsDatabase]: "データベース",
	[Key.skillsTools]: "開発ツール",
	[Key.skillsOther]: "その他のスキル",
	[Key.skillLevel]: "熟練度",
	[Key.skillLevelBeginner]: "初心者",
	[Key.skillLevelIntermediate]: "中級者",
	[Key.skillLevelAdvanced]: "上級者",
	[Key.skillLevelExpert]: "専門家",
	[Key.skillExperience]: "経験の合計",
	[Key.skillYears]: "年",
	[Key.skillMonths]: "ヶ月",
	[Key.skillsTotal]: "スキルの合計",
	[Key.skillsExpert]: "エキスパートレベル",
	[Key.skillsAdvanced]: "上級者",
	[Key.skillsIntermediate]: "中級者",
	[Key.skillsBeginner]: "初心者",
	[Key.skillsAdvancedTitle]: "プロフェッショナルスキル",
	[Key.skillsProjects]: "関連プロジェクト",
	[Key.skillsDistribution]: "スキル分布",
	[Key.skillsByLevel]: "レベル別",
	[Key.skillsByCategory]: "カテゴリー別",
	[Key.noData]: "データなし",

	// タイムラインページ
	[Key.timeline]: "タイムライン",
	[Key.timelineSubtitle]: "成長への旅と重要なマイルストーン",
	[Key.timelineEducation]: "教育",
	[Key.timelineWork]: "実務経験",
	[Key.timelineProject]: "プロジェクト経験",
	[Key.timelineAchievement]: "実績",
	[Key.timelinePresent]: "現在",
	[Key.timelineLocation]: "場所",
	[Key.timelineDescription]: "詳細な説明",
	[Key.timelineMonths]: "ヶ月",
	[Key.timelineYears]: "年",
	[Key.timelineTotal]: "合計",
	[Key.timelineProjects]: "プロジェクト",
	[Key.timelineExperience]: "実務経験",
	[Key.timelineCurrent]: "現在のステータス",
	[Key.timelineHistory]: "履歴",
	[Key.timelineAchievements]: "実績",
	[Key.timelineStartDate]: "開始日",
	[Key.timelineDuration]: "期間",

	// パスワード保護
	[Key.passwordProtected]: "パスワードで保護されています",
	[Key.passwordProtectedTitle]:
		"このコンテンツはパスワードで保護されています",
	[Key.passwordProtectedDescription]:
		"保護されたコンテンツを表示するにはパスワードを入力してください。",
	[Key.postEncrypted]: "暗号化済み",
	[Key.passwordPlaceholder]: "パスワードを入力",
	[Key.passwordUnlock]: "ロックを解除",
	[Key.passwordUnlocking]: "ロックを解除中...",
	[Key.passwordIncorrect]: "パスワードが間違っています。再度お試しください。",
	[Key.passwordDecryptError]:
		"復号に失敗しました。パスワードが正しいかどうか確認してください。",
	[Key.passwordRequired]: "パスワードを入力してください。",
	[Key.passwordVerifying]: "認証中...",
	[Key.passwordDecryptFailed]:
		"復号に失敗しました。パスワードを確認してください。",
	[Key.passwordDecryptRetry]: "復号に失敗しました。再度お試しください。",
	[Key.passwordUnlockButton]: "ロックを解除",
	[Key.copyFailed]: "コピーに失敗しました:",
	[Key.syntaxHighlightFailed]: "構文の強調表示が失敗しました:",
	[Key.autoSyntaxHighlightFailed]: "自動構文強調表示が失敗しました:",
	[Key.decryptionError]: "復号中にエラーが発生しました:",
	[Key.passwordHint]: "ヒント",

	// 最終更新時間カード
	[Key.lastModifiedPrefix]: "最終編集からの時間: ",
	[Key.lastModifiedOutdated]: "一部の情報は古い可能性があります",
	[Key.year]: "年",
	[Key.month]: "月",
	[Key.day]: "日",
	[Key.hour]: "時間",
	[Key.minute]: "分",
	[Key.second]: "秒",

	// 統計情報
	[Key.siteStats]: "統計情報",
	[Key.siteStatsPostCount]: "投稿",
	[Key.siteStatsCategoryCount]: "カテゴリー",
	[Key.siteStatsTagCount]: "タグ",
	[Key.siteStatsTotalWords]: "文字数の合計",
	[Key.siteStatsRunningDays]: "稼働日数",
	[Key.siteStatsLastUpdate]: "最終更新",
	[Key.siteStatsDaysAgo]: "{days}日前",
	[Key.siteStatsDays]: "{days}日",

	// カレンダーコンポーネント
	[Key.calendarSunday]: "日",
	[Key.calendarMonday]: "月",
	[Key.calendarTuesday]: "火",
	[Key.calendarWednesday]: "水",
	[Key.calendarThursday]: "木",
	[Key.calendarFriday]: "金",
	[Key.calendarSaturday]: "土",
	[Key.calendarJanuary]: "1月",
	[Key.calendarFebruary]: "2月",
	[Key.calendarMarch]: "3月",
	[Key.calendarApril]: "4月",
	[Key.calendarMay]: "5月",
	[Key.calendarJune]: "6月",
	[Key.calendarJuly]: "7月",
	[Key.calendarAugust]: "8月",
	[Key.calendarSeptember]: "9月",
	[Key.calendarOctober]: "10月",
	[Key.calendarNovember]: "11月",
	[Key.calendarDecember]: "12月",

	// 共有機能
	[Key.shareArticle]: "共有",
	[Key.generatingPoster]: "ポスターを生成中...",
	[Key.copied]: "コピーしました",
	[Key.copyLink]: "リンクをコピー",
	[Key.savePoster]: "ポスターを保存",
	[Key.scanToRead]: "スキャンで読み込む",
	[Key.shareOnSocial]: "共有",
	[Key.shareOnSocialDescription]:
		"この記事が役に立ったときは、ぜひ他の人に共有してください!",

	// プロフィールの統計
	[Key.profileStatsLoading]: "統計を読み込み中...",
	[Key.profileStatsPageViews]: "ページの閲覧",
	[Key.profileStatsVisits]: "訪問",
	[Key.profileStatsUnavailable]: "統計は利用できません",

	// ページ閲覧の統計
	[Key.pageViewsLoading]: "統計を読み込み中...",
	[Key.pageViewsUnavailable]: "統計は利用できません",

	// レイアウト切り替えボタン
	[Key.switchToGridMode]: "グリッド表示に切り替え",
	[Key.switchToListMode]: "リスト表示に切り替え",

	// 関連した投稿とランダムな投稿
	[Key.relatedPosts]: "関連した投稿",
	[Key.randomPosts]: "ランダムな投稿",
	[Key.smartRecommend]: "スマート",
	[Key.randomRecommend]: "ランダム",

	// 音楽ページ
	[Key.musicTitle]: "音楽",
	[Key.musicArtistCount]: "組のアーティスト",
	[Key.musicAlbum]: "アルバム",
	[Key.musicUnknown]: "不明",
	[Key.musicTrackCount]: "曲",
	[Key.musicAlbumCount]: "枚のアルバム",
	[Key.musicDownload]: "ダウンロード",

	// サイト統計 - PV
	[Key.siteStatsTotalVisits]: "総訪問数",
	[Key.siteStatsTodayVisits]: "今日の訪問",

	// 天気
	[Key.weatherLocating]: "位置情報を取得中...",
	[Key.weatherFetching]: "取得中...",
	[Key.weatherLoadFailed]: "読み込み失敗",
	[Key.weatherSearchCity]: "都市を検索...",
	[Key.weatherSearch]: "検索",
	[Key.weatherHigh]: "最高",
	[Key.weatherLow]: "最低",
	[Key.weatherForecast]: "週間予報",
	[Key.weatherToday]: "今日",
	[Key.weatherNotFound]: "都市が見つかりません。英語名またはピンインをお試しください",
	[Key.weatherSunny]: "晴れ",
	[Key.weatherPartlyCloudy]: "晴れ時々曇り",
	[Key.weatherCloudy]: "曇り",
	[Key.weatherOvercast]: "曇天",
	[Key.weatherFog]: "霧",
	[Key.weatherLightRain]: "小雨",
	[Key.weatherModerateRain]: "雨",
	[Key.weatherHeavyRain]: "大雨",
	[Key.weatherFreezingRain]: "着氷性の雨",
	[Key.weatherLightSnow]: "小雪",
	[Key.weatherModerateSnow]: "雪",
	[Key.weatherHeavySnow]: "大雪",
	[Key.weatherSnowGrains]: "霧雪",
	[Key.weatherShowers]: "にわか雨",
	[Key.weatherHeavyShowers]: "強いにわか雨",
	[Key.weatherSnowShowers]: "にわか雪",
	[Key.weatherHeavySnowShowers]: "強いにわか雪",
	[Key.weatherThunderstorm]: "雷雨",
	[Key.weatherSevereThunderstorm]: "激しい雷雨",

	// AI アシスタント
	[Key.aiAssistant]: "AI アシスタント",
	[Key.aiThinking]: "考え中…",
	[Key.aiOnline]: "オンライン",
	[Key.aiNewChat]: "新しいチャット",
	[Key.aiClose]: "閉じる",
	[Key.aiWelcome]: "こんにちは、yRlwAaa の AI アシスタントです",
	[Key.aiWelcomeSub]: "このサイトについて何でも聞いてください",
	[Key.aiPlaceholder]: "このサイトについて質問してください…（Enter で送信、Shift+Enter で改行）",
	[Key.aiSend]: "送信",
	[Key.aiQuick1]: "このサイトには何がありますか？",
	[Key.aiQuick2]: "最新の記事は？",
	[Key.aiQuick3]: "自己紹介をお願いします",
	[Key.aiError]: "エラー: ",

	// ---------- ツールボックス ----------
	[Key.toolsTitle]: "ツール",
	[Key.toolsSubtitle]: "ちょっと便利な小物たち、開けてすぐ使えます",
	[Key.toolsLocal]: "完全ローカル",
	[Key.toolsEmpty]: "まだツールはありません、お楽しみに",
	[Key.toolCrumbTools]: "ツール",
	[Key.toolOr]: "または",
	[Key.toolPick]: "ローカルのファイルを選択",
	[Key.toolDownload]: "ダウンロード",
	[Key.toolZip]: "まとめてダウンロード",
	[Key.toolRerun]: "新しい設定で再変換",
	[Key.toolClear]: "リストを空にする",
	[Key.toolSingleHint]: "各行の右側の「ダウンロード」から 1 つずつ保存することもできます",

	[Key.toolNcmName]: "NCM → FLAC",
	[Key.toolNcmDesc]:
		"NetEase Cloud の .ncm を元の FLAC に戻します。まとめてドロップして ZIP で取得",
	[Key.toolNcmIntro]:
		".ncm は NetEase Cloud Music クライアントがダウンロードファイルに被せた暗号化コンテナで、中身は元の音声ストリームそのものです（ロスレス音源なら本物の FLAC）。このツールはブラウザ内で外殻を剥がし、元の FLAC をそのまま取り出します。再エンコードは一切行わないので、音質は元ファイルと完全に同一です。複数選択とドラッグに対応し、処理後は ZIP でまとめてダウンロードできます。すべてこのページ内で完結し、ファイルはサーバーに送信されません。",
	[Key.toolNcmTags]: "音声|ロスレス|完全ローカル",
	[Key.toolNcmDropTitle]: ".ncm ファイルをここにドロップ",
	[Key.toolNcmDropSub]:
		"複数まとめて選択できます · 復号はすべてブラウザ内、ファイルは送信されません",
	[Key.toolNcmOptLossless]: "ロスレスのみ（MP3 / M4A などの非可逆音源はスキップ）",
	[Key.toolNcmOptCover]: "アルバムアートを含める（各音声と同名の .jpg）",
	[Key.toolNcmFoot]:
		"復号と梱包はブラウザのメモリ内で完結します。通信も送信も記録もありません。ご自身が正当に入手したファイルにのみお使いください。",
	[Key.toolNcmSkip]: "非可逆音声（{format}）、設定によりスキップ",

	[Key.toolImgName]: "画像変換",
	[Key.toolImgDesc]:
		"jpg / png / gif / avif / svg を WebP・PNG へ一括変換。最大幅と品質を指定可能",
	[Key.toolImgIntro]:
		"さまざまな画像形式を Web 向けの WebP / PNG / JPEG に変換し、ついでにサイズも落とせます。Web 画像で本当に通信量を食うのは形式よりも画素数で、4000px の写真を 1600px に縮めるだけで 8〜9 割の容量が減り、形式変換でさらに 2〜3 割減ります。画像をドロップして出力形式・最大幅・品質を選ぶだけ。処理後は ZIP でまとめてダウンロードできます。すべてブラウザ内で完結し、画像はサーバーに送信されません。",
	[Key.toolImgTags]: "画像|WebP|完全ローカル",
	[Key.toolImgDropTitle]: "画像をここにドロップ",
	[Key.toolImgDropSub]: "複数まとめて選択できます · 変換はすべてブラウザ内、送信されません",
	[Key.toolImgFormat]: "出力形式",
	[Key.toolImgMaxWidth]: "最大幅",
	[Key.toolImgKeepSize]: "元のサイズのまま",
	[Key.toolImgQuality]: "品質",
	[Key.toolImgLossless]: "ロスレス",
	[Key.toolImgUnavailable]: "（使用不可）",
	[Key.toolImgHintWebp]: "WebP は容量と品質のバランスが良く、Web 画像の第一候補です",
	[Key.toolImgHintPng]:
		"PNG はロスレスですが通常 WebP より大きめ。スクリーンショットや線画、透過が必要なときに",
	[Key.toolImgHintJpeg]: "JPEG は透過に対応しないため、透明部分は白で塗られます",
	[Key.toolImgHintAvif]: "AVIF は最も小さくなりますが、エンコードが遅く古いブラウザでは未対応のことがあります",
	[Key.toolImgFoot]:
		"デコードとエンコードはブラウザ内で完結します。通信も送信もありません。注意: iPhone の HEIC/HEIF はブラウザでデコードできないため、先にスマホ側で JPG に書き出してください。アニメ GIF は 1 フレーム目のみ取り出します。",

	[Key.toolStatusQueued]: "待機中",
	[Key.toolStatusReading]: "ファイルを読み込み中…",
	[Key.toolStatusDecrypting]: "復号中…",
	[Key.toolStatusDecoding]: "デコード中…",
	[Key.toolStatusWorking]: "処理中 {done} / {total} · {name}",
	[Key.toolStatusDoneNcm]:
		"{n} 曲完了 · 各行右側の「ダウンロード」で個別保存、または下の ZIP でまとめて保存",
	[Key.toolStatusDoneImg]:
		"{n} 枚完了 · 各行右側の「ダウンロード」で個別保存、または下の ZIP でまとめて保存",
	[Key.toolStatusSaved]: "保存しました: {name}",
	[Key.toolStatusZipping]: "{n} 件を梱包中…",
	[Key.toolStatusZipSaved]: "ZIP を保存しました · {n} 件 · {size}",
	[Key.toolStatusNoOutputNcm]: "出力できる音声がありません",
	[Key.toolStatusNoOutputImg]: "出力できる画像がありません",
	[Key.toolStatusIgnored]: "対象外の形式 {n} 件を無視しました",
	[Key.toolStatusNothing]: "ファイルが選択されていません",
	[Key.toolStatusZipFail]: "梱包に失敗: ",
	[Key.toolStatusRerun]: "設定が変更されました。「新しい設定で再変換」を押してください",
	[Key.toolStatusStale]: "このページは古い版です。Ctrl+F5 で強制再読み込みしてください",
	[Key.toolCoreMissing]: "コアスクリプトの読み込みに失敗しました。Ctrl+F5 で強制再読み込みしてください",
	[Key.toolZipWarn]:
		"合計 {size}。梱包には追加のメモリが必要で、時間がかかることがあります。\n続行しますか？ 各行右側の「ダウンロード」で個別保存もできます。",
	[Key.toolFail]: "失敗",
	[Key.toolSkipped]: "スキップ",
	[Key.toolStatusProcessing]: "処理中",
	[Key.toolStatusVerMismatch]:
		"このページは古い版です(ページ v{page} / スクリプト v{script})。Ctrl+F5 で強制再読み込みしてください",
	[Key.toolKitMissing]:
		"共通ライブラリの読み込みに失敗しました。Ctrl+F5 でページを強制再読み込みしてください",
	[Key.toolPctSaved]: " · {n}% 削減",
	[Key.toolPctBigger]: " · {n}% 増加",
	[Key.toolSumInOutNcm]: "{n} 曲 · 入力 {in} → 出力 {out}",
	[Key.toolSumInOutImg]: "{n} 枚 · 入力 {in} → 出力 {out}",
	[Key.toolSumInNcm]: "{n} 曲 · 入力合計 {in}",
	[Key.toolSumInImg]: "{n} 枚 · 入力合計 {in}",
	[Key.toolSumDecrypting]: " · 復号中…",
	[Key.toolSumConverting]: " · 変換中…",
	[Key.toolSumFailNcm]: " · {n} 曲失敗",
	[Key.toolSumFailImg]: " · {n} 枚失敗",
	[Key.toolSumPendNcm]: " · {n} 曲未処理",
	[Key.toolSumPendImg]: " · {n} 枚未処理",
	[Key.toolStatusSavedImg]: "保存しました: {name}",
	[Key.toolStatusZipSavedImg]: "ZIP を保存しました · {n} 枚 · {size}",
	[Key.toolErrUnknownFormat]: "復元した音声の形式を判別できません",
	[Key.toolErrDecrypt]: "復号に失敗しました",
	[Key.toolErrConvert]: "変換に失敗しました",
	[Key.toolErrImgSize]: "画像のサイズを取得できません",
	[Key.toolErrImgDecode]: "このブラウザではこの形式をデコードできません",
	[Key.toolErrCanvas]: "canvas コンテキストを取得できません",
	[Key.toolErrNotSupported]: "このブラウザは {format} を書き出せません",
	[Key.toolFmtFlac]: "FLAC ロスレス",
	[Key.toolFmtMp3]: "MP3 非可逆",
	[Key.toolFmtOgg]: "OGG",
	[Key.toolFmtM4a]: "M4A",
	[Key.toolFmtWav]: "WAV",
	[Key.toolFmtBin]: "不明な形式",

	// ---------- サーバーコンソール ----------
	[Key.serverTitle]: "サーバー",
	[Key.serverSubtitle]:
		"E5 · P100 16G · 対話 AI / 画像生成 / ビルド · リソースをリアルタイム監視",
	[Key.serverLoading]: "読み込み中…",
	[Key.serverWake]: "E5 を起動",
	[Key.serverStopAll]: "すべて停止",
	[Key.serverGpuVram]: "GPU メモリ",
	[Key.serverGpuUtil]: "GPU 負荷 / 温度",
	[Key.serverMem]: "メモリ",
	[Key.serverDisk]: "ディスク",
	[Key.serverServiceChat]: "AI 対話",
	[Key.serverServiceDraw]: "画像生成",
	[Key.serverServiceBuild]: "ビルド / ターミナル",
	[Key.serverNasTitle]: "NAS ストレージ",
	[Key.serverNasDesc]: "Synology DSM でファイルを管理",
	[Key.serverOpen]: "開く",
	[Key.serverOpenArrow]: "開く →",
	[Key.serverEnter]: "入る →",
	[Key.serverStart]: "起動",
	[Key.serverStarting]: "起動中…",
	[Key.serverTagRunning]: "稼働中",
	[Key.serverTagIdle]: "停止中",
	[Key.serverTagReady]: "準備完了",
	[Key.serverTagUnconfigured]: "未設定",
	[Key.serverChatDesc]:
		"Qwen 27B · llama.cpp · ポート 11435 · 起動時に画像生成を自動停止",
	[Key.serverDrawDesc]: "SD WebUI · ポート 7860 · 起動時に対話 AI を自動停止",
	[Key.serverBuildDesc]:
		"Web ターミナルまたは code-server · E5-gpu-manager.py に COMPILE_URL を記入すると有効になります",
	[Key.serverStateChat]: "対話 AI 稼働中",
	[Key.serverStateDraw]: "画像生成中",
	[Key.serverStateIdle]: "待機中",
	[Key.serverStateConflict]: "⚠ 競合",
	[Key.serverSwitching]: "切り替え中…",
	[Key.serverSwitchedOk]: "✅ {msg}「入る →」で開けます",
	[Key.serverDataSource]: "データ元 {src}",
	[Key.serverChatStarting]: "対話 AI を起動しています(画像生成は自動停止), 約 1〜3 分…",
	[Key.serverDrawStarting]: "画像生成を起動しています(対話 AI は自動停止), 約 1〜3 分…",
	[Key.serverSwitchStarted]: "切り替えを開始しました。進捗は上の状態に表示されます",
	[Key.serverBusy]: "別の切り替えが進行中です。しばらくお待ちください",
	[Key.serverStartFailed]: "起動に失敗しました",
	[Key.serverOpFailed]: "操作に失敗しました",
	[Key.serverStoppingAll]: "すべて停止しています…",
	[Key.serverStopStarted]: "停止を開始しました。まもなくメモリが解放されます",
	[Key.serverSourceRecovered]: "データ元が復帰しました ✅",
	[Key.serverSourceOffline]: "データ元はオフライン",
	[Key.serverSourceOfflineDetail]:
		"データ元がオフラインです(トンネル未起動、またはドメイン未解決)",
	[Key.serverRetrying]: "再試行中…",
	[Key.serverWakeSent]:
		"NAS に Wake パケットの送信を依頼しました。E5 の起動を待っています…",
	[Key.serverWakeOk]:
		"Wake パケットを送信しました(E5 側の BIOS で WoL を有効にする必要があります)。30〜90 秒ほどです",
	[Key.serverWakeFail]: "Wake リクエストに失敗しました:NAS の Wake サービスを確認してください",
	[Key.serverWakeOnline]: "E5 がオンラインになりました ✅",
	[Key.serverWakeTimeout]:
		"E5 はまだオンラインになりません:BIOS の WoL が無効か、電源が切れている可能性があります",
	[Key.serverErrBadResponse]: "応答が異常です",
	[Key.serverErrConnect]: "接続できません({msg})",
	[Key.serverErrNoConfirm]:
		"確認が取れませんでした({msg})。まもなく状態を自動更新します",
	[Key.serverAskToken]: "制御用パスワードを入力してください(管理者のみ):",
	[Key.serverErrCancelled]: "キャンセルしました: パスワードが必要です",
	[Key.serverErrTokenCancelled]: "パスワードが違うため操作をキャンセルしました",
	[Key.serverErrToken]: "パスワードが違います",

	// ページネーション
	[Key.paginationPrev]: "前のページ",
	[Key.paginationNext]: "次のページ",

	// 音楽フローティングボタン(アクセシビリティ用ラベル)
	[Key.musicFabDefaultTitle]: "音楽コントロールセンター",
	[Key.musicFabOpen]: "音楽コントロールセンターを開く:{title}",
	[Key.musicFabClose]: "音楽コントロールセンターをたたむ:{title}",
};
