import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

await page.goto('https://mp.weixin.qq.com/s/9qPD3gXj3HLmrKC64Q6fbQ', {
  waitUntil: 'networkidle',
  timeout: 30000
});

await page.waitForTimeout(5000);

// Get all images with data-src or src in the content area
const imageData = await page.evaluate(() => {
  const images = [];
  const content = document.querySelector('#js_content');
  if (!content) return images;
  
  const imgs = content.querySelectorAll('img');
  imgs.forEach((img, i) => {
    const src = img.getAttribute('data-src') || img.src;
    if (src && !src.startsWith('data:')) {
      images.push({
        index: i,
        src: src,
        alt: img.alt || '',
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      });
    }
  });
  return images;
});

console.log('=== IMAGES FOUND ===');
console.log(JSON.stringify(imageData, null, 2));

// Download each image
for (const img of imageData) {
  if (img.src && !img.src.startsWith('data:')) {
    try {
      const viewPage = await browser.newPage();
      const imgPath = `/Users/yuxiang/claudecode/cc4ios/article_img_${img.index}.png`;
      await viewPage.goto(img.src, { timeout: 30000 });
      await viewPage.screenshot({ path: imgPath, fullPage: true });
      console.log(`Saved: ${imgPath}`);
      await viewPage.close();
    } catch (e) {
      console.log(`Failed to download image ${img.index}: ${e.message}`);
    }
  }
}

await browser.close();
