# TODOS

Design-adósság a 2026-09-09-i design review-ból (`docs/superpowers/specs/2026-09-09-design-review.md`). Ezeket a tételeket a review során tudatosan elhalasztottuk; itt az indoklás, hogy 3 hónap múlva is érthető legyen.

## Design

### 1.3 `/collections/all` a brandelt kollekció-sablonra
- **What:** A `collections.all.jsx` a `collections.$handle` `col-*` fejlécét, gridjét és `formatMoney`-t használja.
- **Why:** A footer "Összes termék" linkje ma a Hydrogen skeleton oldalra visz ("Products", `HUF 9,900`), és hydration-hiba is van a `<Money>` miatt.
- **Pros:** Egy brandelt lista, egy árformátum. **Cons:** A szűrő/rendezés logikát meg kell osztani a két route között.
- **Context:** Amíg 3 termék van, a homepage showcase kiváltja; a link viszont él a footerben.
- **Depends on:** –

### 2.3 Hero videó tömörítés és dedikált poster
- **What:** 720p H.264 ≤ 6 MB, `hero-poster.jpg` a filmből, mobilon `preload="none"`.
- **Why:** 25 MB HEVC + 20 MB H.264; mobilneten másodpercekig fekete a hero, a poster csak akkor van, ha a frontpage kollekciónak van képe.
- **Pros:** Gyors első kép mobilon. **Cons:** Új export a nyersanyagból, minőségveszteség.
- **Context:** A csak-videó hero döntés mellett ez a legnagyobb teljesítmény-tétel. `avconvert` elérhető macOS-en (ffmpeg nincs).
- **Depends on:** nyers videó forrás

### 3.2 Stat sáv: igazolható számok vagy tényszalag
- **What:** A "100+ eladott · 4,9 (80 vélemény) · 870 tag · 92% visszatérő" helyett valós adat vagy "Budapesten készül · 14 nap csere · 1–3 nap szállítás".
- **Why:** A számok egymásnak ellentmondanak (870 tag vásárláshoz kötött hozzáféréssel, 100+ eladott darab mellett).
- **Pros:** Hitelesség. **Cons:** Kevesebb "nagy szám".
- **Context:** Statikus szöveg az `_index.jsx` `STATS` tömbjében.
- **Depends on:** valós adatok

### 3.3 Vélemények: fotó helyett pecsét/monogram, forrás jelölése
- **What:** A `Community` ne forgassa a termékfotókat a nevek mellé; kanji-pecsét vagy monogram, "Ellenőrzött vásárlás" jelölés.
- **Why:** "Eszter, 26" mellett férfi modell fotója jelenik meg.
- **Pros:** Bizalom, rövidebb mobil scroll. **Cons:** Vizuálisan szegényebb, amíg nincs valós vásárlói fotó.
- **Context:** Részben átfed a T12 (ritmus törés) taskkal, amely a vélemény-szekciót egy nagy idézetre alakítja.
- **Depends on:** T12

### 3.4 PDP bizalmi sáv és mérettáblázat
- **What:** A CTA alá "1–3 nap szállítás · 14 nap csere · Kaizen Family hozzáférés" sor, és "Mérettáblázat" lenyíló (metafield vagy statikus).
- **Why:** A FAQ "cm-es táblázatra" hivatkozik, ami nem létezik; a szállítás/csere info nincs a döntés helyén.
- **Pros:** Konverzió, teljesített ígéret. **Cons:** A táblázat adatai (mellbőség, hossz méretenként) kellenek.
- **Depends on:** méretadatok

### 3.5b Footer Blog oszlop csak cikk esetén
- **What:** A `KaizenFooter` Blog oszlopa csak akkor rendereljen, ha `articles.length > 0`.
- **Why:** Ma egyetlen "Összes bejegyzés" link mutat egy üres blogra.
- **Pros:** Nem mutat üres blogot. **Cons:** A footer 5→4 oszlopra vált, a grid arányai változnak.

### 4.2 Egy mozgás-pillanat, dupla piros él
- **What:** Reveal csak a hero-n (piros vonal), a szekciók látható alapértelmezéssel; a hero alsó piros vonala vagy a wave egyike marad.
- **Why:** Minden szekció ugyanazzal a reveal-lel érkezik; a hero alján a piros vonal és közvetlenül alatta a piros wave dupla élt ad.
- **Pros:** Egy szerzői mozgás, screenshot/SEO-barát. **Cons:** Kevesebb "élő" érzés.

### 4.3 Family telefon-mockup
- **What:** Valódi app-képernyőkép a `fam-phone`-ban, vagy a telefon elhagyása.
- **Why:** A mock képernyő alsó fele üres, a gyűrű 72%-ot mutat "1%" felirattal; tartalom-helyettesítő.
- **Depends on:** app képernyőkép

### 4.4 Kicker-minta ritkítása, ✓ helyett pecsét
- **What:** Kanji-kicker csak 3 szekción (filozófia, Family, FAQ), a többi sima kicker; a ✓ helyett kis 改 pecsét vagy sorszám.
- **Why:** Hatszor ugyanaz a fejléc-minta, pipák mint felsorolásjel.

### 5.2 Skeleton-maradékok: main margin gyökérok, ProductItem formatMoney, app.css audit
- **What:** `body>main{margin:0}` felülírás a `kaizen.css`-ben, a `.fam`/`.hero-full` kompenzációk kivétele, `ProductItem` → `formatMoney`, `app.css` használat-audit, `Header.jsx`/`Footer.jsx` sablonfájlok törlése.
- **Why:** A `reset.css` 1rem-es `body>main` margója okozta a hero csíkot és a `.fam` kompenzációt; a `<Money>` `HUF 9,900`-at ad a `9 900 Ft` helyett.
- **Pros:** Egy layout-rendszer, nincs újra előjövő 16px-es elcsúszás. **Cons:** Minden route-ot át kell nézni a margin-váltás után.
- **Context:** A T2 lokális fix (`main:has(.home)`) csak a homepage-et kezeli.

### 6.4 Mobil hero crop
- **What:** `object-position` hangolás, vagy portré (9:16) export `<source media="(orientation:portrait)">`-tal.
- **Why:** A 16:9 film portré crop-ban "AIZENTYP"-et mutat, a beégetett felirat levág.
- **Depends on:** 2.3 (ha portré export)

### 6.6 Kis piros szövegek kontrasztja
- **What:** `.kicker`, `.show-kicker`, `.pdp-crumb`, `.hd-count` → `--red-bright` vagy 14px.
- **Why:** `#DA291C` az ink-en 4.15:1 12.5px-en, AA nem teljesül.

### 6.7 44px érintési célok mobilon
- **What:** `.hd-ic`, `.chip`, `.product-options-item`, `.cart-step` `min-height:44px` mobilon.
- **Why:** Ma 40px (stepper 30px).

### 6.8 Drawer landmark-ok
- **What:** Az `Aside` belső `<header>`/`<main>` → `div`, hogy egy header és egy main landmark maradjon.
- **Why:** 4 `header` és 4 `main` landmark van az oldalon a három drawer miatt.
- **Cons:** A sablon Aside CSS-e a header/main szelektorokra épül.
