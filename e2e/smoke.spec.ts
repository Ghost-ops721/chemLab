import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Chem Lab smoke", () => {
  test("home loads desk chrome", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Equipment" })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByRole("button", { name: "Desk" })).toBeVisible();
    await expect(page.getByText("Chem Lab").first()).toBeVisible();
  });

  test("place beaker and open chemicals", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Equipment" })).toBeVisible({
      timeout: 45_000,
    });

    await page.getByRole("button", { name: "+", exact: true }).first().click();
    await page.getByRole("button", { name: "Chemicals", exact: true }).click();
    await expect(
      page.getByText(/Drag onto desk|Inventory/i).first(),
    ).toBeVisible();
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Log in$/i })).toBeVisible();
  });

  test("signup page renders", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /sign up/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create account|sign up/i }),
    ).toBeVisible();
  });
});
