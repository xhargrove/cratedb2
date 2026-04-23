import { expect, test } from '@playwright/test';

function uniqueToken(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test.describe.serial('core browser flows', () => {
  const password = 'P@ssword123!';
  const email = `${uniqueToken('e2e')}@example.com`;
  const displayName = uniqueToken('Collector');
  const recordArtist = uniqueToken('Artist');
  const recordTitle = uniqueToken('Album');
  const singleArtist = uniqueToken('SingleArtist');
  const singleTitle = uniqueToken('SingleTitle');
  const wantlistArtist = uniqueToken('WantlistArtist');
  const wantlistTitle = uniqueToken('WantlistTitle');

  test('dashboard auth gate redirects anonymous users', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('signup, login, logout, create core entities, and load public pages', async ({
    page,
  }) => {
    await page.goto('/signup');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Display name').fill(displayName);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto('/dashboard/records/new');
    await page.getByLabel('Artist').fill(recordArtist);
    await page.getByLabel('Album title').fill(recordTitle);
    await page.getByRole('button', { name: 'Create record' }).click();
    await expect(page).toHaveURL(/\/dashboard\/records\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      recordArtist
    );

    await page.goto('/dashboard/singles/new');
    await page.getByLabel('Artist').fill(singleArtist);
    await page.getByLabel('A-side (main song)').fill(singleTitle);
    await page.getByRole('button', { name: 'Save single' }).click();
    await expect(page).toHaveURL(/\/dashboard\/singles\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      singleArtist
    );

    await page.goto('/dashboard/wantlist/new');
    await page.getByLabel('Artist').fill(wantlistArtist);
    await page.getByLabel('Album title').fill(wantlistTitle);
    await page.getByRole('button', { name: 'Add to wantlist' }).click();
    await expect(page).toHaveURL(/\/dashboard\/wantlist$/);
    const row = page.getByRole('row').filter({ hasText: wantlistArtist });
    await expect(row).toContainText(wantlistTitle);
    await row.getByRole('button', { name: 'Remove' }).click();
    await expect(row).toHaveCount(0);

    await page.goto('/dashboard/stats');
    await expect(page).toHaveURL(/\/dashboard\/stats$/);
    await expect(
      page.getByRole('heading', { name: 'Insights', level: 1 })
    ).toBeVisible();

    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Public profile' }).click();
    await expect(page).toHaveURL(/\/u\/.+/);
    await expect(
      page.getByRole('heading', { name: displayName, level: 1 })
    ).toBeVisible();
  });
});

