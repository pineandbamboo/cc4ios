import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('https://mp.weixin.qq.com/s/9qPD3gXj3HLmrKC64Q6fbQ', {
  waitUntil: 'networkidle',
  timeout: 30000
});

await page.waitForTimeout(3000);

// Extract title
const title = await page.locator('#activity-name').textContent().catch(() => '');
const author = await page.locator('#js_name').textContent().catch(() => '');

// Extract text content
const textContent = await page.locator('#js_content').textContent().catch(() => '');

// Extract images
const images = await page.locator('#js_content img').evaluateAll(imgs =>
  imgs.map(img => ({
    src: img.src || img.getAttribute('data-src'),
    alt: img.alt || ''
  })).filter(img => img.src)
);

console.log('=== TITLE ===');
console.log(title.trim());
console.log('\n=== AUTHOR ===');
console.log(author.trim());
console.log('\n=== IMAGES ===');
images.forEach((img, i) => {
  console.log(`Image ${i+1}: ${img.src}`);
});
console.log('\n=== CONTENT ===');
console.log(textContent.trim());

await browser.close();
