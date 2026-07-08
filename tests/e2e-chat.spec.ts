import { test, expect } from '@playwright/test';

test.describe('Chat System E2E', () => {
  test('Customer can open chat, send message, and Admin can reply', async ({ browser }) => {
    // 1. Create a customer context (incognito)
    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();

    // Navigate to homepage
    await customerPage.goto('/');

    // Wait for the Chat widget floating button and click it
    // The chat widget has a button with aria-label "Open chat" or similar.
    // Let's find it by looking for the MessageSquare icon button.
    const openChatBtn = customerPage.locator('button.bg-primary.text-primary-foreground').filter({ has: customerPage.locator('svg.lucide-message-square') });
    await expect(openChatBtn).toBeVisible({ timeout: 10000 });
    await openChatBtn.click();

    // Verify chat window opens
    const chatInput = customerPage.getByPlaceholder('Type your message...');
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Type a message and set up receiver promise before sending to prevent a race condition
    const responsePromise = customerPage.waitForResponse(
      response => response.url().includes('/api/chat/chat-messages/') && response.status() === 201,
      { timeout: 15000 }
    );

    await chatInput.fill('Hello, I need help with an order!');
    await chatInput.press('Enter');

    // Wait for the response to complete
    await responsePromise;

    // Verify the message appears in the chat window
    await expect(customerPage.getByText('Hello, I need help with an order!')).toBeVisible({ timeout: 10000 });
    
    // Wait for the message list to update
    await customerPage.waitForTimeout(2000);

    // 2. Create an admin context
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    // Login as admin on the correct route
    await adminPage.goto('/signin');
    await adminPage.getByPlaceholder('you@email.com').fill('admin@gmail.com');
    await adminPage.getByPlaceholder('••••••••').fill('admin');
    await adminPage.locator('button.btn-primary:has-text("Sign In"), button:has-text("Sign In")').first().click();

    // Wait for redirect to admin dashboard
    await adminPage.waitForURL('**/admin**');

    // Go to admin chat page
    await adminPage.goto('/admin/messages');
    
    // Wait for the chat session list to load
    await expect(adminPage.locator('h1:has-text("Messages")')).toBeVisible({ timeout: 10000 });

    // The customer message should appear in the session list
    // Click on the most recent session (it should say "Guest" or contain our message)
    const sessionItem = adminPage.locator('button').filter({ hasText: 'Guest' }).first();
    await expect(sessionItem).toBeVisible({ timeout: 15000 });
    await sessionItem.click();

    // Reply as admin
    const adminChatInput = adminPage.getByPlaceholder('Type your message...');
    await adminChatInput.fill('Hello! I am a human staff member helping you.');
    await adminChatInput.press('Enter');

    // 3. Verify customer receives the message
    await expect(customerPage.getByText('Hello! I am a human staff member helping you.')).toBeVisible({ timeout: 10000 });

    await customerContext.close();
    await adminContext.close();
  });
});
