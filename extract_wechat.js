const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://mp.weixin.qq.com/s/9qPD3gXj3HLmrKC64Q6fbQ', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait for content to load
  await page.waitForSelector('#js_content', { timeout: 10000 }).catch(() => {});

  // Extract title
  const title = await page.locator('#activity-name').textContent().catch(() => '');

  // Extract author
  const author = await page.locator('#js_name').textContent().catch(() => '');

  // Extract main content
  const content = await page.locator('#js_content').innerHTML().catch(() => '');

  // Extract all image URLs
  const images = await page.locator('#js_content img').evaluateAll(imgs =>
    imgs.map(img => ({
      src: img.src || img.getAttribute('data-src'),
      alt: img.alt || ''
    }))
  );

  // Extract text content
  const textContent = await page.locator('#js_content').textContent().catch(() => '');

  const result = {
    title: title.trim(),
    author: author.trim(),
    textContent: textContent.trim(),
    images: images.filter(img => img.src),
    rawHtml: content
  };

  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
