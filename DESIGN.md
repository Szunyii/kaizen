# KaizenType design rendszer

A storefront vizuális szótára. Minden új oldal és komponens ebből épül; a tokenek forrása `app/styles/kaizen.css`. Ha egy érték itt és a CSS-ben eltér, a CSS az igaz, és ezt a fájlt kell frissíteni.

## Hangulat

Sötét "ink" alap, csont-fehér szöveg, egyetlen brand-piros akcentus. Japán kalligráfia-motívumok (kanji glyph, enso pecsét, brush wave) mint a márka egyetlen dekoratív rétege. Nyugodt, sűrű, kevés szín. Ami nem szolgálja a hierarchiát, az nincs.

Osztályozás: a nyitóoldal PERSUADE (brand-first, film hero), a PDP / kollekció / kosár / account OPERATE (feladat-központú, azonos tokenek, kevesebb dísz).

## Színek

| Token | Érték | Használat |
|---|---|---|
| `--ink-900` | `#080605` | oldal háttér |
| `--ink-850` | `#0d0807` | kártya, drawer, panel háttér |
| `--ink-800` | `#171210` | mezők, chipek, másodlagos felületek |
| `--ink-750` | `#201814` | hover, csíkozott placeholder |
| `--ink-red` | `#2c0e09` | wave / brush kitöltés a footerben és a Family-ben |
| `--bone` | `#f2ede4` | címsorok, elsődleges szöveg |
| `--bone-soft` | `#e8e2d9` | nav linkek, ghost gomb |
| `--bone-dim` | `#cfc9c0` | törzsszöveg kiemelt szakasza |
| `--bone-mut` | `#a8a29a` | törzsszöveg, leírások |
| `--bone-faint` | `#8f8880` | meta, címkék, lábjegyzet (5.8:1 az ink-en) |
| `--red` | `#DA291C` | CTA háttér, glyph, kicker, akcentus |
| `--red-deep` / `--red-bright` | `#b31f14` / `#ef3626` | hover és kis piros szöveg (jobb kontraszt) |
| `--red-wash` | `rgba(218,41,28,.14)` | kiválasztott chip háttér |
| `--line` / `--line-2` | `rgba(232,226,217,.1 / .06)` | hairline elválasztók, keretek |

Szabály: egy akcentus. Kis méretű (≤14px) piros szöveg `--red-bright`-tal, nem `--red`-del. Piros felületen a másodlagos szöveg `#fff`, sosem szürke.

## Tipográfia

| Token | Betű | Szerep |
|---|---|---|
| `--serif` | EB Garamond 400/500/600 | display címsorok, árak, számok (`.display`) |
| `--sans` | DM Sans 400/500/700 | törzs, UI, gombok, kicker |
| `--brush` | Noto Serif JP 500/700 | kanji glyph-ek (`.kanji`, `.dict-k`, pecsét) |

Skála (desktop → mobil, mindig `clamp()` alsó korláttal, hogy mobilon is címsor maradjon):

| Elem | Méret |
|---|---|
| hero H1 | `min(8vw,104px)`, line-height .96 |
| szekció H2 `.sec-h` | `clamp(34px, 6.5vw, 80px)` |
| kisebb H2 `.sec-h-sm` | `clamp(30px, 6vw, 68px)` |
| termékcím `.show-h`, PDP `.pdp-title` | `clamp(28px, 5vw, 54px)` / `clamp(34px, 4.4vw, 60px)` |
| bevezető `.sec-p` | 19px / 1.6 |
| törzs | 16–18px / 1.6–1.75, max 60–66ch |
| kicker `.kicker` | 12.5px, 500, `.28em` tracking, uppercase, piros |
| gomb | 13px, 700, `.16em`, uppercase |
| meta / címke | 11–12px, `.16–.24em`, uppercase, `--bone-faint` |

Minta: kicker (opcionális kanji + gondolatjel) → display H2 → egy rövid bevezető bekezdés. A kanji-kicker ott, ahol jelentése van (filozófia, Family, FAQ); máshol sima kicker.

## Térköz és rács

- Oldal: `--page-max: 1560px`, `--page-pad: clamp(20px, 3.5vw, 40px)`; `.wrap` = `min(1560px, 100vw - 2*pad)`, középre.
- Szekció: `.section-pad` `clamp(70px, 9vw, 120px)`; szekción belül 22–32px a kicker/címsor/bekezdés között.
- Rács: `auto-fit, minmax(…)` mindenhol; a hármas kártyarács nem alapértelmezés. Egy szekció = egy feladat, egy címsor, egy támogató mondat.
- Header: `--header-h: 76px`, sticky, `rgba(8,6,5,.94)` + blur.
- Full-bleed szekció csak a nyitóoldalon (`main:has(.home){margin-inline:0}`), a `.home{overflow-x:clip}` a kanji-vízjeleket vágja.

## Formák és felületek

- Sarkok: 0–4px. Gomb 0px, chip/mező 2–3px, kártya/panel 4–5px, thumbnail 4px. Nincs pill, nincs nagy radius.
- Keret: 1px `--line` hairline; kiemelt panel `rgba(218,41,28,.3)` piros keret + `linear-gradient(180deg,#1a0b07,var(--ink-850))`.
- Árnyék: csak mélységhez, mindig eltolt + lágy (`0 30px 80px -30px rgba(0,0,0,.8)`); nincs színes glow.
- Kártya csak akkor, ha a kártya maga az interakció (account dashboard, rendelés-lista). Tartalmi felsorolás hairline-nal elválasztva (`dict-parts`, `voice-list`, FAQ).

## Komponensek

| Osztály | Mi ez |
|---|---|
| `.btn`, `.btn-ghost`, `.btn-danger` | CTA, másodlagos, romboló; 19px×32px padding, ikon jobbra (`I.arrow`) |
| `.chip`, `.col-chip`, `.product-options-item`, `.acct-tab` | választó gombok; aktív = piros keret + `--red-wash` |
| `.kicker` + `.display` | szekció-fejléc páros |
| `.dict`, `.dict-parts`, `.one` | szótár-blokk és az "1%" állítás-sáv (filozófia) |
| `.show` | termék-showcase: kép 4:5 + szöveg, váltakozó oldal |
| `.voice-lead`, `.voice-row` | vélemények: egy nagy idézet + rövid sorok, fotó nélkül |
| `.faq-i` | számozott kérdés, plusz ikon, piros bal él nyitva |
| `.restock`, `.ft-form` | egy mezős űrlapok (értesítés, hírlevél): mező + piros gomb egy keretben, `role="status"` üzenet |
| `.cart-*`, `.sd-*`, `.acct-*`, `.pdp-*`, `.col-*` | drawer és oldalak; ugyanazok a tokenek |
| `KaizenSeal`, `EnsoMark`, `BrushRibbon`, `Wave` | kódban rajzolt brand SVG-k (`app/components/kaizen/Brand.jsx`) |

## Mozgás

- Easing: `--ease` (általános), `--ease-out` (belépés). Idő 0.2–0.45s UI-ra, 0.8s reveal-re.
- Egy szerzői pillanat a nyitóoldalon: a hero piros vonala (`.hero-video::after`). A `.reveal` belépés mérsékelten, `prefers-reduced-motion` esetén kikapcsol.
- Hover csak ott, ahol információt hordoz (link szín, chip keret, kép enyhe zoom a showcase-ben).

## Böngésző-felületek

- `::selection` piros/fehér; `scrollbar-color: var(--bone-mut) transparent`.
- `:focus-visible` 2px piros outline, 3px offset; piros gombon `--bone` outline. Mezőkön a keret színe jelzi a fókuszt.
- `<html lang="hu">`; minden UI-szöveg magyar, a közös szövegek `app/lib/text.js`-ben, az account szövegek `app/lib/accountText.js`-ben. Shopify adatra (opciónevek, terméktípus, kollekciócím) a `text.js` map-jei adnak magyar címkét.

## Akadálymentesség

- Törzsszöveg ≥ 15px, kontraszt ≥ 4.5:1 (`--bone-faint` 5.8:1, `--red-bright` kis szövegen).
- Érintési cél mobilon ≥ 44px magas (gombok, mezők, chip-sorok).
- Minden ikon-gomb `aria-label`, minden lenyíló `aria-expanded`, minden állapotüzenet `role="status"` + `aria-live`.
- A hero film `aria-label`-lel; a nyitóoldal H1-e vizuálisan rejtett (`.sr-only`), de létezik.

## Tartalom

- Rövid, tényszerű, magyar. "Ha 30% törlésével jobb lesz, törölj."
- Számok és állítások csak, ha igazolhatók. Nincs generikus marketing-szöveg.
- Kanji csak ott, ahol jelentése van (改善, 問, 注, 所).
