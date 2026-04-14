import { test, expect } from '@playwright/test';

// Base URLs
const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:5000';
let qrUrl;

// Reusable functions
async function simulateQRExtraction(page, qrUrl) {
  // Extract property and room IDs from QR URL
  const urlMatch = qrUrl.match(/\/property\/([^\/]+)\/room\/(\d+)/);
  if (!urlMatch) throw new Error('Invalid QR URL format');
  const propertyId = urlMatch[1];
  const roomId = urlMatch[2];
  await page.goto(`${BASE_URL}/property/${propertyId}/room/${roomId}`);
  await page.waitForLoadState('networkidle');
}

async function addItemToCart(page, itemName, quantity = 1) {
  const itemCard = page.locator(`[data-testid="menu-item"]:has-text("${itemName}")`);
  await expect(itemCard).toBeVisible();
  for (let i = 0; i < quantity; i++) {
    await itemCard.locator('[data-testid="add-to-cart"]').click();
  }
}

async function fillCheckoutForm(page, guestData) {
  await page.fill('input[name="guestName"]', guestData.name);
  await page.fill('input[name="guestEmail"]', guestData.email);
  await page.fill('input[name="specialRequests"]', guestData.requests || '');
}

async function simulateNetworkError(page) {
  await page.route('**/api/**', route => route.abort());
}

async function restoreNetwork(page) {
  await page.unroute('**/api/**');
}

// Test suites
test.describe.serial('E2E Tests', () => {
  test('Admin Login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="email"]', 'admin@hotel.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
  });

  test('Create Menu', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/menu`);
    // Create category
    await page.click('[data-testid="add-category-btn"]');
    await page.fill('input[name="categoryName"]', 'Test Category');
    await page.fill('input[name="categoryDescription"]', 'Test Description');
    await page.click('[data-testid="save-category"]');
    await expect(page.locator('text=Test Category')).toBeVisible();
    // Create item
    await page.click('[data-testid="add-item-btn"]');
    await page.fill('input[name="itemName"]', 'Test Item');
    await page.fill('input[name="itemDescription"]', 'Test Item Description');
    await page.fill('input[name="itemPrice"]', '10.99');
    await page.selectOption('select[name="category"]', 'Test Category');
    await page.click('[data-testid="save-item"]');
    await expect(page.locator('text=Test Item')).toBeVisible();
  });

  test('Edit Menu Item', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/menu`);
    await page.click('[data-testid="edit-item"]:has-text("Test Item")');
    await page.fill('input[name="itemName"]', 'Edited Test Item');
    await page.fill('input[name="itemPrice"]', '12.99');
    await page.click('[data-testid="save-item"]');
    await expect(page.locator('text=Edited Test Item')).toBeVisible();
  });

  test('Delete Menu Item', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/menu`);
    await page.click('[data-testid="delete-item"]:has-text("Edited Test Item")');
    await page.click('[data-testid="confirm-delete"]');
    await expect(page.locator('text=Edited Test Item')).not.toBeVisible();
  });

  test('Create Room', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/rooms`);
    await page.click('[data-testid="add-room-btn"]');
    await page.fill('input[name="roomNumber"]', '101');
    await page.fill('input[name="type"]', 'Deluxe');
    await page.fill('input[name="capacity"]', '2');
    await page.click('[data-testid="save-room"]');
    await expect(page.locator('text=101')).toBeVisible();
    // Generate QR
    await page.click('[data-testid="generate-qr"]:has-text("101")');
    qrUrl = await page.locator('[data-testid="qr-url"]').textContent();
    expect(qrUrl).toMatch(/\/property\/[^\/]+\/room\/101/);
  });

  test('QR Flow', async ({ page }) => {
    await simulateQRExtraction(page, qrUrl);
    await expect(page.locator('h1')).toContainText('Room Dining');
    await expect(page.locator('text=Room 101')).toBeVisible();
  });

  test('Client Order', async ({ page }) => {
    await simulateQRExtraction(page, qrUrl);
    await page.waitForLoadState('networkidle');
    await addItemToCart(page, 'Margherita Pizza');
    await page.locator('[data-testid="cart-sticky"]').click();
    await page.locator('[data-testid="checkout-btn"]').click();
    const guestData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      requests: 'Extra cheese'
    };
    await fillCheckoutForm(page, guestData);
    await page.locator('[data-testid="submit-order"]').click();
    await expect(page.locator('h1')).toContainText('Order Confirmed');
  });

  test('Order in Admin', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/orders`);
    await expect(page.locator('[data-testid="order-item"]:has-text("John Doe")')).toBeVisible();
  });

  test('Update Status', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/orders`);
    await page.click('[data-testid="order-item"]:has-text("John Doe")');
    await page.selectOption('select[name="status"]', 'preparing');
    await page.click('[data-testid="update-status"]');
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('preparing');
  });

  test('Cart Persistence', async ({ page }) => {
    await simulateQRExtraction(page, qrUrl);
    await page.waitForLoadState('networkidle');
    await addItemToCart(page, 'Margherita Pizza');
    const cartCountBefore = await page.locator('[data-testid="cart-count"]').textContent();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const cartCountAfter = await page.locator('[data-testid="cart-count"]').textContent();
    expect(cartCountAfter).toBe(cartCountBefore);
  });

  test('Edge Cases', async ({ page }) => {
    // Network Error
    await simulateQRExtraction(page, qrUrl);
    await simulateNetworkError(page);
    await page.reload();
    await expect(page.locator('text=Failed to load menu')).toBeVisible();
    await restoreNetwork(page);
    await page.locator('text=Retry').click();
    await expect(page.locator('[data-testid="menu-item"]')).toBeVisible();

    // Empty Cart Checkout
    await page.goto(`${BASE_URL}/property/sample-prop/room/101/checkout`);
    await expect(page.locator('[data-testid="submit-order"]')).toBeDisabled();

    // Invalid Email
    await simulateQRExtraction(page, qrUrl);
    await addItemToCart(page, 'Margherita Pizza');
    await page.locator('[data-testid="cart-sticky"]').click();
    await page.locator('[data-testid="checkout-btn"]').click();
    await page.fill('input[name="guestName"]', 'Test User');
    await page.fill('input[name="guestEmail"]', 'invalid-email');
    await page.locator('[data-testid="submit-order"]').click();
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });
});

// Instructions to run the tests:
// 1. Install Playwright dependencies: npm install --save-dev @playwright/test
// 2. Install Playwright browsers: npx playwright install
// 3. Run the e2e tests: npx playwright test tests/e2e.spec.js</content>
<parameter name="filePath">C:\Users\marko\OneDrive\Desktop\Projects-for-portfolio-versions\multi-tenant hospitality\tests\e2e.spec.js