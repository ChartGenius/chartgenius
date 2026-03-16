/**
 * csvSecurity.test.ts
 * Tests for CSV sanitization functions in TradVue
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * SECURITY AUDIT FINDINGS — Part 3: Think Like an Attacker
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * ATTACK VECTOR 1: localStorage Poisoning
 * ────────────────────────────────────────
 * PASS — Holdings, sold positions, watchlist, and dividends are all read via
 * JSON.parse() and rendered through React JSX (auto-escaped). The `loadLS`
 * helper catches parse errors safely. No raw innerHTML usage found for
 * localStorage values.
 * Fields that render user text (ticker, company, sector, notes) all go
 * through React's virtual DOM — no dangerouslySetInnerHTML found on these.
 *
 * ATTACK VECTOR 2: URL Parameter Injection
 * ─────────────────────────────────────────
 * PASS — No pages were found reading URL query params and injecting them
 * into the DOM unsafely. The portfolio, journal, playbooks, and propfirm
 * pages do not use useSearchParams() or window.location.search for rendering.
 *
 * ATTACK VECTOR 3: Trade Notes / Descriptions
 * ─────────────────────────────────────────────
 * PASS — Trade notes are stored as plain strings in localStorage (JSON) and
 * rendered as React text nodes (e.g. {trade.notes}). React auto-escapes
 * JSX expressions, blocking XSS. No `dangerouslySetInnerHTML` found on
 * notes fields in journal/page.tsx or ImportModal.tsx.
 *
 * ATTACK VECTOR 4: Playbook Names / Descriptions
 * ────────────────────────────────────────────────
 * PASS — Playbook name and description are rendered via React JSX children
 * ({playbook.name}, {playbook.description}). No dangerouslySetInnerHTML.
 * Verified in app/playbooks/page.tsx card rendering.
 *
 * ATTACK VECTOR 5: Prop Firm Account Names
 * ──────────────────────────────────────────
 * PASS — Account names are rendered via React JSX: {account.name}.
 * No dangerouslySetInnerHTML. Verified in app/propfirm/page.tsx.
 *
 * ATTACK VECTOR 6: Ritual Notes
 * ──────────────────────────────
 * PASS — Ritual entries are stored as JSON and rendered via React text nodes.
 * No dangerouslySetInnerHTML usage in app/post-trade-ritual/page.tsx.
 *
 * ATTACK VECTOR 7: Search / Filter Inputs
 * ─────────────────────────────────────────
 * PASS — Search inputs are used only for .filter() operations on in-memory
 * arrays. Results are rendered as React text nodes (no DOM reflection of the
 * raw input value). The ticker/company search in portfolio holdings tab uses
 * standard React controlled input with array filtering — no injection risk.
 *
 * ADDITIONAL FINDING: CSV Import Formula Injection (FIXED)
 * ──────────────────────────────────────────────────────────
 * VULNERABILITY — CSV fields starting with =, +, -, @, \t, or \r can
 * execute arbitrary formulas when the exported/imported CSV is opened in
 * Excel or Google Sheets.
 * FIX: sanitizeCSVField() added to parseCSVText() in brokerParsers.ts;
 * sanitizeExportCell() applied to all CSV export paths.
 *
 * ADDITIONAL FINDING: HTML in CSV Fields (FIXED)
 * ────────────────────────────────────────────────
 * VULNERABILITY — If a broker CSV contains HTML tags in description fields,
 * they would be stored in localStorage and potentially rendered.
 * FIX: sanitizeCSVField() strips all HTML tags from imported CSV values.
 *
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { sanitizeCSVField, sanitizeCSVExportCell } from '../brokerParsers'

// ── sanitizeCSVField (Import Sanitization) ────────────────────────────────────

describe('sanitizeCSVField — HTML stripping', () => {
  it('strips script tags from field values', () => {
    const result = sanitizeCSVField("<script>alert('xss')</script>")
    expect(result).toBe("alert('xss')")
  })

  it('strips img tags with onerror payloads', () => {
    const result = sanitizeCSVField('<img src=x onerror=alert(1)>')
    expect(result).toBe('')
  })

  it('strips anchor tags but keeps text content', () => {
    const result = sanitizeCSVField('<a href="evil.com">AAPL</a>')
    expect(result).toBe('AAPL')
  })

  it('strips nested HTML tags', () => {
    const result = sanitizeCSVField('<b><i>bold and italic</i></b>')
    expect(result).toBe('bold and italic')
  })
})

describe('sanitizeCSVField — formula injection blocking', () => {
  it('prefixes = formula with single quote', () => {
    const result = sanitizeCSVField('=CMD("calc")')
    expect(result).toBe("'=CMD(\"calc\")")
  })

  it('prefixes + formula with single quote', () => {
    const result = sanitizeCSVField('+SUM(A1:A10)')
    expect(result).toBe("'+SUM(A1:A10)")
  })

  it('prefixes - formula (non-numeric) with single quote', () => {
    const result = sanitizeCSVField('-HYPERLINK("x","y")')
    expect(result).toBe("'-HYPERLINK(\"x\",\"y\")")
  })

  it('prefixes @ formula with single quote', () => {
    const result = sanitizeCSVField('@SUM(1+1)')
    expect(result).toBe("'@SUM(1+1)")
  })

  it('blocks tab injection (formula starting with tab)', () => {
    const result = sanitizeCSVField('\t=CMD("calc")')
    // Tab is at start — should be prefixed, then trimmed
    // After prefix: "'\t=..." then trim removes leading/trailing whitespace
    // The quote prevents formula execution
    expect(result.startsWith("'")).toBe(true)
  })

  it('blocks carriage return injection', () => {
    const result = sanitizeCSVField('\r=CMD()')
    expect(result.startsWith("'")).toBe(true)
  })
})

describe('sanitizeCSVField — field length limiting', () => {
  it('truncates fields longer than 10000 characters', () => {
    const longValue = 'A'.repeat(15000)
    const result = sanitizeCSVField(longValue)
    expect(result.length).toBe(10000)
  })

  it('does not truncate fields at exactly 10000 characters', () => {
    const exactValue = 'B'.repeat(10000)
    const result = sanitizeCSVField(exactValue)
    expect(result.length).toBe(10000)
  })

  it('does not truncate fields shorter than 10000 characters', () => {
    const shortValue = 'AAPL'
    const result = sanitizeCSVField(shortValue)
    expect(result).toBe('AAPL')
  })
})

describe('sanitizeCSVField — normal values pass through', () => {
  it('passes normal ticker symbols unchanged', () => {
    expect(sanitizeCSVField('AAPL')).toBe('AAPL')
    expect(sanitizeCSVField('TSLA')).toBe('TSLA')
    expect(sanitizeCSVField('BRK.B')).toBe('BRK.B')
  })

  it('passes normal date strings unchanged', () => {
    expect(sanitizeCSVField('2024-01-15')).toBe('2024-01-15')
    expect(sanitizeCSVField('01/15/2024')).toBe('01/15/2024')
  })

  it('passes normal numeric strings unchanged', () => {
    expect(sanitizeCSVField('100.00')).toBe('100.00')
    expect(sanitizeCSVField('1,234.56')).toBe('1,234.56')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeCSVField('')).toBe('')
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeCSVField('  AAPL  ')).toBe('AAPL')
  })
})

describe('sanitizeCSVField — numbers still parse correctly after sanitization', () => {
  it('sanitized price string still parses to correct number', () => {
    const sanitized = sanitizeCSVField('  150.25  ')
    expect(parseFloat(sanitized)).toBe(150.25)
  })

  it('sanitized quantity string still parses to correct number', () => {
    const sanitized = sanitizeCSVField('100')
    expect(parseInt(sanitized, 10)).toBe(100)
  })

  it('does not prepend quote to negative numbers (-123 passes through safely)', () => {
    // Negative numbers like -10, -1234.56 are valid broker CSV values and must not be corrupted
    const sanitized = sanitizeCSVField('-100')
    expect(sanitized).toBe('-100')
    expect(parseFloat(sanitized)).toBe(-100)
  })
})

// ── sanitizeCSVExportCell (Export Sanitization) ───────────────────────────────

describe('sanitizeCSVExportCell — export formula injection prevention', () => {
  it('prefixes = formula with single quote on export', () => {
    const result = sanitizeCSVExportCell('=SUM(A1:A5)')
    expect(result).toBe("'=SUM(A1:A5)")
  })

  it('prefixes + on export', () => {
    const result = sanitizeCSVExportCell('+123')
    expect(result).toBe("'+123")
  })

  it('prefixes - on export', () => {
    const result = sanitizeCSVExportCell('-HYPERLINK("x","x")')
    expect(result).toBe("'-HYPERLINK(\"x\",\"x\")")
  })

  it('prefixes @ on export', () => {
    const result = sanitizeCSVExportCell('@SUM()')
    expect(result).toBe("'@SUM()")
  })

  it('does not modify normal ticker symbols on export', () => {
    expect(sanitizeCSVExportCell('AAPL')).toBe('AAPL')
    expect(sanitizeCSVExportCell('KO')).toBe('KO')
  })

  it('does not modify normal dollar amounts on export', () => {
    expect(sanitizeCSVExportCell('150.25')).toBe('150.25')
    expect(sanitizeCSVExportCell('$1,234.56')).toBe('$1,234.56')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeCSVExportCell('')).toBe('')
  })
})
