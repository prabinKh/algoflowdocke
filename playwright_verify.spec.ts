import { test, expect } from '@playwright/test';

test('Verify Add Product Sync Flow', async ({ page }) => {
  // 1. Login first
  console.log('Navigating to signin page...');
  await page.goto('http://localhost:3000/signin');
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'admin@gmail.com');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button:has-text("Sign In")');

  // Wait to be on a page after login (like the corporate page, admin, or index)
  await page.waitForTimeout(3000);

  // 2. Navigate to Add Product page
  console.log('Navigating to Add Product page...');
  await page.goto('http://localhost:3000/admin/products/add');

  // Wait for name field to be loaded
  await page.waitForSelector('textarea[name="name"]');

  // 3. Fill form
  console.log('Filling form...');
  await page.fill('textarea[name="name"]', 'Playwright Sync Test');
  await page.fill('input[name="slug"]', 'playwright-sync-' + Date.now());
  
  // Set Price
  await page.fill('input[name="price"]', '2499.00');
  
  // Choose category if exists
  const categorySelect = await page.locator('select[name="category"]');
  if (await categorySelect.isVisible()) {
    await categorySelect.selectOption({ index: 1 });
  }

  // Create / set Brand
  await page.locator('button:has-text("+ Add New")').first().click();
  await page.locator('input[placeholder="Brand Name"]').fill('Sony');
  await page.locator('input[placeholder="Brand Name"] + button').click();

  // Intercept Network Request
  console.log('Setting up network interception...');
  const responsePromise = page.waitForResponse(response => 
    response.url().includes('/api/admin/products/') && response.request().method() === 'POST'
  );

  // 4. Submit
  console.log('Clicking Save Product...');
  await page.locator('button:has-text("Save Product")').first().click();

  // 5. Verify Response
  const response = await responsePromise;
  const status = response.status();
  const body = await response.json();
  
  console.log(`Backend Response Status: ${status}`);
  console.log('Backend Response Body:', JSON.stringify(body, null, 2));

  expect(status).toBe(201);
  console.log('✅ SUCCESS: Product created and sync verified!');
});

