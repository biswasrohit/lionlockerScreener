import { expect, type Page } from "@playwright/test";

export interface ScreenerChoice {
  readonly grad: "Yes" | "No";
  readonly days: "0" | "1-2" | "3-4" | "5+";
  readonly laptop: "Yes" | "No";
  readonly source: string;
}

export async function startStudy(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "I agree, let's start." }).click();
}

export async function answerScreener(page: Page, choice: ScreenerChoice) {
  const pick = (question: string, option: string) =>
    page.getByRole("group", { name: question }).getByLabel(option, { exact: true }).check();
  await pick("Are you a Columbia graduate student?", choice.grad);
  await pick("How many days a week are you on campus for 6+ hours?", choice.days);
  await pick("Do you usually carry a laptop on those days?", choice.laptop);
  await pick("How did you get to this page?", choice.source);
}

/** Clicks the button and waits for the matching save to come back OK. */
export async function clickAndSave(page: Page, buttonName: string) {
  const saved = page.waitForResponse(
    (res) => res.url().endsWith("/api/session") && res.request().method() === "POST",
  );
  await page.getByRole("button", { name: buttonName }).click();
  const res = await saved;
  expect(res.status()).toBe(200);
}

export async function expectNoEmDashes(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toContain("—");
}

export async function loginToResults(page: Page, password: string) {
  await page.goto("/results");
  await page.getByLabel("Team password").fill(password);
  await page.getByRole("button", { name: "View results" }).click();
}
