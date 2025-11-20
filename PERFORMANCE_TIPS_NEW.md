# Performance Optimization Guide (Extended Additions)

This supplemental document adds recently implemented optimizations and advanced image compression guidance.

## Newly Implemented

### Detail Modal Lazy Loading & Skeleton
- Uses `data-src` + deferred `src` assignment via `requestAnimationFrame` for non-blocking paint.
- Shimmer skeleton (`.shimmer` class) while image decodes; removed on `load` event.
- Listing card image height reduced (180px -> 150px) minimizing layout & paint costs.
- Cached listings array prevents redundant fetch when opening detail modal repeatedly.

### Parallel Network Fetching
- Stats fetch no longer awaited during user state render; runs in parallel with user info and listings.

## Advanced Image Compression & WebP

```javascript
function compressToBestFormat(img, maxDim = 1200, quality = 0.85){
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let { width, height } = img;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  width = Math.round(width * scale); height = Math.round(height * scale);
  canvas.width = width; canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  let webp;
  try { webp = canvas.toDataURL('image/webp', quality); } catch(e) {}
  if(webp && webp.startsWith('data:image/webp')) return webp; // Prefer WebP when supported
  return canvas.toDataURL('image/jpeg', quality); // Fallback
}
```

Recommendations:
- Attempt WebP first (25–35% smaller vs JPEG for similar perceptual quality).
- Limit max dimension to reduce pixel processing cost.
- For thumbnails: use maxDim 400.
- Store pre-compressed Base64 or switch to Blob upload for lower memory footprint.
- Consider server-side verification/transcoding for uniform quality and security (strip metadata).

## Potential Next Steps
- Add `img.decoding = 'async'` and `fetchPriority="low"` for non-critical images.
- Implement virtual scrolling for >100 listings (render window + buffer only).
- Service Worker caching: separate image cache with stale-while-revalidate strategy.
- Use Content-Security-Policy and Subresource Integrity for improved security of static assets.

---
This file supplements existing `PERFORMANCE_TIPS.md` without modifying its original content.
