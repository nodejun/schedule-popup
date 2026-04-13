# ShortScheduler

[한국어](README.md) | **English**

> A Chrome extension that replaces YouTube Shorts with a scheduler

The moment you try to access YouTube Shorts, check today's schedule and add new tasks instead of watching Shorts videos. Rather than simply blocking, it provides a **productive alternative**.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-v1.0.1-4285F4?logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![zustand](https://img.shields.io/badge/zustand-5-443E38)
![zod](https://img.shields.io/badge/zod-3-3E67B1?logo=zod&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-F9AB00?logo=googlechrome&logoColor=white)
![Google Calendar API](https://img.shields.io/badge/Google_Calendar-API-4285F4?logo=googlecalendar&logoColor=white)

---

## Screenshots

### Monthly Calendar + Daily Timeline

![Monthly Calendar](docs/screenshots/screenshot-2.png)

A Google Calendar-style monthly view. Click a date to slide in the daily timeline panel on the right, and click a time slot to add a new event.

### YouTube Home Feed Mini Widget

![Weekly Mini Widget](docs/screenshots/screenshot-1.png)

Replaces the Shorts shelf on YouTube's home feed with a weekly calendar mini widget. See today's schedule, week highlights, and the monthly grid at a glance.

---

## Features

- **Two-stage Shorts blocking** — SPA internal navigation (`history.pushState`) + direct URL access (`webNavigation`)
- **Monthly calendar inline scheduler** — Displayed as an overlay without leaving the YouTube page (instant transition)
- **Daily timeline panel** — Click a time slot to add an event, with real-time preview while filling out the form
- **Recurring events** — Daily/weekly/monthly, with three delete options: "this event only / this and future / all"
- **YouTube sidebar mini widget** — Toggle the calendar from any YouTube page
- **Shorts shelf → weekly widget replacement** — Detected via MutationObserver, injected through Shadow DOM
- **Google Calendar integration** — Auto-sync immediately after OAuth, parallel loading of all calendars (personal/work/birthdays)
- **Multi-language support** — Korean / English toggle
- **Dark mode** — Automatically follows YouTube's theme setting

---

## Installation

### Chrome Web Store (Recommended)

Search for "ShortScheduler" on the Chrome Web Store and install.

### Developer Mode Install

1. Clone and build the repository:
   ```bash
   git clone https://github.com/nodejun/schedule-popup.git
   cd schedule-popup
   npm install
   npm run build
   ```
2. Open `chrome://extensions` → Enable **Developer mode** (top right)
3. Click **Load unpacked** → Select the `dist/` folder

---

## Tech Stack

| Area            | Technology                                       |
| --------------- | ------------------------------------------------ |
| Platform        | Chrome Extension Manifest V3                     |
| UI              | React 19 + TypeScript 5                          |
| Build           | Vite 7 + @crxjs/vite-plugin 2.3                  |
| Styling         | Tailwind CSS 4 (Shadow DOM `adoptedStyleSheets`) |
| State           | zustand 5                                        |
| Schema          | zod 3                                            |
| External API    | Google Calendar API + Chrome Identity API        |

---

## Architecture

```
YouTube Tab
├─ Content Script (ISOLATED World)
│  ├─ Shadow DOM #1 — MiniWidget (weekly calendar)
│  ├─ Shadow DOM #2 — InlineScheduler (monthly calendar)
│  └─ Shadow DOM #3 — SidebarWidget
│
├─ MAIN World Script — history.pushState interception
│
└─ Service Worker (Background)
   ├─ webNavigation → /shorts redirect
   ├─ chrome.identity OAuth proxy
   └─ MAIN World script injection

chrome.storage (sync/local) — schedules:YYYY-MM-DD, settings, google-auth
```

### /shorts Blocking Strategy

1. **SPA internal navigation**: When clicking Shorts on YouTube's sidebar, `history.pushState` is intercepted in the MAIN World and blocked
2. **Direct URL access**: When accessing `/shorts` via address bar or external link, `chrome.webNavigation.onBeforeNavigate` detects it and redirects to the scheduler page

### Shadow DOM Style Isolation

Tailwind CSS is imported as a string via `content.css?inline` → a `CSSStyleSheet` instance is created → assigned to `shadowRoot.adoptedStyleSheets`. Completely isolated from YouTube's global CSS.

---

## Development

```bash
# Dev server (HMR)
npm run dev

# Production build
npm run build

# Test
npm run test
```

### Project Structure

```
src/
├── background/          # Service Worker
├── content/             # Content Script + Shadow DOM injectors
│   ├── injectors/       # MiniWidget, Sidebar, InlineScheduler injectors
│   ├── observers/       # YouTube SPA route detection
│   └── utils/           # DOM helpers, YouTube selectors
├── components/
│   ├── calendar/        # MonthlyCalendar, MonthGrid, DailyDetailPanel
│   ├── schedule/        # ScheduleForm, TimelineView, ScheduleCard
│   └── widget/          # MiniWidget, InlineScheduler, SidebarWidget
├── stores/              # zustand stores (schedule, settings, google-calendar)
├── storage/             # chrome.storage wrappers + repository pattern
├── services/            # Google Calendar API client
├── schemas/             # zod schemas
└── types/               # TypeScript types
```

---

## Permissions

| Permission                     | Purpose                                       |
| ------------------------------ | --------------------------------------------- |
| `storage`                      | Save schedule data and settings               |
| `scripting`                    | Inject `pushState` blocking script in MAIN World |
| `webNavigation`                | Detect direct `/shorts` URL access            |
| `identity`                     | Issue Google Calendar OAuth tokens            |
| `https://www.youtube.com/*`    | YouTube DOM manipulation                      |
| `https://www.googleapis.com/*` | Google Calendar API calls                     |

**No data collection** — All schedule data is stored only in the user's `chrome.storage` and Google Calendar. No data is transmitted to any external server.

---

## License

MIT

---

## Contact

- Bug reports / Feature requests: [GitHub Issues](https://github.com/nodejun/schedule-popup/issues)
- Developer: ksh03196@gmail.com
