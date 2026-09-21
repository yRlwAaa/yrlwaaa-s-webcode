import Key from "../i18nKey";
import type { Translation } from "../translation";

export const en: Translation = {
	[Key.home]: "Home",
	[Key.about]: "About",
	[Key.archive]: "Archive",
	[Key.search]: "Search",
	[Key.other]: "Other",

	// Navigation bar titles
	[Key.navLinks]: "Links",
	[Key.navMy]: "My",
	[Key.navAbout]: "About",
	[Key.navOthers]: "Others",

	[Key.tags]: "Tags",
	[Key.categories]: "Categories",
	[Key.recentPosts]: "Recent Posts",
	[Key.postList]: "Post List",
	[Key.tableOfContents]: "Table of Contents",
	[Key.tocEmpty]: "No table of contents",

	// Announcement
	[Key.announcement]: "Announcement",
	[Key.announcementClose]: "Close",

	[Key.comments]: "Comments",
	[Key.friends]: "Friends",
	[Key.friendsSubtitle]: "Discover more great websites",
	[Key.friendsSearchPlaceholder]: "Search friend's name or description...",
	[Key.friendsFilterAll]: "All",
	[Key.friendsNoResults]: "No matching friends found",
	[Key.friendsVisit]: "Visit",
	[Key.friendsCopyLink]: "Copy Link",
	[Key.friendsCopySuccess]: "Copied",
	[Key.friendsTags]: "Tags",
	[Key.untitled]: "Untitled",
	[Key.uncategorized]: "Uncategorized",
	[Key.noTags]: "No Tags",

	[Key.wordCount]: "word",
	[Key.wordsCount]: "words",
	[Key.minuteCount]: "minute",
	[Key.minutesCount]: "minutes",
	[Key.postCount]: "post",
	[Key.postsCount]: "posts",

	[Key.themeColor]: "Theme Color",

	[Key.lightMode]: "Light",
	[Key.darkMode]: "Dark",
	[Key.systemMode]: "System",

	[Key.more]: "More",

	[Key.author]: "Author",
	[Key.publishedAt]: "Published at",
	[Key.license]: "License",
	[Key.anime]: "Anime",
	[Key.diary]: "Diary",

	// Anime Page
	[Key.animeTitle]: "My Anime List",
	[Key.animeSubtitle]: "Record my anime journey",
	[Key.animeStatusWatching]: "Watching",
	[Key.animeStatusCompleted]: "Completed",
	[Key.animeStatusPlanned]: "Planned",
	[Key.animeStatusOnHold]: "On Hold",
	[Key.animeStatusDropped]: "Dropped",
	[Key.animeFilterAll]: "All",
	[Key.animeYear]: "Year",
	[Key.animeStudio]: "Studio",
	[Key.animeEmpty]: "No anime data available",
	[Key.animeEmptyBangumi]:
		"Please check Bangumi configuration or network connection",
	[Key.animeEmptyBilibili]:
		"Please check Bilibili configuration or network connection",
	[Key.animeEmptyLocal]:
		"Please add anime information in src/data/anime.ts file",
	[Key.animeConfigBilibili]:
		"Please set your Bilibili vmid in the src/config.ts file",
	[Key.animeConfigBangumi]:
		"Please set your Bangumi userId in the src/config.ts file",

	// Diary Page
	[Key.diarySubtitle]: "Share life, anytime, anywhere",
	[Key.diaryNoResults]: "No matching moments",
	[Key.diaryCount]: "entries",

	[Key.diaryTips]: "Only show the latest 30 diary entries",
	[Key.diaryMinutesAgo]: "minutes ago",
	[Key.diaryHoursAgo]: "hours ago",
	[Key.diaryDaysAgo]: "days ago",

	// 404 Page
	[Key.notFound]: "404",
	[Key.notFoundTitle]: "Page Not Found",
	[Key.notFoundDescription]:
		"Sorry, the page you visited does not exist or has been moved.",
	[Key.backToHome]: "Back to Home",

	// Music Player
	[Key.musicPlayer]: "Music Player",
	[Key.musicPlayerShow]: "Show Music Player",
	[Key.musicPlayerHide]: "Hide Music Player",
	[Key.musicPlayerExpand]: "Expand Music Player",
	[Key.musicPlayerCollapse]: "Collapse Music Player",
	[Key.musicPlayerPause]: "Pause",
	[Key.musicPlayerPlay]: "Play",
	[Key.musicPlayerPrevious]: "Previous",
	[Key.musicPlayerNext]: "Next",
	[Key.musicPlayerShuffle]: "Shuffle",
	[Key.musicPlayerRepeat]: "Repeat All",
	[Key.musicPlayerRepeatOne]: "Repeat One",
	[Key.musicPlayerVolume]: "Volume Control",
	[Key.musicPlayerProgress]: "Playback Progress",
	[Key.musicPlayerCover]: "Cover",
	[Key.musicPlayerPlaylist]: "Playlist",
	[Key.musicPlayerLoading]: "Loading...",
	[Key.musicPlayerErrorPlaylist]: "Failed to fetch playlist",
	[Key.musicPlayerErrorSong]: "Failed to load current song, trying next",
	[Key.musicPlayerErrorEmpty]: "No available songs in playlist",
	[Key.unknownSong]: "Unknown Song",
	[Key.unknownArtist]: "Unknown Artist",

	// Albums Page
	[Key.albums]: "Albums",
	[Key.albumsSubtitle]: "Record beautiful moments in life",
	[Key.albumsEmpty]: "No content",
	[Key.albumsEmptyDesc]:
		"No albums have been created yet. Go add some beautiful memories!",
	[Key.albumsBackToList]: "Back to Albums",

	// Devices Page
	[Key.devices]: "My Devices",
	[Key.devicesSubtitle]: "Here are the devices I use in my daily life",
	[Key.devicesViewDetails]: "View Details",
	[Key.albumsPhotoCount]: "photo",
	[Key.albumsPhotosCount]: "photos",
	[Key.albumsFilterAll]: "All",
	[Key.albumsNoResults]: "No matching albums",

	// Projects Page
	[Key.projects]: "Projects",
	[Key.projectsSubtitle]: "My development project portfolio",
	[Key.projectsAll]: "All",
	[Key.projectsWeb]: "Web Applications",
	[Key.projectsMobile]: "Mobile Applications",
	[Key.projectsDesktop]: "Desktop Applications",
	[Key.projectsOther]: "Other",
	[Key.projectTechStack]: "Tech Stack",
	[Key.projectLiveDemo]: "Live Demo",
	[Key.projectSourceCode]: "Source Code",
	[Key.projectDescription]: "Project Description",
	[Key.projectStatus]: "Status",
	[Key.projectStatusCompleted]: "Completed",
	[Key.projectStatusInProgress]: "In Progress",
	[Key.projectStatusPlanned]: "Planned",
	[Key.projectsTotal]: "Total Projects",
	[Key.projectsCompleted]: "Completed",
	[Key.projectsInProgress]: "In Progress",
	[Key.projectsTechStack]: "Tech Stack Statistics",
	[Key.projectsFeatured]: "Featured Projects",
	[Key.projectsPlanned]: "Planned",
	[Key.projectsDemo]: "Live Demo",
	[Key.projectsSource]: "Source Code",
	[Key.projectsVisit]: "Visit Project",
	[Key.projectsGitHub]: "GitHub",

	// RSS Page
	[Key.rss]: "RSS Feed",
	[Key.rssDescription]: "Subscribe to get latest updates",
	[Key.rssSubtitle]:
		"Subscribe via RSS to get the latest articles and updates immediately",
	[Key.rssLink]: "RSS Link",
	[Key.rssCopyToReader]: "Copy link to your RSS reader",
	[Key.rssCopyLink]: "Copy",
	[Key.rssLatestPosts]: "Latest Posts",
	[Key.rssWhatIsRSS]: "What is RSS?",
	[Key.rssWhatIsRSSDescription]:
		"RSS (Really Simple Syndication) is a standard format for publishing frequently updated content. With RSS, you can:",
	[Key.rssBenefit1]:
		"Get latest website content in time without manually visiting",
	[Key.rssBenefit2]: "Manage subscriptions to multiple websites in one place",
	[Key.rssBenefit3]: "Avoid missing important updates and articles",
	[Key.rssBenefit4]: "Enjoy an ad-free, clean reading experience",
	[Key.rssHowToUse]:
		"It is recommended to use Feedly, Inoreader or other RSS readers to subscribe to this site.",
	[Key.rssCopied]: "RSS link copied to clipboard!",
	[Key.rssCopyFailed]: "Copy failed, please copy the link manually",

	// Atom Page
	[Key.atom]: "Atom Feed",
	[Key.atomDescription]: "Subscribe to get latest updates",
	[Key.atomSubtitle]:
		"Subscribe via Atom to get the latest articles and updates immediately",
	[Key.atomLink]: "Atom Link",
	[Key.atomCopyToReader]: "Copy link to your Atom reader",
	[Key.atomCopyLink]: "Copy",
	[Key.atomLatestPosts]: "Latest Posts",
	[Key.atomWhatIsAtom]: "What is Atom?",
	[Key.atomWhatIsAtomDescription]:
		"Atom (Atom Syndication Format) is an XML-based standard for describing feeds and their items. With Atom, you can:",
	[Key.atomBenefit1]:
		"Get latest website content in time without manually visiting",
	[Key.atomBenefit2]:
		"Manage subscriptions to multiple websites in one place",
	[Key.atomBenefit3]: "Avoid missing important updates and articles",
	[Key.atomBenefit4]: "Enjoy an ad-free, clean reading experience",
	[Key.atomHowToUse]:
		"It is recommended to use Feedly, Inoreader or other Atom readers to subscribe to this site.",
	[Key.atomCopied]: "Atom link copied to clipboard!",
	[Key.atomCopyFailed]: "Copy failed, please copy the link manually",

	// Wallpaper mode
	[Key.wallpaperBanner]: "Banner Mode",
	[Key.wallpaperFullscreen]: "Fullscreen Mode",
	[Key.wallpaperNone]: "Hide Wallpaper",

	// Skills Page
	[Key.skills]: "Skills",
	[Key.skillsSubtitle]: "My technical skills and expertise",
	[Key.skillsFrontend]: "Frontend Development",
	[Key.skillsBackend]: "Backend Development",
	[Key.skillsDatabase]: "Database",
	[Key.skillsTools]: "Development Tools",
	[Key.skillsOther]: "Other Skills",
	[Key.skillLevel]: "Proficiency",
	[Key.skillLevelBeginner]: "Beginner",
	[Key.skillLevelIntermediate]: "Intermediate",
	[Key.skillLevelAdvanced]: "Advanced",
	[Key.skillLevelExpert]: "Expert",
	[Key.skillExperience]: "Experience",
	[Key.skillYears]: "years",
	[Key.skillMonths]: "months",
	[Key.skillsTotal]: "Total Skills",
	[Key.skillsExpert]: "Expert Level",
	[Key.skillsAdvanced]: "Advanced",
	[Key.skillsIntermediate]: "Intermediate",
	[Key.skillsBeginner]: "Beginner",
	[Key.skillsAdvancedTitle]: "Professional Skills",
	[Key.skillsProjects]: "Related Projects",
	[Key.skillsDistribution]: "Skill Distribution",
	[Key.skillsByLevel]: "By Level",
	[Key.skillsByCategory]: "By Category",
	[Key.noData]: "No data",

	// Timeline Page
	[Key.timeline]: "Timeline",
	[Key.timelineSubtitle]: "My growth journey and important milestones",
	[Key.timelineEducation]: "Education",
	[Key.timelineWork]: "Work Experience",
	[Key.timelineProject]: "Project Experience",
	[Key.timelineAchievement]: "Achievements",
	[Key.timelinePresent]: "Present",
	[Key.timelineLocation]: "Location",
	[Key.timelineDescription]: "Detailed Description",
	[Key.timelineMonths]: "months",
	[Key.timelineYears]: "years",
	[Key.timelineTotal]: "Total",
	[Key.timelineProjects]: "Projects",
	[Key.timelineExperience]: "Work Experience",
	[Key.timelineCurrent]: "Current Status",
	[Key.timelineHistory]: "History",
	[Key.timelineAchievements]: "Achievements",
	[Key.timelineStartDate]: "Start Date",
	[Key.timelineDuration]: "Duration",

	// Password Protection
	[Key.passwordProtected]: "Password Protected",
	[Key.passwordProtectedTitle]: "This content is password protected",
	[Key.passwordProtectedDescription]:
		"Please enter the password to view the protected content",
	[Key.postEncrypted]: "Encrypted",
	[Key.passwordPlaceholder]: "Enter password",
	[Key.passwordUnlock]: "Unlock",
	[Key.passwordUnlocking]: "Unlocking...",
	[Key.passwordIncorrect]: "Incorrect password, please try again",
	[Key.passwordDecryptError]:
		"Decryption failed, please check if the password is correct",
	[Key.passwordRequired]: "Please enter the password",
	[Key.passwordVerifying]: "Verifying...",
	[Key.passwordDecryptFailed]: "Decryption failed, please check the password",
	[Key.passwordDecryptRetry]: "Decryption failed, please try again",
	[Key.passwordUnlockButton]: "Unlock",
	[Key.copyFailed]: "Copy failed:",
	[Key.syntaxHighlightFailed]: "Syntax highlighting failed:",
	[Key.autoSyntaxHighlightFailed]:
		"Automatic syntax highlighting also failed:",
	[Key.decryptionError]: "An error occurred during decryption:",
	[Key.passwordHint]: "Hint",

	// Last Modified Time Card
	[Key.lastModifiedPrefix]: "Time since last edit: ",
	[Key.lastModifiedOutdated]: "Some information may be outdated",
	[Key.year]: "y",
	[Key.month]: "m",
	[Key.day]: "d",
	[Key.hour]: "h",
	[Key.minute]: "min",
	[Key.second]: "s",

	// Site Stats
	[Key.siteStats]: "Site Statistics",
	[Key.siteStatsPostCount]: "Posts",
	[Key.siteStatsCategoryCount]: "Categories",
	[Key.siteStatsTagCount]: "Tags",
	[Key.siteStatsTotalWords]: "Total Words",
	[Key.siteStatsRunningDays]: "Running Days",
	[Key.siteStatsLastUpdate]: "Last Activity",
	[Key.siteStatsDaysAgo]: "{days} days ago",
	[Key.siteStatsDays]: "{days} days",

	// Calendar Component
	[Key.calendarSunday]: "Sun",
	[Key.calendarMonday]: "Mon",
	[Key.calendarTuesday]: "Tue",
	[Key.calendarWednesday]: "Wed",
	[Key.calendarThursday]: "Thu",
	[Key.calendarFriday]: "Fri",
	[Key.calendarSaturday]: "Sat",
	[Key.calendarJanuary]: "Jan",
	[Key.calendarFebruary]: "Feb",
	[Key.calendarMarch]: "Mar",
	[Key.calendarApril]: "Apr",
	[Key.calendarMay]: "May",
	[Key.calendarJune]: "Jun",
	[Key.calendarJuly]: "Jul",
	[Key.calendarAugust]: "Aug",
	[Key.calendarSeptember]: "Sep",
	[Key.calendarOctober]: "Oct",
	[Key.calendarNovember]: "Nov",
	[Key.calendarDecember]: "Dec",

	// Share Functionality
	[Key.shareArticle]: "Share",
	[Key.generatingPoster]: "Generating poster...",
	[Key.copied]: "Copied",
	[Key.copyLink]: "Copy Link",
	[Key.savePoster]: "Save Poster",
	[Key.scanToRead]: "Scan to Read",
	[Key.shareOnSocial]: "Share",
	[Key.shareOnSocialDescription]:
		"If this article helped you, please share it with others!",

	// Profile Stats
	[Key.profileStatsLoading]: "Loading stats...",
	[Key.profileStatsPageViews]: "Page views",
	[Key.profileStatsVisits]: "Visits",
	[Key.profileStatsUnavailable]: "Stats unavailable",

	// Page Views Stats
	[Key.pageViewsLoading]: "Loading stats...",
	[Key.pageViewsUnavailable]: "Stats unavailable",

	// Layout Switch Button
	[Key.switchToGridMode]: "Switch to Grid Mode",
	[Key.switchToListMode]: "Switch to List Mode",

	// Related Posts & Random Posts
	[Key.relatedPosts]: "Related Posts",
	[Key.randomPosts]: "Random Posts",
	[Key.smartRecommend]: "Smart",
	[Key.randomRecommend]: "Random",

	// Music Page
	[Key.musicTitle]: "Music",
	[Key.musicArtistCount]: "artists",
	[Key.musicAlbum]: "Album",
	[Key.musicUnknown]: "Unknown",
	[Key.musicTrackCount]: "tracks",
	[Key.musicAlbumCount]: "albums",
	[Key.musicDownload]: "Download",

	// Site Stats - PV
	[Key.siteStatsTotalVisits]: "Total Visits",
	[Key.siteStatsTodayVisits]: "Today Visits",

	// Weather
	[Key.weatherLocating]: "Locating...",
	[Key.weatherFetching]: "Fetching...",
	[Key.weatherLoadFailed]: "Load failed",
	[Key.weatherSearchCity]: "Search city...",
	[Key.weatherSearch]: "Search",
	[Key.weatherHigh]: "High",
	[Key.weatherLow]: "Low",
	[Key.weatherForecast]: "Weekly Forecast",
	[Key.weatherToday]: "Today",
	[Key.weatherNotFound]: "City not found, try English name or pinyin",
	[Key.weatherSunny]: "Sunny",
	[Key.weatherPartlyCloudy]: "Partly Cloudy",
	[Key.weatherCloudy]: "Cloudy",
	[Key.weatherOvercast]: "Overcast",
	[Key.weatherFog]: "Fog",
	[Key.weatherLightRain]: "Light Rain",
	[Key.weatherModerateRain]: "Moderate Rain",
	[Key.weatherHeavyRain]: "Heavy Rain",
	[Key.weatherFreezingRain]: "Freezing Rain",
	[Key.weatherLightSnow]: "Light Snow",
	[Key.weatherModerateSnow]: "Moderate Snow",
	[Key.weatherHeavySnow]: "Heavy Snow",
	[Key.weatherSnowGrains]: "Snow Grains",
	[Key.weatherShowers]: "Showers",
	[Key.weatherHeavyShowers]: "Heavy Showers",
	[Key.weatherSnowShowers]: "Snow Showers",
	[Key.weatherHeavySnowShowers]: "Heavy Snow Showers",
	[Key.weatherThunderstorm]: "Thunderstorm",
	[Key.weatherSevereThunderstorm]: "Severe Thunderstorm",

	// AI Assistant
	[Key.aiAssistant]: "AI Assistant",
	[Key.aiThinking]: "Thinking...",
	[Key.aiOnline]: "Online",
	[Key.aiNewChat]: "New Chat",
	[Key.aiClose]: "Close",
	[Key.aiWelcome]: "Hello, I'm yRlwAaa's AI Assistant",
	[Key.aiWelcomeSub]: "Ask me anything about this website",
	[Key.aiPlaceholder]: "Ask me anything about this site... (Enter to send, Shift+Enter for new line)",
	[Key.aiSend]: "Send",
	[Key.aiQuick1]: "What's on this website?",
	[Key.aiQuick2]: "What are the latest articles?",
	[Key.aiQuick3]: "Tell me about yourself",
	[Key.aiError]: "Error: ",

	// ---------- Toolbox ----------
	[Key.toolsTitle]: "Tools",
	[Key.toolsSubtitle]: "A few handy little tools, ready to use straight out of the box",
	[Key.toolsLocal]: "Runs locally",
	[Key.toolsEmpty]: "No tools yet — stay tuned",
	[Key.toolCrumbTools]: "Tools",
	[Key.toolOr]: "or",
	[Key.toolPick]: "choose a local file",
	[Key.toolDownload]: "Download",
	[Key.toolZip]: "Download all as ZIP",
	[Key.toolRerun]: "Convert again with the new settings",
	[Key.toolClear]: "Clear list",
	[Key.toolSingleHint]: "You can also save each file on its own with the button on the right",

	[Key.toolNcmName]: "NCM to FLAC",
	[Key.toolNcmDesc]:
		"Restore NetEase Cloud .ncm files to the original FLAC — drag in a batch, get one ZIP",
	[Key.toolNcmIntro]:
		".ncm is an encrypted wrapper the NetEase Cloud Music client puts around downloaded files; inside is the original audio stream (a lossless source holds a real FLAC). This tool strips that wrapper in your browser and hands you the original FLAC — no re-encoding at all, so the audio is identical to the source file. Drag in several files and download them as a single ZIP when it finishes. Everything happens inside this page; nothing is uploaded to any server.",
	[Key.toolNcmTags]: "Audio|Lossless|Runs locally",
	[Key.toolNcmDropTitle]: "Drop .ncm files here",
	[Key.toolNcmDropSub]:
		"Multiple files at once · decrypted entirely in your browser, files are never uploaded",
	[Key.toolNcmOptLossless]: "Lossless only (skip MP3 / M4A and other lossy sources)",
	[Key.toolNcmOptCover]: "Include album cover (a .jpg named after each track)",
	[Key.toolNcmFoot]:
		"Decryption and packing happen in your browser's memory: no network, no upload, nothing stored. Please only use it on files you legitimately own.",
	[Key.toolNcmSkip]: "Lossy audio ({format}), skipped per your setting",

	[Key.toolImgName]: "Image Converter",
	[Key.toolImgDesc]:
		"Batch convert jpg / png / gif / avif / svg to WebP·PNG, with max width and quality options",
	[Key.toolImgIntro]:
		"Convert all sorts of image formats into something web-friendly (WebP / PNG / JPEG) and shrink them while you're at it. What really eats bandwidth on the web is pixel size, not the format — a 4000px photo scaled to 1600px usually saves 80-90% of the bytes, and the format switch saves another 20-30%. Drop images in, pick an output format, a max width and a quality, then download everything as one ZIP. Everything runs in your browser; images are never uploaded.",
	[Key.toolImgTags]: "Image|WebP|Runs locally",
	[Key.toolImgDropTitle]: "Drop images here",
	[Key.toolImgDropSub]:
		"Multiple images at once · converted entirely in your browser, nothing is uploaded",
	[Key.toolImgFormat]: "Output format",
	[Key.toolImgMaxWidth]: "Max width",
	[Key.toolImgKeepSize]: "Keep original size",
	[Key.toolImgQuality]: "Quality",
	[Key.toolImgLossless]: "lossless",
	[Key.toolImgUnavailable]: " (unavailable)",
	[Key.toolImgHintWebp]: "WebP balances size and quality — the go-to choice for web images",
	[Key.toolImgHintPng]:
		"PNG is lossless but usually larger; best for screenshots, line art and transparency",
	[Key.toolImgHintJpeg]: "JPEG has no transparency — transparent areas are filled with white",
	[Key.toolImgHintAvif]: "AVIF gives the smallest files, but encodes slowly and older browsers may not support it",
	[Key.toolImgFoot]:
		"Decoding and encoding happen in your browser: no network, no upload. Note: browsers cannot decode iPhone HEIC/HEIF — export as JPG on the phone first. Animated GIFs keep only the first frame.",

	[Key.toolWmName]: "Watermark Remover",
	[Key.toolWmDesc]:
		"Box the watermark and let inpainting fill it back in — runs entirely in your browser, nothing is uploaded",
	[Key.toolWmIntro]:
		"Box the watermark on the image and release: the pixels underneath are reconstructed from their surroundings (image inpainting). It works best on marks sitting on flat or gently varying backgrounds — sky, walls, gradient fills — while large solid blocks that hide real detail cannot be recovered. You can select several areas at once, and every repair starts from the original image, so running it twice never smears the result. Output keeps the original format and resolution. Everything happens inside this page; nothing is uploaded to any server.",
	[Key.toolWmTags]: "Image|Inpainting|Runs locally",
	[Key.toolWmDropTitle]: "Drop an image here",
	[Key.toolWmDropSub]:
		"One image at a time · processed entirely in your browser, nothing is uploaded",
	[Key.toolWmLoadHint]:
		"Once the image loads, hold and drag on it to box the watermark — you can box several areas.",
	[Key.toolWmStart]: "Start repairing",
	[Key.toolWmUndo]: "Undo",
	[Key.toolWmClearSel]: "Clear selection",
	[Key.toolWmReset]: "Reset",
	[Key.toolWmBefore]: "Before",
	[Key.toolWmAfter]: "After",
	[Key.toolWmDownload]: "Download the repaired image",
	[Key.toolWmFoot]:
		"Loading, repairing and exporting all happen in your browser: no network, no upload, nothing stored. Please only use it on images you own the rights to or have been authorised to edit — removing a watermark from someone else's work may infringe their rights.",
	[Key.toolWmSuffix]: "repaired",
	[Key.toolWmRegions]: "Areas to repair: {n}",
	[Key.toolWmRegionsNone]: "No selection yet — box the watermark on the image",
	[Key.toolWmStatusLoaded]:
		"Loaded {name} · {w}×{h} — hold and drag on the watermark to box it",
	[Key.toolWmStatusWorking]: "Repairing… {p}%",
	[Key.toolWmStatusDone]: "Repaired — ready to download · took {s}s",
	[Key.toolWmStatusNoSel]: "Nothing is selected — box the watermark first",
	[Key.toolWmStatusRegionAdded]:
		"{n} area(s) selected — keep selecting, or hit “Start repairing”",
	[Key.toolWmStatusTooSmall]:
		"That selection is too small — box the whole watermark, then release",
	[Key.toolWmStatusAllMasked]:
		"The selection covers the whole image, so there is nothing left to sample from — please make it smaller",
	[Key.toolWmStatusUndone]: "Undone",
	[Key.toolWmStatusCleared]: "Selection cleared",
	[Key.toolWmStatusReset]: "Reset to the original image",
	[Key.toolWmStatusSaved]: "Saved: {name}",
	[Key.toolWmErrLoad]: "Could not load the image",
	[Key.toolWmErrInpaint]: "Repair failed: ",
	[Key.toolWmErrExport]: "Export failed — this browser cannot encode that format",
	// AI watermark removal (E5 · IOPaint/LaMa proxy)
	[Key.toolWmAiRun]: "AI remove (E5)",
	[Key.toolWmAiWorking]: "E5 processing… {s}s",
	[Key.toolWmAiProbing]: "Checking the E5 repair service…",
	[Key.toolWmAiReady]:
		"E5 online · handled by IOPaint/LaMa — select the watermark first",
	[Key.toolWmAiOffline]: "E5 offline · local repair still works",
	[Key.toolWmAiNoImage]:
		"Load an image first: AI repair needs the original and a mask",
	[Key.toolWmAiNoSel]: "Select the watermark area first: AI repair needs a mask",
	[Key.toolWmAiTooLarge]:
		"Image too large (a data URL over 12MB) — resize it or use local repair",
	[Key.toolWmAiDone]: "Repaired by E5, ready to download · {s}s",
	[Key.toolWmAiErr]: "E5 repair failed: ",

	[Key.toolStatusQueued]: "Queued",
	[Key.toolStatusReading]: "Reading file…",
	[Key.toolStatusDecrypting]: "Decrypting…",
	[Key.toolStatusDecoding]: "Decoding…",
	[Key.toolStatusWorking]: "Processing {done} / {total} · {name}",
	[Key.toolStatusDoneNcm]:
		"Finished {n} track(s) · save each one with the button on the right, or download the ZIP below",
	[Key.toolStatusDoneImg]:
		"Finished {n} image(s) · save each one with the button on the right, or download the ZIP below",
	[Key.toolStatusSaved]: "Saved: {name}",
	[Key.toolStatusZipping]: "Packing {n} file(s)…",
	[Key.toolStatusZipSaved]: "ZIP saved · {n} file(s) · {size}",
	[Key.toolStatusNoOutputNcm]: "No audio to output",
	[Key.toolStatusNoOutputImg]: "No images to output",
	[Key.toolStatusIgnored]: "Ignored {n} file(s) in unsupported formats",
	[Key.toolStatusNothing]: "No files selected",
	[Key.toolStatusZipFail]: "Packing failed: ",
	[Key.toolStatusRerun]: "Settings changed — click “Convert again with the new settings”",
	[Key.toolStatusStale]: "This page is out of date — press Ctrl+F5 to hard refresh",
	[Key.toolCoreMissing]: "The core script failed to load — press Ctrl+F5 to hard refresh the page",
	[Key.toolZipWarn]:
		"Total {size}. Packing keeps an extra copy in memory and can be slow.\nContinue? You can also save files one by one with the button on each row.",
	[Key.toolFail]: "Failed",
	[Key.toolSkipped]: "Skipped",
	[Key.toolStatusProcessing]: "Working",
	[Key.toolStatusVerMismatch]:
		"This page is out of date (page v{page} / script v{script}) — press Ctrl+F5 to hard refresh",
	[Key.toolKitMissing]:
		"The shared library failed to load — press Ctrl+F5 to hard refresh the page",
	[Key.toolPctSaved]: " · {n}% smaller",
	[Key.toolPctBigger]: " · {n}% larger",
	[Key.toolSumInOutNcm]: "{n} track(s) · {in} in → {out} out",
	[Key.toolSumInOutImg]: "{n} image(s) · {in} in → {out} out",
	[Key.toolSumInNcm]: "{n} track(s) · {in} total input",
	[Key.toolSumInImg]: "{n} image(s) · {in} total input",
	[Key.toolSumDecrypting]: " · decrypting…",
	[Key.toolSumConverting]: " · converting…",
	[Key.toolSumFailNcm]: " · {n} failed",
	[Key.toolSumFailImg]: " · {n} failed",
	[Key.toolSumPendNcm]: " · {n} pending",
	[Key.toolSumPendImg]: " · {n} pending",
	[Key.toolStatusSavedImg]: "Saved: {name}",
	[Key.toolStatusZipSavedImg]: "ZIP saved · {n} image(s) · {size}",
	[Key.toolErrUnknownFormat]: "The restored audio format could not be identified",
	[Key.toolErrDecrypt]: "Decryption failed",
	[Key.toolErrConvert]: "Conversion failed",
	[Key.toolErrImgSize]: "Could not read the image dimensions",
	[Key.toolErrImgDecode]: "This browser cannot decode that format",
	[Key.toolErrCanvas]: "Could not get a canvas context",
	[Key.toolErrNotSupported]: "This browser cannot export {format}",
	[Key.toolFmtFlac]: "FLAC lossless",
	[Key.toolFmtMp3]: "MP3 lossy",
	[Key.toolFmtOgg]: "OGG",
	[Key.toolFmtM4a]: "M4A",
	[Key.toolFmtWav]: "WAV",
	[Key.toolFmtBin]: "Unknown format",

	// ---------- Server console ----------
	[Key.serverTitle]: "Server",
	[Key.serverSubtitle]:
		"E5 · P100 16G · chat AI / image gen / build · live resource monitor",
	[Key.serverLoading]: "Loading…",
	[Key.serverWake]: "Wake E5",
	[Key.serverStopAll]: "Stop all",
	[Key.serverGpuVram]: "GPU VRAM",
	[Key.serverGpuUtil]: "GPU load / temp",
	[Key.serverMem]: "Memory",
	[Key.serverDisk]: "Disks",
	[Key.serverServiceChat]: "Chat AI",
	[Key.serverServiceDraw]: "Image gen",
	[Key.serverServiceInpaint]: "AI watermark removal",
	[Key.serverServiceBuild]: "Build / terminal",
	[Key.serverNasTitle]: "NAS storage",
	[Key.serverNasDesc]: "Open Synology DSM to manage files",
	[Key.serverOpen]: "Open",
	[Key.serverOpenArrow]: "Open →",
	[Key.serverEnter]: "Enter →",
	[Key.serverStart]: "Start",
	[Key.serverStarting]: "Starting…",
	[Key.serverTagRunning]: "Running",
	[Key.serverTagIdle]: "Stopped",
	[Key.serverTagReady]: "Ready",
	[Key.serverTagUnconfigured]: "Not configured",
	[Key.serverChatDesc]: "Qwen 27B · llama.cpp · port 11435 · stops image gen on start",
	[Key.serverDrawDesc]: "SD WebUI · port 7860 · stops the chat service on start",
	[Key.serverInpaintDesc]:
		"IOPaint · LaMa · port 7861 · always on (runs on CPU, uses no VRAM)",
	[Key.serverTagResident]: "Always on",
	[Key.serverInpaintRestart]: "Restart",
	[Key.serverInpaintRestarting]: "Restarting… {s}s",
	[Key.serverInpaintRestartMsg]:
		"Restarting the AI watermark service, about 30–90 seconds…",
	[Key.serverInpaintRestartOk]: "AI watermark service restarted ✅",
	[Key.serverInpaintRestartFail]: "Restart failed",
	[Key.serverBuildDesc]:
		"Web terminal or code-server · set COMPILE_URL in E5-gpu-manager.py to enable",
	[Key.serverStateChat]: "Chat AI running",
	[Key.serverStateDraw]: "Image gen running",
	[Key.serverStateIdle]: "Idle",
	[Key.serverStateConflict]: "⚠ Conflict",
	[Key.serverSwitching]: "Switching…",
	[Key.serverSwitchedOk]: "✅ {msg} Click “Enter →” to open",
	[Key.serverDataSource]: "Source {src}",
	[Key.serverChatStarting]:
		"Starting the chat service (image gen stops automatically), roughly 1–3 minutes…",
	[Key.serverDrawStarting]:
		"Starting image gen (the chat service stops automatically), roughly 1–3 minutes…",
	[Key.serverSwitchStarted]: "Switch started — watch the status above for progress",
	[Key.serverBusy]: "Another switch is already in progress — please wait",
	[Key.serverStartFailed]: "Failed to start",
	[Key.serverOpFailed]: "Operation failed",
	[Key.serverStoppingAll]: "Stopping everything…",
	[Key.serverStopStarted]: "Stop started — VRAM will be released shortly",
	[Key.serverSourceRecovered]: "Data source is back ✅",
	[Key.serverSourceOffline]: "Data source offline",
	[Key.serverSourceOfflineDetail]:
		"Data source offline (tunnel not running or domain not resolving)",
	[Key.serverRetrying]: "Retrying…",
	[Key.serverWakeSent]:
		"Asked the NAS to send a wake packet — waiting for E5 to come online…",
	[Key.serverWakeOk]:
		"Wake packet sent (E5 needs WoL enabled in its BIOS), about 30–90 seconds",
	[Key.serverWakeFail]: "Wake request failed: check the NAS wake service",
	[Key.serverWakeOnline]: "E5 is online ✅",
	[Key.serverWakeTimeout]:
		"E5 is still offline: WoL may be disabled in the BIOS, or the power is cut",
	[Key.serverErrBadResponse]: "Unexpected response",
	[Key.serverErrConnect]: "Cannot connect ({msg})",
	[Key.serverErrNoConfirm]:
		"No confirmation received ({msg}) — the status will refresh automatically",
	[Key.serverAskToken]: "Enter the control password (site owner only):",
	[Key.serverErrCancelled]: "Cancelled: a password is required",
	[Key.serverErrTokenCancelled]: "Wrong password, operation cancelled",
	[Key.serverErrToken]: "Wrong password",

	// Pagination
	[Key.paginationPrev]: "Previous page",
	[Key.paginationNext]: "Next page",

	// Music FAB (accessible labels)
	[Key.musicFabDefaultTitle]: "Music control center",
	[Key.musicFabOpen]: "Open the music control center: {title}",
	[Key.musicFabClose]: "Collapse the music control center: {title}",
};
