import { expect, test, type Page } from "@playwright/test";
import { E2E_RESULTS_PASSWORD } from "../playwright.config";
import {
  answerScreener,
  clickAndSave,
  expectNoEmDashes,
  loginToResults,
  startStudy,
} from "./helpers";

// Unique text lets each run find its own row on /results.
const RUN = Date.now().toString(36);
const BLOCKER = `e2e blocker ${RUN}`;
const SQ_ANSWER = `status quo answer ${RUN}`;

async function doTask(page: Page, mode: "answer" | "give_up") {
  await expect(page.getByText("How to find the answer")).toBeVisible();
  await page.getByRole("button", { name: "Start task" }).click();
  await expect(page.getByRole("timer")).toBeVisible();

  const prototype = page.getByRole("region", { name: "LionLocker prototype" });
  const isPrototype = await prototype.isVisible();

  if (isPrototype) {
    // Not mapped building first, then a real search.
    await prototype.getByLabel("Lerner Hall").check();
    await prototype.getByLabel("Right now").check();
    await prototype.getByRole("button", { name: "Find storage" }).click();
    await expect(prototype.getByText("Checking campus storage near Lerner Hall...")).toBeVisible();
    await expect(prototype.getByRole("heading", { name: "Not mapped yet" })).toBeVisible();

    await prototype.getByLabel("Dodge Fitness Center").check();
    await prototype.getByRole("button", { name: "Find storage" }).click();
    await expect(prototype.getByRole("heading", { name: "Dodge daily locker" })).toBeVisible();
  }

  const answerBox = page.getByLabel(/What would you do\?/);
  const submit = page.getByRole("button", { name: "That's my answer" });

  if (mode === "give_up") {
    await page.getByRole("button", { name: "I couldn't find an answer" }).click();
    await clickAndSave(page, "Yes, I couldn't find it");
    return isPrototype;
  }

  await answerBox.fill("ab");
  await expect(submit).toBeDisabled();
  await answerBox.fill(isPrototype ? `prototype answer ${RUN}` : SQ_ANSWER);
  await expect(submit).toBeEnabled();
  await clickAndSave(page, "That's my answer");

  await expect(page.getByRole("heading", { name: /How sure are you/ })).toBeVisible();
  await page.getByLabel("4", { exact: true }).check();
  await clickAndSave(page, "Continue");
  return isPrototype;
}

test.describe.configure({ mode: "serial" });

test("ineligible participant is thanked and stopped", async ({ page }) => {
  await startStudy(page);
  await answerScreener(page, { grad: "No", days: "3-4", laptop: "Yes", source: "A friend sent it" });
  await clickAndSave(page, "Continue");
  await expect(page.getByRole("heading", { name: "Thanks for your time" })).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "10");
  await expectNoEmDashes(page);
});

test("screener needs all four answers", async ({ page }) => {
  await startStudy(page);
  const next = page.getByRole("button", { name: "Continue" });
  await expect(next).toBeDisabled();
  await answerScreener(page, { grad: "Yes", days: "0", laptop: "Yes", source: "Other" });
  await expect(next).toBeEnabled();
  await clickAndSave(page, "Continue");
  await expect(page.getByRole("heading", { name: "Thanks for your time" })).toBeVisible();
});

test("eligible participant completes both tasks", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("We don't collect your name, email, or phone number.")).toBeVisible();
  await expectNoEmDashes(page);
  await page.getByRole("button", { name: "I agree, let's start." }).click();
  await answerScreener(page, {
    grad: "Yes",
    days: "5+",
    laptop: "Yes",
    source: "A team member handed me this",
  });
  await clickAndSave(page, "Continue");

  await expect(page.getByText("Task 1 of 2")).toBeVisible();
  const firstWasPrototype = await doTask(page, "answer");

  // Reload mid flow: the session resumes on the same step.
  await page.reload();
  await expect(page.getByText("Task 2 of 2")).toBeVisible();

  const secondWasPrototype = await doTask(page, "give_up");
  expect(firstWasPrototype).not.toBe(secondWasPrototype);

  await expect(page.getByRole("heading", { name: "Almost done" })).toBeVisible();
  const finish = page.getByRole("button", { name: "Finish" });
  await expect(finish).toBeDisabled();
  await page.getByLabel("Maybe").check();
  await page.getByLabel(/What would stop you/).fill(BLOCKER);
  await clickAndSave(page, "Finish");

  await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
  await expect(page.getByText("LionLocker isn't a working app yet.")).toBeVisible();
  await expectNoEmDashes(page);
});

test("timer resumes from the original start after a reload", async ({ page }) => {
  await startStudy(page);
  await answerScreener(page, { grad: "Yes", days: "1-2", laptop: "Yes", source: "Other" });
  await clickAndSave(page, "Continue");
  await page.getByRole("button", { name: "Start task" }).click();
  await page.waitForTimeout(2200);
  await page.reload();
  const timer = page.getByRole("timer");
  await expect(timer).toBeVisible();
  const seconds = Number((await timer.innerText()).split(":")[1]);
  expect(seconds).toBeGreaterThanOrEqual(2);
});

test("CSV export is blocked without login", async ({ request }) => {
  const res = await request.get("/results/csv");
  expect(res.status()).toBe(401);
});

test("results page shows the session, saves scores and exports CSV", async ({ page }) => {
  await loginToResults(page, "wrong-password");
  await expect(page.getByText("That password didn't work.")).toBeVisible();

  await loginToResults(page, E2E_RESULTS_PASSWORD);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByText("Median time, prototype")).toBeVisible();

  const row = page.getByRole("row").filter({ hasText: BLOCKER });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Completed");
  await expect(row).toContainText("Gave up");
  await expect(row).toContainText("maybe");

  // Score the first finished task in this row.
  const scoreGroup = row.getByRole("group", { name: /Score P\d+ (status quo|prototype) answer/ }).first();
  await scoreGroup.getByRole("button", { name: "Partly" }).click();
  await expect(scoreGroup.getByRole("button", { name: "Partly" })).toHaveAttribute("aria-pressed", "true");
  await page.waitForLoadState("networkidle");
  await page.reload();
  const reloadedRow = page.getByRole("row").filter({ hasText: BLOCKER });
  await expect(
    reloadedRow.getByRole("button", { name: "Partly", pressed: true }),
  ).toHaveCount(1);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^lionlocker-results-\d{4}-\d{2}-\d{2}\.csv$/);
  const path = await download.path();
  const { readFile } = await import("node:fs/promises");
  const csv = await readFile(path, "utf8");
  expect(csv.split("\r\n")[0]).toContain("participant,session_id");
  expect(csv).toContain(BLOCKER);
  expect(csv).toContain("partly");
  expect(csv).toMatch(/lerner\/now@[\d.]+s; dodge\/now@[\d.]+s/);

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByLabel("Team password")).toBeVisible();
});
