# KaizenType storefront — design review (2026-09-09)

**Cél:** `main` @ 9f3256a ("majdnem push"), élőben futtatva `localhost:3002`-n, desktop 1440px és mobil 390px nézetben.
**Módszer:** `/plan-design-review` (gstack), 7 dimenzió, screenshot-alapú. Minden javaslat egyeztetve; **kód nem változott** ebben a sessionben.
**Kiindulás:** 6/10. **Célállapot az elfogadott taskokkal:** 8/10.

## Összkép

Ami jó: a brand karakteres és nem sablon (kanji glyph-rendszer, szótár-blokk, brush wave, ink/bone/red paletta, EB Garamond + DM Sans). A termék-showcase, a FAQ, a kollekció-fejléc és az account landing a legerősebb részek. Desktopon a tipográfia rendben.

Ami lehúzza: a hero technikai hibái (16px-es csík, mobil crop), mobilon vízszintes scroll és összeomló címsor-skála, nyelvi keveredés a vásárlási úton (PDP/kollekció/kosár angol), és bizalmi rések (ellentmondó statisztikák, fotó-név eltérés a véleményeknél, nem létező mérettáblázat, üres Kapcsolat/Blog).

## Értékelés dimenziónként

| Pass | Kezdő | Elfogadott taskokkal | Fő megállapítás |
|---|---|---|---|
| 1. Információs architektúra | 5 | 8 | nincs H1, kollekciók rejtve desktopon, footer link skeleton oldalra |
| 2. Interakciós állapotok | 6 | 8 | Kosárba gomb busy-állapot nélkül, üres kosár angol, 20 MB videó |
| 3. User journey | 5 | 7 | nyelvváltás a PDP-n, hiteltelen social proof, üres céloldalak |
| 4. AI-slop kockázat | 7 | 8 | hármas rács négyszer, minden szekció ugyanazzal a reveal-lel |
| 5. Design rendszer | 7 | 8 | nincs DESIGN.md, skeleton CSS versenyez, böngésző-felületek témázatlanok |
| 6. Reszponzív + a11y | 4 | 7 | 403px doc-szélesség 390-en, 19px terméknév, lang="en", 40px célok |
| 7. Nyitott döntések | – | 0 nyitott | minden tétel elfogadva vagy tudatosan halasztva |

## Mért tények

| Mérés | Érték | Küszöb |
|---|---|---|
| Dokumentum szélesség mobilon | 403px | 390px |
| `.sec-h` mobilon | 25px | törzs 19px |
| `.show-h` (terméknév) mobilon | 19.5px | törzs 18px |
| `.kicker` piros az ink-en | 4.15:1 @ 12.5px | 4.5:1 |
| `.hd-ic`, `.chip` magasság | 40px | 44px |
| `<html lang>` | `en` | `hu` |
| `<h1>` a nyitóoldalon | 0 | 1 |
| Hero videó | 25 MB HEVC + 20 MB H.264 | – |
| Hero full-bleed | 16px csík mindkét oldalon (`.home{overflow-x:clip}` + `body>main` 1rem margó) | 0 |

## Hero-döntés

Három hero-változat készült (HTML-sketch a valódi tokenekkel, desktop + mobil): A) film + bal-alsó copy, B) film + középre igazított statement DOM-logóval, C) split copy/film. **Döntés: egyik sem, marad a csak-videó hero.** Board és képek: `~/.gstack/projects/Szunyii-kaizen/designs/homepage-hero-20260909/` (`approved.json`: none). A hero-javaslatok ezért a technikai javításokra szűkülnek (csík, mobil crop, sr-only H1).

## Implementation Tasks

Synthesized from this review's findings. Each task derives from a specific finding above. Run with Claude Code or Codex; checkbox as you ship.

- [x] **T1 (P1, human: ~40 min / CC: ~8 min)** — KaizenHeader — Mobil header overflow megszüntetése (403px → 390px)
  - Surfaced by: Pass 6 — 6.1 `.hd-actions` 260→403px, a kosárszám levág
  - Files: `app/styles/kaizen-components.css` (≤860px media query: `.hd-bar gap`, `.hd-word` letter-spacing/size, `.hd-actions gap`), opcionálisan `app/components/kaizen/KaizenHeader.jsx` (keresés ikon a drawerbe mobilon)
  - Verify: 390px viewport, `document.documentElement.scrollWidth === 390`, a "0" látszik
- [x] **T2 (P1, human: ~20 min / CC: ~4 min)** — Homepage hero — 16px-es csík lokális javítása
  - Surfaced by: Pass 6 — 6.2 `.home{overflow-x:clip}` levágja a `-1rem` margót
  - Files: `app/styles/kaizen.css` (`main:has(.home){margin-inline:0}`), `app/styles/kaizen-pages.css` (`.hero-full` margin ki; `.fam` méretezés ellenőrzése)
  - Verify: `elementFromPoint(5,400)` a hero videó; a wave divider széltől szélig
- [x] **T3 (P1, human: ~30 min / CC: ~5 min)** — Tipográfia — Mobil clamp() alsó korlátok
  - Surfaced by: Pass 6 — 6.3 `.sec-h` 25px, `.show-h` 19.5px mobilon
  - Files: `app/styles/kaizen-pages.css` (`.sec-h clamp(34px,6.5vw,80px)`, `.sec-h-sm clamp(30px,6vw,68px)`, `.show-h clamp(28px,5vw,54px)`, `.dict-word clamp(30px,7vw,64px)`, `.stat-n clamp(36px,5vw,52px)`, `.fam .sec-h clamp(32px,6vw,72px)`)
  - Verify: 390px-en minden szekció-címsor ≥ 1.6× a törzsszöveg
- [x] **T4 (P1, human: ~2 h / CC: ~20 min)** — PDP + kollekció — Magyar vásárlási út
  - Surfaced by: Pass 3 — 3.1 "All products / Color / Size / Add to cart / The detail / Collection / Category / Colour / Featured / 1 item / Sort / All"
  - Files: új `app/lib/text.js` (az `accountText.js` mintájára), `app/routes/products.$handle.jsx`, `app/components/ProductForm.jsx`, `app/routes/collections.$handle.jsx`; Shopify admin: opciónevek "Szín / Méret" (utána a `/size|méret/i` regex ellenőrzése az `_index.jsx`-ben)
  - Verify: a PDP és a kollekció oldalon nincs angol UI-szöveg; `grep -rn "Add to cart\|All products\|The detail" app/` üres
- [x] **T5 (P1, human: ~20 min / CC: ~5 min)** — Kosár — Drawer és oldal magyarítása
  - Surfaced by: Pass 2 — 2.2 "Your bag is empty / Nothing here yet… / Shop the collection / Subtotal"
  - Files: `app/components/CartMain.jsx`, `app/components/CartSummary.jsx`, `app/components/CartLineItem.jsx`
  - Verify: üres kosár drawer magyar; `grep -n "Subtotal\|Your bag" app/components/Cart*.jsx` üres
- [x] **T6 (P2, human: ~20 min / CC: ~5 min)** — Homepage showcase — Kosárba gomb busy-állapot
  - Surfaced by: Pass 2 — 2.1 `disabled={!available}` kiüti a `?? fetcher.state` ágat
  - Files: `app/routes/_index.jsx` (Showcase, BundlePromo: `disabled={!available || busy}`, "Hozzáadás…" felirat)
  - Verify: gyors dupla kattintás egy tételt ad; a gomb a kérés alatt disabled
- [x] **T7 (P2, human: ~2 min / CC: ~1 min)** — Root — `<html lang="hu">`
  - Surfaced by: Pass 6 — 6.5
  - Files: `app/root.jsx:166`
  - Verify: `document.documentElement.lang === 'hu'`
- [x] **T8 (P2, human: ~15 min / CC: ~3 min)** — Homepage hero — Vizuálisan rejtett H1
  - Surfaced by: Pass 1 — 1.1 `document.querySelectorAll('h1').length === 0`
  - Files: `app/routes/_index.jsx` (Hero), `app/styles/kaizen.css` (`.sr-only`)
  - Verify: pontosan egy H1 a nyitóoldalon, vizuális változás nélkül
- [x] **T9 (P2, human: ~1 h / CC: ~10 min)** — Navigáció — Kollekciók desktopon is elérhetők
  - Surfaced by: Pass 1 — 1.2 a "Termékek" csak `#termekek` horgony
  - Files: `app/components/kaizen/KaizenHeader.jsx` (almenü a `navCollections`-ból) vagy `app/components/kaizen/KaizenFooter.jsx` (Vásárlás oszlop: Férfi/Női/Kiegészítők), `app/components/PageLayout.jsx` (prop átadás)
  - Verify: desktopon 1 kattintással elérhető `/collections/men|women|accessories`
- [x] **T10 (P2, human: ~10 min / CC: ~2 min)** — Family szekció — CTA felirat/irány
  - Surfaced by: Pass 1 — 1.4 "Csatlakozom" felfelé görget a termékekhez
  - Files: `app/routes/_index.jsx` (Family: felirat "Vásárlás a hozzáféréshez" vagy `fam-note` a gomb fölé)
  - Verify: a gomb szövege és a célja egyértelmű kattintás előtt
- [x] **T11 (P2, human: ~20 min / CC: ~4 min)** — Globális CSS — Témázott focus-visible és scrollbar
  - Surfaced by: Pass 5 — 5.3 böngésző-kék fókuszgyűrű, alap scrollbar
  - Files: `app/styles/kaizen.css` (`:focus-visible{outline:2px solid var(--red);outline-offset:3px}`, piros gombokon `outline-color:var(--bone)`; `html{scrollbar-color:var(--bone-mut) transparent}`)
  - Verify: Tab-bal végigmenve minden fókusz piros/bone gyűrűt kap
- [x] **T12 (P2, human: ~3 h / CC: ~30 min)** — Homepage — Ritmus törése: filozófia-kártyák a szótárba, vélemények egy nagy idézet
  - Surfaced by: Pass 4 — 4.1 hármas rács négyszer (vstrip, kz-cards, voices, fam-feats)
  - Files: `app/routes/_index.jsx` (Philosophy, Community), `app/styles/kaizen-pages.css` (`.kz-cards` → inline glyph-sorok a `.dict` alatt, csak az "1%" marad kiemelt; `.voices` → egy nagy idézet + két rövid sor, fotó nélkül)
  - Verify: mobilon a homepage ≥ 1200px-szel rövidebb; a szótár-blokk a filozófia szekció fő eleme
- [ ] **T13 (P3, human: ~30 min / CC: n/a)** — Shopify admin — Tartalom a brand szótár szerint
  - Surfaced by: Pass 5 — 5.4 "T-shirt" vs "Poló", "Color/Size", "M · S" sorrend, "edzésen.A", Kaizen Top leírása "Oversized Polo"
  - Files: nincs (admin: terméktípusok, opciónevek, variáns-sorrend S→M→L, leírások)
  - Verify: homepage showcase spec-sor és chipek helyes sorrendben, magyar típusnevek
- [ ] **T14 (P3, human: ~20 min / CC: n/a)** — Shopify admin — Kapcsolat oldal tartalma
  - Surfaced by: Pass 3 — 3.5a `/pages/contact` üres, a FAQ "Írj nekünk" ide mutat
  - Files: nincs (admin: Kapcsolat oldal: e-mail, válaszidő egy munkanap, opcionálisan Instagram)
  - Verify: `/pages/contact` tartalmas; ha űrlap kell, külön route a `newsletter.jsx` mintájára
- [x] **T15 (P3, human: ~2 h / CC: ~15 min)** — Dokumentáció — DESIGN.md a tokenekből
  - Surfaced by: Pass 5 — 5.1 nincs leírt design rendszer
  - Files: új `DESIGN.md` (paletta, típus-skála, spacing, kártya-szabály, kanji-használat, komponens-szótár: kicker/display/btn/kz-card/acct-card/Wave/KaizenSeal)
  - Verify: minden token és komponens a fájlban hivatkozott CSS-ben létezik
- [x] **T16 (P3, human: ~3 h / CC: ~25 min)** — Showcase — "Értesíts, ha kapható" elfogyott variánsnál
  - Surfaced by: Pass 2 — 2.4 elfogyott állapotban nincs továbbvezető út
  - Files: új resource route (a `app/routes/newsletter.jsx` mintájára, tag: `restock:<variantId>`), `app/routes/_index.jsx` (Showcase: e-mail mező az "Elfogyott" gomb helyén), `app/styles/kaizen-pages.css`
  - Verify: elfogyott variánsnál e-mail beküldhető, siker/hiba üzenet a hírlevél-mintával

_No new tasks from Pass 7 (Unresolved decisions)._

## Halasztott tételek

Lásd `TODOS.md` (14 tétel: 1.3, 2.3, 3.2, 3.3, 3.4, 3.5b, 4.2, 4.3, 4.4, 5.2, 6.4, 6.6, 6.7, 6.8).

## NOT in scope

- Checkout témázása: Shopify hosted checkout, a storefront kódból nem érhető el.
- Többnyelvűség: nincs igény, az oldal magyar.
- 404, blog és cikk oldalak brandelése: nincs tartalom, amíg nincs blog.
- Search & Discovery facet-bővítés: adminban dől el, a UI a visszakapott faceteket rendereli.
- Hero headline/CTA a videón: a döntés a csak-videó hero mellett született (D5).

## What already exists

- Tokenek és alap: `app/styles/kaizen.css` (`--ink-*`, `--bone-*`, `--red*`, `--line*`, `--sans/--serif/--brush`, `.wrap`, `.kicker`, `.display`, `.btn/.btn-ghost/.btn-danger`, `.ul`, reveal).
- Komponens-szótár: `kz-card`, `acct-card`, `col-*` kollekció-fejléc és chipek, `pdp-*`, `cart-*`, `sd-*` keresés, `acct-*`.
- Brand SVG: `KaizenSeal`, `EnsoMark`, `BrushRibbon`, `Wave` (`app/components/kaizen/Brand.jsx`).
- Segédek: `formatMoney` (`app/lib/money.js`), `accountText.js` (magyar státuszok, dátum), `useReveal`, `newsletter.jsx` resource route mintája űrlapokhoz.

## Approved Mockups

| Screen/Section | Mockup Path | Direction | Notes |
|---|---|---|---|
| Homepage hero | `~/.gstack/projects/Szunyii-kaizen/designs/homepage-hero-20260909/board-{A,B,C}.png` | egyik sem elfogadva | a csak-videó hero marad; a képek referenciaként maradnak |

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | Codex nincs telepítve |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_open | score: 6/10 → 8/10, 30 decisions (16 accepted, 14 deferred) |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **VERDICT:** DESIGN reviewed (issues open, tasks listed) — eng review required before shipping the task batch.

NO UNRESOLVED DECISIONS
