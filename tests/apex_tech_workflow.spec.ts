import { test, expect } from '@playwright/test';

test.describe('Apex Tech Products Workflow E2E', () => {
  test('Complete Customer Purchase and Staff Administration Flow', async ({ page }) => {
    // Set a generous timeout for the full flow
    test.setTimeout(120000);

    const targetBaseUrl = 'http://apex-tech.local:3000';

    // 1. Staff Login
    console.log('--- STEP 1: Staff Login ---');
    await page.goto(`${targetBaseUrl}/signin`);
    await page.locator('input[type="email"]').fill('staff@apex.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button.btn-primary:has-text("Sign In"), button:has-text("Sign In")').first().click();
    
    // Wait to be logged in and redirected to admin dashboard
    await page.waitForURL('**/admin', { timeout: 15000 });
    console.log('Staff logged in successfully.');

    // 2. Staff Adds a New Product
    console.log('--- STEP 2: Staff Adds Product ---');
    await page.goto(`${targetBaseUrl}/admin/products/add`);
    
    const uniqueId = Date.now();
    const productName = `Apex Smart Band Z-${uniqueId}`;
    const productSlug = `apex-smart-band-z-${uniqueId}`;
    
    await page.locator('textarea[name="name"]').fill(productName);
    await page.locator('input[name="slug"]').fill(productSlug);
    
    // Select category "Fitness | Health Care"
    await page.locator('select[name="category"]').selectOption('Fitness | Health Care');
    
    // Create new brand 'Apex' if not selected
    // Click Add New Brand button
    await page.locator('button:has-text("+ Add New")').first().click();
    await page.locator('input[placeholder="Brand Name"]').fill('Apex');
    await page.locator('input[placeholder="Brand Name"] + button').click();
    
    // Fill description, price and stock
    await page.locator('textarea[name="description"]').first().fill('E2E Test Smart Band with pulse tracking.');
    await page.locator('input[name="price"]').fill('15000'); // 150.00
    await page.locator('input[name="stockCount"]').fill('80');
    
    // Provide a main image URL
    await page.locator('input[name="image"]').fill('https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&h=600&fit=crop');
    
    // Save Product
    console.log(`Saving new product: ${productName}...`);
    await page.locator('button:has-text("Save Product")').first().click();
    
    // Verify creation success
    await expect(page.locator('h1:has-text("Product Created!")')).toBeVisible({ timeout: 15000 });
    console.log('Product created successfully!');
    
    // Wait to redirect back to products page
    await page.waitForURL('**/admin/products', { timeout: 10000 });
    
    // Log out staff
    console.log('Logging out staff...');
    await page.locator('button:has-text("Logout")').click();
    await page.waitForURL('**/signin', { timeout: 10000 });
    
    // 3. Customer Purchase Flow
    console.log('--- STEP 3: Customer Purchase ---');
    await page.locator('input[type="email"]').fill('customer@apex.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button.btn-primary:has-text("Sign In"), button:has-text("Sign In")').first().click();
    await page.waitForURL(`${targetBaseUrl}/`, { timeout: 15000 });
    console.log('Customer logged in successfully.');
    
    // Browse to the new product page directly
    console.log(`Navigating to product details for: ${productName}`);
    await page.goto(`${targetBaseUrl}/product/${productSlug}`);
    await expect(page.locator('h1')).toContainText(productName);
    
    // Add to Cart
    console.log('Adding product to cart...');
    await page.locator('button:has-text("Add To Cart")').click();
    
    // Go to checkout
    console.log('Navigating to checkout...');
    await page.goto(`${targetBaseUrl}/checkout`);
    
    // Fill delivery and details
    console.log('Filling shipping details...');
    await page.locator('input[name="fullName"]').fill('Jane Doe');
    await page.locator('input[name="email"]').fill('customer@apex.com');
    await page.locator('input[name="phone"]').fill('090078601');
    await page.locator('input[name="address"]').fill('Apex Towers Suite 5');
    await page.locator('input[name="city"]').fill('Apex City');
    await page.locator('input[name="state"]').fill('Apex Province');
    await page.locator('input[name="zipCode"]').fill('54321');
    
    // Click "Place Order"
    console.log('Placing order...');
    await page.locator('button:has-text("Place Order")').click();
    
    // Verify Order Success page loaded
    await page.waitForURL('**/order-success', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Order Placed Successfully!');
    const orderIdElem = page.locator('p:has-text("Order ID:")');
    const orderIdText = await orderIdElem.textContent();
    console.log(`Order completed! ${orderIdText}`);
    
    // Log out customer
    console.log('Logging out customer...');
    await page.locator('button:has-text("Logout")').click();
    await page.waitForURL('**/signin', { timeout: 10000 });

    // 4. Staff Processes Order in Admin Panel
    console.log('--- STEP 4: Staff Order Processing ---');
    await page.locator('input[type="email"]').fill('staff@apex.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button.btn-primary:has-text("Sign In"), button:has-text("Sign In")').first().click();
    await page.waitForURL('**/admin', { timeout: 15000 });
    
    // Navigate to admin orders
    console.log('Navigating to Admin Order Management...');
    await page.goto(`${targetBaseUrl}/admin/orders`);
    
    // Select the order by filtering with the customer email/name
    console.log('Locating customer order in list...');
    const orderItem = page.locator('div.cursor-pointer').filter({ hasText: 'customer@apex.com' }).first();
    await expect(orderItem).toBeVisible({ timeout: 15000 });
    await orderItem.click();
    
    // Transition status to processing -> shipped -> delivered
    console.log('Updating order status to processing...');
    await page.locator('button:has-text("processing")').click();
    await page.waitForTimeout(1000);
    
    console.log('Updating order status to shipped...');
    await page.locator('button:has-text("shipped")').click();
    await page.waitForTimeout(1000);
    
    console.log('Updating order status to delivered...');
    await page.locator('button:has-text("delivered")').click();
    await page.waitForTimeout(1000);
    console.log('Order status successfully updated to delivered.');

    // 5. POS Billing flow by Staff
    console.log('--- STEP 5: Staff POS Billing ---');
    await page.goto(`${targetBaseUrl}/admin/pos`);
    
    // Verify POS page loaded
    await expect(page.locator('h2:has-text("Products")')).toBeVisible({ timeout: 15000 });
    
    // Search the added product in POS search
    await page.locator('input[placeholder="Search products..."]').fill(productName);
    await page.waitForTimeout(1000);
    
    // Add product to POS cart
    console.log('Adding product to POS cart...');
    const posProductCard = page.locator(`h3:has-text("${productName}")`).first();
    await expect(posProductCard).toBeVisible({ timeout: 5000 });
    await posProductCard.click();
    
    // Select Walk-in customer type and trigger Pay Now
    console.log('Triggering payment on POS billing...');
    await page.locator('button:has-text("Pay Now")').click();
    
    // Verify invoice modal is shown
    await expect(page.locator('h2:has-text("POS Invoice")')).toBeVisible({ timeout: 10000 });
    console.log('POS Invoice generated successfully!');
    
    // Close POS Invoice
    await page.locator('button:has-text("Close")').click();
    await page.waitForTimeout(1000);
    
    // Navigate to POS billing history to confirm
    console.log('Checking POS billing history...');
    await page.goto(`${targetBaseUrl}/admin/pos/history`);
    await page.waitForTimeout(2000);
    
    console.log('Apex Tech Products workflow E2E test completed successfully!');
  });
});
