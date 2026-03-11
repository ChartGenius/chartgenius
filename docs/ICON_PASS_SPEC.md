# Icon Pass Spec — Replace ALL emojis with SVG icons

## Reference: Tools page
The Tools page uses inline SVG icons inside blue circle badges (`.tv-card-icon`). 
Every other page must match this treatment.

## Rules
1. NO emojis anywhere in the UI — replace with inline SVG icons
2. Icons use `currentColor` so they inherit the accent blue
3. All icons inside `.tv-card-icon` circular badges where applicable
4. Consistent stroke width (1.5-2px) across all icons
5. Simple, clean line icons (not filled) — like Lucide or Heroicons style

## Pages to update

### Journal (app/journal/page.tsx)
- KPI cards: 📊📈💰🎯📋🏷 → SVG equivalents
- Tab labels: 🔬📊📋📈🏷📝 → SVG icons
- Section headers and empty states

### Portfolio (app/portfolio/page.tsx)
- KPI cards: icon prop uses emojis
- Tab labels: 📊💰📁 → SVG
- Empty state: 📊
- Feature cards: 📁💰📊 → SVG
- Export buttons: 📊 → SVG

### Dashboard (app/page.tsx)
- Sidebar section titles: 📊📈📅 → SVG
- Sentiment label: 📈📉➡ → SVG
- Calendar widget event icons: 📊🎤 → SVG
- Any other emoji usage

### Calendar (app/calendar/page.tsx)
- Event type icons
- Filter/tab labels

### News (app/news/page.tsx)
- Category icons if any

### Help (app/help/page.tsx)
- Section icons, FAQ category icons

## Icon mapping (emoji → SVG concept)
- 📊 Chart/Analytics → bar chart icon
- 📈 Trending up → line going up
- 📉 Trending down → line going down
- 💰 Money/Revenue → dollar sign or coin
- 🎯 Target → crosshair/target
- 📋 Clipboard/List → clipboard icon
- 🏷 Tag → tag icon
- 📝 Notes → pencil/edit icon
- 🔬 Analysis → magnifying glass or beaker
- 📅 Calendar → calendar icon
- 📰 News → newspaper icon
- 📁 Folder/Holdings → folder icon
- 🎤 Speech → microphone icon
- ➡ Neutral → minus/dash icon
- 💸 Transfer → arrow right icon
- 🪙 Coin → circle icon
- 🔄 Swap → refresh/arrows icon
- 🖼 NFT → image icon
- 📄 Contract → file icon
- ⚙ Settings → gear icon
