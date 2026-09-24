import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseDocument, formatEffectiveDate} from './fogyasztobarat.js';

// Trimmed from a real api.php?aszf= response (2026-09-23).
const VENDOR_HTML = `<style>
        #gendoc_aszf h1 { font-size: 2.2rem; }
    </style><head><meta name="robots" content="noindex,nofollow"></head><h1 style="text-align: center;">ÁLTALÁNOS SZERZŐDÉSI FELTÉTELEK (ÁSZF)</h1>
<p style="text-align: center;"><span class="inserted_var">kaizentype.com</span> - hatályos ettől a naptól: <span class="inserted_var">2026-09-23</span></p>
<p>  <span class="inserted_var"><p><ul>
<li style="font-size: 1em;"><a href="#aszf12" class="toc_link">Preambulum </a></li>
</ul></p></span></p>
<h2 id="aszf12">Preambulum</h2>
<p>&Uuml;dv&ouml;z&ouml;lj&uuml;k honlapunkon!</p>
<script>var type = 'aszf'; jQuery("#gendoc_aszf .toc_link").each(function() {});</script>
<h1>Fogyasztói tájékoztató</h1>
<p>Elállási jog.</p>
<style>#embed-box div { color: #ebebeb !important; }</style>
<hr>    <script>
        var xhttp = new XMLHttpRequest();
        xhttp.send("page=html_aszf&embed=0&id=R7FDJBKH&html=aszf");
    </script>
`;

const ERROR_HTML = `<style>
        #gendoc_aszf { padding-left: 10px; }
    </style>Hibakód: 1002`;

test('rejects non-string and error bodies', () => {
  assert.equal(parseDocument(null), null);
  assert.equal(parseDocument(undefined), null);
  assert.equal(parseDocument(''), null);
  assert.equal(parseDocument(ERROR_HTML), null);
});

test('strips head, style and script blocks but keeps the content', () => {
  const doc = parseDocument(VENDOR_HTML);
  assert.ok(doc);
  assert.doesNotMatch(doc.html, /<(head|style|script)\b/i);
  assert.doesNotMatch(doc.html, /jQuery|XMLHttpRequest|noindex/);
  assert.match(doc.html, /<h2 id="aszf12">Preambulum<\/h2>/);
  assert.match(doc.html, /&Uuml;dv&ouml;z&ouml;lj&uuml;k/);
  assert.match(doc.html, /<a href="#aszf12" class="toc_link">/);
  assert.match(doc.html, /<hr>/);
});

test('lifts the leading title and effective date out of the body', () => {
  const doc = parseDocument(VENDOR_HTML);
  assert.equal(doc.effectiveDate, '2026-09-23');
  assert.doesNotMatch(doc.html, /ÁLTALÁNOS SZERZŐDÉSI FELTÉTELEK \(ÁSZF\)/);
  assert.doesNotMatch(doc.html, /hatályos ettől a naptól/);
  // The body must start with the table of contents, not with whitespace.
  assert.match(doc.html, /^<p>/);
  // Later top-level headings stay in the body.
  assert.match(doc.html, /<h1>Fogyasztói tájékoztató<\/h1>/);
});

test('keeps an unexpected layout intact instead of guessing', () => {
  const doc = parseDocument('<h2 id="x">Csak egy fejezet</h2><p>Szöveg</p>');
  assert.deepEqual(doc, {
    html: '<h2 id="x">Csak egy fejezet</h2><p>Szöveg</p>',
    effectiveDate: null,
  });
});

test('formats the effective date in Hungarian', () => {
  assert.equal(formatEffectiveDate('2026-09-23'), '2026. szeptember 23.');
  assert.equal(formatEffectiveDate(null), null);
  assert.equal(formatEffectiveDate('nem dátum'), null);
});
