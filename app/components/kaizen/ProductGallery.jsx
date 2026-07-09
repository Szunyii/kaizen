import {useEffect, useMemo, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import {BrushRibbon} from '~/components/kaizen/Brand';

/**
 * KAIZENTYPE product gallery: a framed main image with the kanji watermark and
 * brush accent, plus a selectable thumbnail strip of every uploaded image.
 * The main image follows the selected variant, but any thumbnail can override it.
 * @param {{
 *   images?: Array<{id?: string, url: string, altText?: string|null, width?: number, height?: number}>;
 *   variantImage?: any;
 *   fallback?: any;
 *   title?: string;
 * }} props
 */
export function ProductGallery({images = [], variantImage, fallback, title}) {
  // De-duplicated list: variant image first, then the rest, then a fallback.
  const gallery = useMemo(() => {
    const list = [];
    const seen = new Set();
    const push = (img) => {
      const key = img?.id ?? img?.url;
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(img);
      }
    };
    push(variantImage);
    images.forEach(push);
    push(fallback);
    return list;
  }, [images, variantImage, fallback]);

  const [activeKey, setActiveKey] = useState(null);

  // Follow the selected variant's image whenever the variant changes.
  useEffect(() => {
    const key = variantImage?.id ?? variantImage?.url;
    if (key) setActiveKey(key);
  }, [variantImage?.id, variantImage?.url]);

  const keyOf = (img) => img?.id ?? img?.url;
  const active = gallery.find((img) => keyOf(img) === activeKey) ?? gallery[0];

  // Arrow keys step through the images while a thumbnail has focus.
  const onThumbKeyDown = (event) => {
    const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[
      event.key
    ];
    if (!step) return;
    event.preventDefault();
    const idx = gallery.findIndex((img) => keyOf(img) === keyOf(active));
    const next = (idx + step + gallery.length) % gallery.length;
    setActiveKey(keyOf(gallery[next]));
    const strip = event.currentTarget.closest('.pdp-thumbs');
    const thumbs = strip ? strip.querySelectorAll('button') : [];
    thumbs[next]?.focus();
  };

  return (
    <div className="pdp-gallery">
      <div className="pdp-frame">
        <span className="pdp-kanji" aria-hidden="true">
          改
        </span>
        {active ? (
          <Image
            className="pdp-main-img"
            alt={active.altText || title || 'Product image'}
            aspectRatio="1/1"
            data={active}
            key={keyOf(active)}
            sizes="(min-width: 900px) 52vw, 100vw"
          />
        ) : (
          <div className="product-image" />
        )}
        <div className="pdp-frame-brush" aria-hidden="true">
          <BrushRibbon opacity={0.7} />
        </div>
      </div>

      {gallery.length > 1 ? (
        <div className="pdp-thumbs" aria-label="Product images">
          {gallery.map((img) => {
            const key = keyOf(img);
            const isActive = keyOf(active) === key;
            return (
              <button
                type="button"
                key={key}
                className={`pdp-thumb${isActive ? ' is-active' : ''}`}
                aria-label="View image"
                aria-current={isActive}
                onClick={() => setActiveKey(key)}
                onKeyDown={onThumbKeyDown}
              >
                <Image
                  alt={img.altText || title || 'Product image'}
                  aspectRatio="1/1"
                  data={img}
                  sizes="100px"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
