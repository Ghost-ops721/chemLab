/**
 * QA: logged-in beaker→beaker drag-on-top pour (desktop + mobile).
 * Usage: node scripts/qa-pour-drag.mjs
 */
import { chromium, devices } from "playwright";
import { writeFileSync, mkdirSync, readFileSync } from "fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
let EMAIL = process.env.QA_EMAIL || "";
if (!EMAIL) {
  try {
    EMAIL = readFileSync("/tmp/qa-pour-email.txt", "utf8").trim();
  } catch {
    EMAIL = "qa-pour-1784870299@alyra-test.local";
  }
}
const PASS = process.env.QA_PASS || "QaPour!24x";
const OUT = "/tmp/qa-pour-browse";

mkdirSync(OUT, { recursive: true });

async function isLoggedIn(page) {
  // Desktop shows Log out; phone may tuck it behind ☰
  if (
    await page
      .getByRole("button", { name: "Log out" })
      .isVisible()
      .catch(() => false)
  ) {
    return true;
  }
  const menu = page.getByRole("button", { name: /menu|☰/i }).or(
    page.locator("button").filter({ hasText: "☰" }),
  );
  if (await menu.first().isVisible().catch(() => false)) {
    await menu.first().click().catch(() => {});
    await page.waitForTimeout(200);
    if (
      await page
        .getByRole("button", { name: "Log out" })
        .isVisible()
        .catch(() => false)
    ) {
      return true;
    }
  }
  // Auth store / profile name in chrome
  return page.evaluate(() => {
    const t = document.body.innerText;
    return /Log out/.test(t) || /QA Pour/.test(t);
  });
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  if (await isLoggedIn(page)) {
    await page.goto(`${BASE}/lab`, { waitUntil: "domcontentloaded" });
    return;
  }
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/^password$/i).fill(PASS);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL(/\/(lab|profile)/, { timeout: 20000 }).catch(() => {});
  if (page.url().includes("onboarding") || page.url().includes("profile")) {
    const save = page.getByRole("button", { name: /Save & enter lab/i });
    if (await save.isVisible().catch(() => false)) {
      await page.locator("select").selectOption({ index: 1 }).catch(() => {});
      const dob = page.locator('input[type="date"]');
      if (await dob.count()) await dob.fill("1995-06-15");
      await save.click();
    }
  }
  await page.goto(`${BASE}/lab`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const ok = await isLoggedIn(page);
  if (!ok) {
    throw new Error("Login failed — Log out / QA Pour not found on lab");
  }
}

function vesselLocator(page) {
  return page.getByRole("button", { name: /Drag onto another to pour/i });
}

async function collectFx(page) {
  return page.evaluate(() => {
    const q = (s) => document.querySelectorAll(s).length;
    const vessels = [...document.querySelectorAll('[role="button"]')].filter((b) =>
      /Drag onto another to pour/i.test(b.textContent || ""),
    );
    return {
      vesselCount: vessels.length,
      vesselText: vessels.map((v) =>
        (v.textContent || "").replace(/\s+/g, " ").trim().slice(0, 140),
      ),
      pourRibbon: q(".lab-pour-ribbon"),
      pourSource: q(".lab-vessel-pour-source"),
      overflow: q(".lab-overflow, .lab-overflow-drip"),
      foam: q(".lab-foam-head"),
      canvas: q("canvas"),
      bodyPouring: /Pouring/i.test(document.body.innerText),
      bodyOverflow: /Overflowing/i.test(document.body.innerText),
      loggedIn: /Log out/.test(document.body.innerText),
    };
  });
}

async function dismissOverlays(page) {
  // Close hamburger / menus that steal clicks on phone
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(100);
  // Tap desk backdrop if a sheet title is visible without beakers yet
  const compose = page.getByText("Compose a signature");
  if (await compose.isVisible().catch(() => false)) {
    /* empty desk — fine */
  }
}

async function openInventorySheet(page, tab) {
  // Phone FAB "+" = Open equipment (Eq opens tutor — do not use)
  const openEq = page.getByRole("button", { name: "Open equipment" });
  const openNotes = page.getByRole("button", { name: "Open notes and oils" });
  if (tab === "oils" && (await openNotes.isVisible().catch(() => false))) {
    await openNotes.click();
  } else if (await openEq.isVisible().catch(() => false)) {
    await openEq.click();
  } else {
    // Desktop sidebar already visible
    const side = page.getByRole("button", { name: tab, exact: true });
    if (await side.isVisible().catch(() => false)) await side.click();
    return;
  }
  await page.waitForTimeout(350);
  const tabBtn = page.getByRole("button", { name: tab, exact: true });
  if (await tabBtn.isVisible().catch(() => false)) {
    await tabBtn.click();
    await page.waitForTimeout(200);
  }
}

async function closeInventorySheet(page) {
  const done = page.getByRole("button", { name: "Done", exact: true });
  if (await done.isVisible().catch(() => false)) {
    await done.click();
    await page.waitForTimeout(200);
    return;
  }
  const close = page.getByRole("button", { name: "Close inventory" });
  if (await close.isVisible().catch(() => false)) {
    await close.click();
    await page.waitForTimeout(200);
  }
}

async function placeTwoBeakers(page) {
  await dismissOverlays(page);

  const clear = page.getByRole("button", { name: "Clear board" });
  if (await clear.isVisible().catch(() => false)) {
    await clear.click();
    const confirm = page.getByRole("button", { name: "Confirm clear?" });
    if (await confirm.isVisible({ timeout: 800 }).catch(() => false)) {
      await confirm.click();
    }
    await page.waitForTimeout(250);
  }

  // Desktop: left Inventory aside (hidden on phone)
  const aside = page.locator("aside").filter({ hasText: "Inventory" });
  if (await aside.isVisible().catch(() => false)) {
    await aside.getByRole("button", { name: "Equipment", exact: true }).click();
    await page.waitForTimeout(150);
    const plus = aside.getByRole("button", { name: "+", exact: true }).first();
    await plus.click();
    await page.waitForTimeout(200);
    await plus.click();
    await page.waitForTimeout(300);
    return vesselLocator(page).count();
  }

  // Phone: FAB "Open equipment" → sheet → tap Beaker twice
  const openEq = page.getByRole("button", { name: "Open equipment" });
  await openEq.waitFor({ state: "visible", timeout: 8000 });
  await openEq.click();
  await page.waitForTimeout(400);
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 8000 });
  const equipTab = dialog.getByRole("button", { name: "Equipment", exact: true });
  if (await equipTab.isVisible().catch(() => false)) {
    await equipTab.click();
    await page.waitForTimeout(150);
  }
  const beaker = dialog
    .locator("button")
    .filter({ hasText: "Beaker" })
    .filter({ hasNotText: "+ Beaker" })
    .first();
  await beaker.click();
  await page.waitForTimeout(250);
  await beaker.click();
  await page.waitForTimeout(250);
  await closeInventorySheet(page);

  // Prefer chrome "+ Beaker" for a second if only one landed
  let n = await vesselLocator(page).count();
  if (n < 2) {
    const plusBeaker = page.getByRole("button", { name: "+ Beaker", exact: true });
    if (await plusBeaker.isVisible().catch(() => false)) {
      await plusBeaker.click();
      await page.waitForTimeout(200);
      n = await vesselLocator(page).count();
    }
  }
  return n;
}

async function addWater(page) {
  await dismissOverlays(page);
  const aside = page.locator("aside").filter({ hasText: "Inventory" });
  if (await aside.isVisible().catch(() => false)) {
    await aside.getByRole("button", { name: "Chemicals", exact: true }).click();
    await page.waitForTimeout(200);
    const search = aside.getByPlaceholder(/Search/i);
    if (await search.isVisible().catch(() => false)) {
      await search.fill("water");
      await page.waitForTimeout(400);
    }
    await aside.getByRole("button", { name: "+", exact: true }).first().click();
    await page.waitForTimeout(500);
    return;
  }

  // Phone sheet
  await page.getByRole("button", { name: "Open equipment" }).click();
  await page.waitForTimeout(350);
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 8000 });
  await dialog.getByRole("button", { name: "Chemicals", exact: true }).click();
  await page.waitForTimeout(200);
  const search = dialog.getByPlaceholder(/Search/i);
  await search.fill("water");
  await page.waitForTimeout(400);
  // title= on the pour control; accessible name is often just "+"
  const pourBtn = dialog
    .locator('button[title="Pour into active vessel"]')
    .or(dialog.getByRole("button", { name: "+", exact: true }))
    .first();
  await pourBtn.click();
  await page.waitForTimeout(500);
  await closeInventorySheet(page);
}

async function dragVesselOnto(page, fromIdx, toIdx) {
  const vessels = vesselLocator(page);
  const src = vessels.nth(fromIdx);
  const dst = vessels.nth(toIdx);
  const b0 = await src.boundingBox();
  const b1 = await dst.boundingBox();
  if (!b0 || !b1) return { ok: false, reason: "missing boxes" };

  const start = { x: b0.x + b0.width / 2, y: b0.y + 36 };
  const end = { x: b1.x + b1.width / 2, y: b1.y + 36 };

  // Instrument long-task / frame cost during drag
  await page.evaluate(() => {
    window.__dragPerf = { frames: [], longTasks: 0 };
    window.__dragObs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.duration > 50) window.__dragPerf.longTasks += 1;
      }
    });
    try {
      window.__dragObs.observe({ entryTypes: ["longtask"] });
    } catch {
      /* safari */
    }
    window.__dragRaf = true;
    const tick = (t) => {
      if (!window.__dragRaf) return;
      const prev = window.__dragLast || t;
      window.__dragPerf.frames.push(t - prev);
      window.__dragLast = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  const t0 = Date.now();
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  const steps = 20;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      start.x + ((end.x - start.x) * i) / steps,
      start.y + ((end.y - start.y) * i) / steps,
      { steps: 1 },
    );
  }
  await page.mouse.up();
  const wallMs = Date.now() - t0;

  const perf = await page.evaluate(() => {
    window.__dragRaf = false;
    try {
      window.__dragObs?.disconnect();
    } catch {
      /* */
    }
    const frames = window.__dragPerf?.frames || [];
    const sample = frames.slice(2); // drop first
    const avg =
      sample.reduce((a, b) => a + b, 0) / Math.max(1, sample.length);
    const max = Math.max(0, ...sample);
    return {
      avgFrameMs: avg,
      maxFrameMs: max,
      longTasks: window.__dragPerf?.longTasks || 0,
      frameSamples: sample.length,
    };
  });

  return { ok: true, wallMs, ...perf, start, end };
}

async function runViewport(browser, label, contextOptions) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const log = { label, ok: true, issues: [], steps: [] };

  try {
    await login(page);
    log.steps.push({ step: "login", loggedIn: true, url: page.url() });

    const n = await placeTwoBeakers(page);
    log.steps.push({ step: "place-beakers", count: n });
    if (n < 2) {
      log.ok = false;
      log.issues.push("Could not place 2 beakers");
    } else {
      await vesselLocator(page).first().click();
      await addWater(page);
      const afterWater = await collectFx(page);
      log.steps.push({ step: "add-water", fx: afterWater });
      if (!afterWater.vesselText.some((t) => /\d+\.\d+\/\d+ ml/.test(t))) {
        log.issues.push("Water did not appear in vessel");
        log.ok = false;
      }

      const drag = await dragVesselOnto(page, 0, 1);
      log.steps.push({ step: "drag", drag });
      await page.waitForTimeout(400);
      const mid = await collectFx(page);
      log.steps.push({ step: "pour-mid", fx: mid });
      await page.waitForTimeout(1400);
      const after = await collectFx(page);
      log.steps.push({ step: "pour-after", fx: after });

      const poured =
        after.bodyPouring ||
        mid.bodyPouring ||
        after.pourSource > 0 ||
        mid.pourSource > 0 ||
        after.pourRibbon > 0 ||
        mid.pourRibbon > 0 ||
        after.vesselText.some((t) => /Awaiting chemicals/i.test(t)) ||
        // source emptied / target gained: count ml badges
        (after.vesselText.filter((t) => /\d+\.\d+\/\d+ ml/.test(t)).length >= 1 &&
          after.vesselText.some((t) => /Awaiting chemicals|0\.0\//i.test(t)));

      if (!poured) {
        // retry once
        const drag2 = await dragVesselOnto(page, 0, 1);
        await page.waitForTimeout(1600);
        const after2 = await collectFx(page);
        log.steps.push({ step: "drag-retry", drag: drag2, fx: after2 });
        const poured2 =
          after2.bodyPouring ||
          after2.pourSource > 0 ||
          after2.pourRibbon > 0 ||
          after2.vesselText.some((t) => /Awaiting chemicals/i.test(t));
        if (!poured2) {
          log.ok = false;
          log.issues.push("No pour/transfer evidence after beaker-on-beaker drag");
        }
      }

      if (drag.ok && drag.avgFrameMs > 40) {
        log.issues.push(
          `Drag felt heavy: avg frame ${drag.avgFrameMs.toFixed(1)}ms (target ≤16–33)`,
        );
      }
      if (drag.ok && drag.longTasks > 2) {
        log.issues.push(`Drag longtasks: ${drag.longTasks}`);
      }
      if (drag.ok && drag.wallMs > 2500) {
        log.issues.push(`Drag wall clock high: ${drag.wallMs}ms`);
      }
    }

    log.final = await collectFx(page);
    await page.screenshot({
      path: `${OUT}/${label}.png`,
      fullPage: false,
    });
  } catch (e) {
    log.ok = false;
    log.issues.push(String(e?.message || e));
    await page.screenshot({ path: `${OUT}/${label}-error.png` }).catch(() => {});
  }

  await context.close();
  return log;
}

const browser = await chromium.launch({ headless: true });
const desktop = await runViewport(browser, "desktop", {
  viewport: { width: 1440, height: 900 },
});
const mobile = await runViewport(browser, "mobile", {
  ...devices["iPhone 14"],
});
await browser.close();

const summary = { desktop, mobile, out: OUT, email: EMAIL };
writeFileSync(`${OUT}/result.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
