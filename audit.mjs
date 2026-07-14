import { chromium, devices } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 14 Pro'],
    colorScheme: 'light',
  });
  const page = await context.newPage();

  console.log('Navigating to homepage...');
  await page.goto('https://investoffplan.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // Let images and fonts settle
  await page.screenshot({ path: '/Users/admin/.gemini/antigravity-ide/brain/708b6915-ffb4-4140-8ec2-8870cb2a99aa/scratch/home_top.png' });
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/admin/.gemini/antigravity-ide/brain/708b6915-ffb4-4140-8ec2-8870cb2a99aa/scratch/home_scrolled.png' });

  console.log('Navigating to projects SERP...');
  await page.goto('https://investoffplan.com/projects', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/Users/admin/.gemini/antigravity-ide/brain/708b6915-ffb4-4140-8ec2-8870cb2a99aa/scratch/projects_top.png' });
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/admin/.gemini/antigravity-ide/brain/708b6915-ffb4-4140-8ec2-8870cb2a99aa/scratch/projects_scrolled.png' });

  console.log('Navigating to PDP...');
  // Find the first project link
  const projectLink = await page.locator('a[href^="/projects/"]').first().getAttribute('href');
  await page.goto('https://investoffplan.com' + projectLink, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/Users/admin/.gemini/antigravity-ide/brain/708b6915-ffb4-4140-8ec2-8870cb2a99aa/scratch/pdp_top.png' });
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/admin/.gemini/antigravity-ide/brain/708b6915-ffb4-4140-8ec2-8870cb2a99aa/scratch/pdp_scrolled.png' });
  
  // Try opening bottom tab bar search
  console.log('Testing bottom tab bar...');
  // The search icon is typically a button with aria-label="Search" or similar.
  // We'll just take a screenshot of the bottom tab bar
  const bottomBar = page.locator('nav.fixed.bottom-0');
  if (await bottomBar.isVisible()) {
    console.log('Bottom tab bar is visible');
  } else {
    console.log('Bottom tab bar is hidden');
  }

  await browser.close();
  console.log('Done!');
})();
