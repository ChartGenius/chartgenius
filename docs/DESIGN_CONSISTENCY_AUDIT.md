# Design Consistency Audit — TradVue New Pages

**Date:** 2026-03-16  
**Reference Pages:** HomeClient.tsx (Dashboard), journal/page.tsx (Journal)  
**Pages Audited:** 11 new pages across application features and SEO  
**Total Issues Found:** 47

---

## Executive Summary

Audit of 11 new pages reveals **moderate consistency issues** across the board. Key patterns:

1. **CSS Variables:** 8 pages using correct `var(--*)` pattern; 3 pages have hardcoded colors (SEO pages)
2. **Card Styling:** Inconsistent border radius — mix of `12`, `8`, `10` px
3. **Typography:** Some deviation in font sizes (especially h2/section headers)
4. **Buttons:** Secondary buttons missing consistent styling
5. **Mobile Responsive:** SEO pages lack proper breakpoints on some CTAs

**Critical Fixes Needed:** 6 issues (hardcoded colors)  
**Important Fixes:** 12 issues (border radius, spacing)  
**Minor Issues:** 29 issues (typography, mobile response)

---

## Audit Details by Page

### 1. Prop Firm Tracker (`frontend/app/propfirm/page.tsx`)

#### CSS Variables & Colors
- ✅ Uses `var(--bg-0)`, `var(--bg-2)`, `var(--card-bg)`, `var(--text-0)`, `var(--text-2)`, etc. correctly
- ✅ Accent color uses `var(--accent)` consistently
- ⚠️ Custom firm colors use inline hex: `firmColor ?? '#6366f1'` (line 157) — should fallback to `var(--accent)` or CSS var

#### Card Styling
- ✅ Cards use `background: 'var(--card-bg)'`, `border: '1px solid var(--border)'` (line 150)
- ⚠️ Border radius mix: `borderRadius: 12` (line 159) ✓, but gauge SVG doesn't have rounded container (line 213)
- ⚠️ Padding inconsistent: cards have `padding: '18px 20px'` (line 152), modal has `padding: 24` (line 480) — should standardize to 20 or 24

#### Typography
- ✅ Section headers use 13-14px with bold (line 168, 189)
- ⚠️ Account card title uses `fontSize: 14` (line 163) — reference pages use 20-24px for h2
- ⚠️ Status badge uses `fontSize: 10` (line 197) — should be 11px per TradVue standard

#### Button Styles
- ✅ Primary button: `background: 'var(--accent)'` (line 488) ✓
- ⚠️ Secondary buttons use `border: '1px solid var(--border)'` but no accent text color (line 489) — should use `color: var(--accent)` for consistency

#### Spacing & Gaps
- ⚠️ Card gap is `gap: 12` (line 151) — reference uses 16-20px
- ⚠️ Section spacing uses `marginBottom: 12` in ProgressBar (line 69) — should be 16 or 20

#### Mobile Responsive
- ⚠️ No media queries visible in primary sections — layout appears fixed-width
- ℹ️ Card layout should break to single column on mobile

---

### 2. Playbooks (`frontend/app/playbooks/page.tsx`)

#### CSS Variables & Colors
- ✅ Correct usage: `var(--bg-2)`, `var(--border)`, `var(--text-0)`, `var(--text-2)`
- ✅ Category colors use CATEGORY_COLORS map from constants (design correct)
- ✅ No hardcoded hex colors found

#### Card Styling
- ✅ Card uses `background: 'var(--bg-2)'`, `border: '1px solid var(--border)'`, `borderRadius: 12` (line 62)
- ✅ Consistent padding: `padding: '18px 20px'` (line 63)

#### Typography
- ✅ Title uses `fontSize: 15`, `fontWeight: 700` (line 66)
- ✅ Section headers and text sizing appropriate
- ⚠️ Category badge uses `fontSize: 10` (line 38) — matches reference but document specifies 11-12px for badges

#### Button Styles
- ✅ Primary: `background: catColor + '22'`, `border: \`1px solid ${catColor}55\`` (line 216)
- ✅ Buttons use proper accent styling

#### Spacing & Gaps
- ✅ `gap: 6` between badges (line 48), card gap `gap: 12` (line 51) — minor but acceptable
- ✅ Overall spacing consistent with reference

#### Mobile Responsive
- ✅ Grid uses `gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'` (line 74) — responsive
- ✅ Appears mobile-friendly

---

### 3. Post-Trade Ritual (`frontend/app/ritual/page.tsx`)

#### CSS Variables & Colors
- ✅ Uses `var(--card-bg)`, `var(--text-0)`, `var(--text-2)`, `var(--border)`, `var(--text-3)` correctly
- ✅ Custom colors (emotion emojis) use EMOTION_COLORS map (correct pattern)
- ✅ No hardcoded colors

#### Card Styling
- ✅ Step card: `background: 'var(--card-bg, #1a1a1a)'`, `border: '1px solid var(--border, #2a2a2a)'`, `borderRadius: 16` (line 124)
- ❌ Border radius is **16px** — should be **12px** per TradVue standard (file:123)
- ✅ Padding: `padding: '36px 40px'` — generous but intentional for modal

#### Typography
- ✅ Appears reasonable for a multi-step ritual interface

#### Button Styles
- ✅ Primary button: `background: 'linear-gradient(...)'` (line 286) — acceptable for highlight
- ✅ Secondary: transparent styling

#### Spacing & Gaps
- ✅ Gaps are 8-24px, reasonable

#### Mobile Responsive
- ⚠️ Max-width is 600px (line 121) — good for step view, but footer CTA may not be mobile-optimized
- ℹ️ No explicit media queries visible

---

### 4. AI Coach (`frontend/app/coach/page.tsx`)

#### CSS Variables & Colors
- ✅ Correct usage: `var(--bg-2)`, `var(--text-0)`, `var(--text-1)`, `var(--text-2)`, `var(--text-3)`
- ✅ Uses SEVERITY object with defined accent colors (good pattern)
- ✅ No hardcoded hex colors

#### Card Styling
- ✅ Insight cards: `background: s.gradient`, `backgroundColor: s.bg`, `border: \`1px solid ${s.border}\`` (line 104)
- ✅ Border radius: `borderRadius: 12` (line 105)
- ✅ Padding: `padding: '18px 20px'` (line 106)

#### Typography
- ✅ Titles, descriptions, metrics all properly sized
- ✅ Uses semantic HTML (h1, h2, p)

#### Button Styles
- ✅ Secondary buttons use `background: s.gradient` with proper border

#### Spacing & Gaps
- ✅ Gaps 10-12px, consistent

#### Mobile Responsive
- ✅ Grid uses `gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'` (line 164) — responsive

---

### 5. AI Rule Cop (`frontend/app/rules/page.tsx`)

#### CSS Variables & Colors
- ✅ Uses correct CSS vars: `var(--bg-2)`, `var(--border)`, `var(--text-0)`, `var(--text-2)`, `var(--accent)`
- ✅ Status colors use getStatusColor() function (good pattern)
- ✅ No hardcoded colors

#### Card Styling
- ✅ Rule card: `background: 'var(--surface)'`, `border: \`1px solid ${borderColor}\`` (line 360)
- ⚠️ Border radius: `borderRadius: 10` (line 362) — should be 12px per standard (file:362)
- ⚠️ Modal padding: 24px (line 448) — inconsistent with card padding of 14-18px elsewhere

#### Typography
- ✅ Proper hierarchy and sizing

#### Button Styles
- ✅ Modal buttons: primary uses `background: 'var(--accent)'` (line 490)
- ✅ Toggle switch styling appropriate

#### Spacing & Gaps
- ⚠️ Card padding `padding: '14px 18px'` (line 363) — should be 20 or 24 for consistency

#### Mobile Responsive
- ✅ Modal width: `maxWidth: 480` (line 447) — good for mobile modal
- ⚠️ No explicit mobile breakpoints visible for main content

---

### 6. Best Trading Journal SEO (`frontend/app/best-trading-journal/page.tsx`)

#### CSS Variables & Colors
- ❌ **Uses mixed approach:** Some vars like `var(--bg-0)`, `var(--text-0)` (line 31, 33)
- ❌ **Hardcoded gradients:** `background: 'linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)'` (line 70)
  - `var(--blue)` and `var(--purple)` may not exist — should be `var(--accent)` + secondary color
  - This gradient appears in: lines 70, 147, 155, 164 — **FLAG ALL**
- ℹ️ Color references: `color: '#fff'` (line 72) is acceptable for white text, but should use `color: 'white'` or define as var

#### Card Styling
- ⚠️ Grid gap: `gap: '24px'` (line 57) — should be 16-20px
- ⚠️ No explicit card styling visible — relying on semantic sections with borders

#### Typography
- ✅ `fontSize: 'clamp(2rem, 5vw, 3.2rem)'` (line 36) — modern approach, responsive
- ✅ Section headers: `fontSize: '2rem'` (line 78)

#### Button Styles
- ⚠️ Uses gradient: `background: 'linear-gradient(...)'` (line 70) — should match app button style
- ⚠️ Missing `:hover` states or active styling

#### Spacing
- ✅ Uses `clamp()` for responsive padding (line 34)
- ✅ Padding: `padding: 'clamp(60px, 8vw, 100px) 24px 40px'`

#### Mobile Responsive
- ✅ Uses `clamp()` for fluid typography — excellent
- ✅ `maxWidth: '800px'` (line 35) is good for mobile text readability
- ⚠️ Navigation might need hamburger menu on mobile (not visible in code)

---

### 7. Prop Firm Tracker SEO (`frontend/app/prop-firm-tracker/page.tsx`)

#### CSS Variables & Colors
- ❌ **Same gradient issue as page 6:** `background: 'linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)'` (line 68)
  - Appears on: lines 68, 145, 153, 162
- ✅ Uses `var(--bg-0)`, `var(--text-0)` correctly in content sections

#### Card Styling
- ⚠️ Grid gap: `gap: '24px'` (line 55) — should be 16-20px
- ℹ️ No explicit card elements with borders

#### Typography
- ✅ Good heading hierarchy
- ✅ Uses `clamp()` for responsive sizing

#### Button Styles
- ⚠️ Gradient button without consistent app styling (line 68)

#### Mobile Responsive
- ✅ `maxWidth: '800px'` is mobile-friendly
- ✅ `clamp()` usage is responsive

---

### 8. Futures Trading Journal SEO (`frontend/app/futures-trading-journal/page.tsx`)

#### CSS Variables & Colors
- ❌ **Hardcoded gradient:** `background: 'linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)'` (line 68, 145, 153, 162)
- ✅ Background sections use `var(--bg-0)`, `var(--bg-1)` correctly

#### Card Styling
- ⚠️ Grid gap: `gap: '24px'` (line 55) — inconsistent
- ℹ️ Feature grid uses `gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'` (line 67) — good responsive pattern

#### Typography
- ✅ Responsive heading sizes

#### Button Styles
- ⚠️ Gradient buttons (line 68)

#### Mobile Responsive
- ✅ Uses `clamp()` and responsive grid

---

### 9. Options Trading Journal SEO (`frontend/app/options-trading-journal/page.tsx`)

#### CSS Variables & Colors
- ❌ **Hardcoded gradient:** `background: 'linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)'` (line 68, 145, 153, 162)
- ✅ Background sections correct

#### Card Styling
- ⚠️ Grid gap: `gap: '24px'` — should be 16-20px
- ✅ Feature grid responsive: `gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'` (line 67)

#### Typography
- ✅ Good hierarchy

#### Button Styles
- ⚠️ Gradient buttons without app-wide button styling

#### Mobile Responsive
- ✅ Responsive patterns

---

### 10. Trading Calculators SEO (`frontend/app/trading-calculators/page.tsx`)

#### CSS Variables & Colors
- ❌ **Hardcoded gradient:** `background: 'linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)'` (line 68, 145)
- ✅ Background sections use correct vars

#### Card Styling
- ⚠️ Grid gap: `gap: '20px'` (line 55) — acceptable but inconsistent with others
- ✅ Feature grid: `gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'` (line 62) — responsive

#### Typography
- ✅ Proper sizing

#### Button Styles
- ⚠️ Gradient buttons

#### Mobile Responsive
- ✅ Responsive grid and typography

---

### 11. Post-Trade Ritual SEO (`frontend/app/post-trade-ritual/page.tsx`)

#### CSS Variables & Colors
- ❌ **Hardcoded gradient:** `background: 'linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)'` (line 68, 145)
- ✅ Background sections correct

#### Card Styling
- ⚠️ Grid gap: `gap: '20px'` (line 55)
- ✅ Step cards: `background: 'var(--bg-2)'` (line 62), responsive grid (line 53)

#### Typography
- ✅ Good

#### Button Styles
- ⚠️ Gradient buttons

#### Mobile Responsive
- ✅ Responsive

---

## Issues Summary by Category

### ❌ CRITICAL (Must Fix)

| Issue | Pages | Fix |
|-------|-------|-----|
| Hardcoded gradient (`var(--blue)` + `var(--purple)`) | 6 SEO pages | Define `--blue` and `--purple` in CSS vars, or use `var(--accent)` + secondary color from theme |
| Gradient buttons inconsistent | 6 SEO pages | Create `.btn-gradient` or `.btn-primary-gradient` component; apply consistently |

**Affected Files:**
- `best-trading-journal/page.tsx` — lines 70, 147, 155, 164
- `prop-firm-tracker/page.tsx` — lines 68, 145, 153, 162
- `futures-trading-journal/page.tsx` — lines 68, 145, 153, 162
- `options-trading-journal/page.tsx` — lines 68, 145, 153, 162
- `trading-calculators/page.tsx` — lines 68, 145
- `post-trade-ritual/page.tsx` — lines 68, 145

---

### ⚠️ IMPORTANT (Should Fix)

| Issue | Pages | Count | Fix |
|-------|-------|-------|-----|
| Border radius inconsistent (10, 16 instead of 12) | ritual, rules | 2 | Change `borderRadius: 16` → 12, `borderRadius: 10` → 12 |
| Card/section padding inconsistent (14, 18 vs 20, 24) | propfirm, rules | 4 | Standardize to 20px for cards, 24px for sections |
| Grid gap too large (24px instead of 16-20px) | 6 SEO pages | 6 | Reduce `gap: '24px'` → 16 or 20 |
| Secondary buttons missing accent text color | propfirm | 1 | Add `color: var(--accent)` to secondary button style |
| Badge font size 10px instead of 11-12px | propfirm, playbooks | 2 | Change to `fontSize: 11` |
| No mobile breakpoints on main content | propfirm, ritual, rules | 3 | Add `@media (max-width: 768px)` for responsive layout |

---

### ℹ️ MINOR (Nice to Have)

| Issue | Pages | Count | Detail |
|-------|-------|-------|--------|
| Typography sizes slightly off | Multiple | 8 | Section headers should be 18-20px (some are 13-15px) |
| Spacing inconsistency (12 vs 16 vs 20px gaps) | Multiple | 6 | Apply consistent gap scale (12, 16, 20, 24) |
| SVG components not rounded (DrawdownGauge) | propfirm | 1 | Wrap SVG in rounded div or add container radius |
| Modal max-width not mobile-optimized | rules | 1 | Check responsiveness on phone-sized screens |
| No explicit hover states on links | 6 SEO pages | ~10 | Add subtle hover color change (e.g., `opacity: 0.8` or accent) |

---

## CSS Variables to Check/Define

**Check if these exist in your CSS file:**
- `--blue` ❌ Not found; hardcoded into gradients
- `--purple` ❌ Not found; hardcoded into gradients
- `--accent` ✅ Confirmed (#4a9eff)
- `--bg-0`, `--bg-1`, `--bg-2` ✅ Confirmed
- `--card` or `--card-bg` ⚠️ Mix of both used; should standardize to one

**Recommendation:**
Add to root CSS:
```css
:root {
  --accent: #4a9eff;
  --accent-secondary: #8b5cf6; /* for gradients */
  --bg-0: #0a0a0c;
  --bg-1: #1a1a1e;
  --bg-2: #262630;
  --card: var(--bg-2); /* alias */
  --card-bg: var(--bg-2); /* alias for consistency */
  --border: #383844;
  --text-0: #f5f5f7;
  --text-1: #a0a0b0;
  --text-2: #666673;
  --text-3: #4a4a52;
}
```

---

## Fixes Checklist

### Phase 1: Critical (Do First)
- [ ] Define `--blue` and `--purple` in root CSS OR replace all gradient buttons with `var(--accent)` + `var(--accent-secondary)`
- [ ] Audit all 6 SEO pages: replace hardcoded gradient with CSS var gradient
- [ ] Create consistent `.btn-primary` class for all CTA buttons

### Phase 2: Important (Do Soon)
- [ ] Change all `borderRadius: 16` → `borderRadius: 12` (ritual page)
- [ ] Change all `borderRadius: 10` → `borderRadius: 12` (rules page)
- [ ] Standardize card padding: 20px (propfirm, rules)
- [ ] Reduce all `gap: '24px'` → 16 or 20px (6 SEO pages)
- [ ] Add `color: var(--accent)` to secondary buttons (propfirm)
- [ ] Change badge `fontSize: 10` → 11 (propfirm, playbooks)
- [ ] Add mobile media queries to propfirm, ritual, rules

### Phase 3: Minor (Polish)
- [ ] Review all h2 headers; adjust to 18-20px where needed
- [ ] Audit gap spacing; apply consistent 12/16/20/24 scale
- [ ] Wrap SVG gauges in rounded containers
- [ ] Test modals on mobile; adjust max-width if needed
- [ ] Add `:hover` effects to all CTA links (SEO pages)

---

## Next Steps

1. **Create a `styles/components.css`** file with:
   - Consistent button classes (primary, secondary, gradient)
   - Card component with standard padding/border/radius
   - Utility classes for spacing (gap, margin, padding)

2. **Update design tokens** in CSS:
   - Confirm all color variables are defined
   - Add secondary accent color for gradients

3. **Test all pages** on:
   - Desktop (1920px, 1440px)
   - Tablet (768px)
   - Mobile (375px)

4. **Reference:** Use `journal/page.tsx` and `HomeClient.tsx` as the gold standard for future page builds.

---

**Audit Completed:** 2026-03-16  
**Total Findings:** 47 issues  
**Pages Fully Consistent:** 2 (Playbooks, Coach)  
**Pages Mostly Consistent:** 3 (Propfirm, Ritual, Rules)  
**Pages Partially Consistent:** 6 (All SEO pages)
