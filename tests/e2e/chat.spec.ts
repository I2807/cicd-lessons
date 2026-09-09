import { expect, test, type Page, type Route } from "@playwright/test";

interface GeminiResponseOptions { text: string; }
interface GeminiMock { requests: Record<string, unknown>[]; respond: (text: string) => Promise<void>; releaseFirst: () => void; }

function geminiResponse({ text }: GeminiResponseOptions) {
  return { candidates: [{ content: { parts: [{ text }], role: "model" }, finishReason: "STOP", index: 0 }], usageMetadata: { promptTokenCount: 12, candidatesTokenCount: text.length, totalTokenCount: text.length + 12 } };
}

async function installGeminiMock(page: Page, responses: string[], options: { holdFirst?: boolean } = {}): Promise<GeminiMock> {
  const requests: Record<string, unknown>[] = [];
  let requestIndex = 0;
  let releaseFirst!: () => void;
  const firstRequestReleased = new Promise<void>((resolve) => { releaseFirst = resolve; });
  await page.route("**/generativelanguage.googleapis.com/**", async (route: Route) => {
    const postData = route.request().postDataJSON() as Record<string, unknown>;
    requests.push(postData);
    const responseText = responses[Math.min(requestIndex, responses.length - 1)];
    const currentRequest = requestIndex;
    requestIndex += 1;
    if (options.holdFirst && currentRequest === 0) await firstRequestReleased;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(geminiResponse({ text: responseText })) });
  });
  return { requests, respond: async (text: string) => { await page.waitForTimeout(0); await page.route("**/generativelanguage.googleapis.com/**", async (route) => { await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(geminiResponse({ text })) }); }); }, releaseFirst };
}

test.describe("CA Buddy browser workflow", () => {
  test("shows the single screen and completes the supported-topic happy path", async ({ page }) => {
    const mock = await installGeminiMock(page, ["GST return due dates depend on your filing frequency. Check the current period and verify important dates with a Chartered Accountant.", "For the same GST situation, check the next applicable filing period and confirm the date with a Chartered Accountant."]);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "CA Buddy" })).toBeVisible();
    await expect(page.getByRole("log", { name: /chat conversation/i })).toBeVisible();
    await expect(page.getByLabel(/ask a tax question/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "New chat" })).toBeVisible();
    await expect(page.getByText(/general information, not professional advice/i)).toBeVisible();
    const input = page.getByLabel(/ask a tax question/i);
    await input.fill("When is my GST return due?");
    await input.press("Enter");
    await expect(page.getByText("When is my GST return due?")).toBeVisible();
    await expect(page.getByText(/GST return due dates depend/i)).toBeVisible();
    await input.fill("What about the next period?");
    await input.press("Enter");
    await expect(page.getByText("What about the next period?")).toBeVisible();
    await expect(page.getByText(/For the same GST situation/i)).toBeVisible();
    expect(JSON.stringify(mock.requests[1])).toContain("When is my GST return due?");
  });

  test("explains the professional boundary and keeps the disclaimer visible", async ({ page }) => {
    await installGeminiMock(page, ["I cannot provide individualized tax advice or calculate from private records. Please consult a Chartered Accountant."]);
    await page.goto("/");
    await page.getByLabel(/ask a tax question/i).fill("Calculate my tax from my private records.");
    await page.getByRole("button", { name: /send question/i }).click();
    await expect(page.getByRole("article", { name: "Assistant message" }).getByText(/consult a Chartered Accountant/i)).toBeVisible();
    await expect(page.getByText(/general information, not professional advice/i)).toBeVisible();
  });

  test("clears the conversation and ignores a late response from the old chat", async ({ page }) => {
    const mock = await installGeminiMock(page, ["Old answer", "Fresh answer"], { holdFirst: true });
    await page.goto("/");
    const input = page.getByLabel(/ask a tax question/i);
    await input.fill("Old question");
    await input.press("Enter");
    await expect(page.getByText("Old question")).toBeVisible();
    await expect.poll(() => mock.requests.length).toBe(1);
    await page.getByRole("button", { name: "New chat" }).click();
    await expect(page.getByText(/your questions and practical answers will appear here/i)).toBeVisible();
    await input.fill("Fresh question");
    await input.press("Enter");
    await expect(page.getByText("Fresh answer")).toBeVisible();
    mock.releaseFirst();
    await expect(page.getByText("Old answer")).not.toBeVisible();
    await expect(page.getByText("Fresh question")).toBeVisible();
  });

  test("does not restore messages after a page refresh", async ({ page }) => {
    await installGeminiMock(page, ["A temporary answer"]);
    await page.goto("/");
    const input = page.getByLabel(/ask a tax question/i);
    await input.fill("A question for this page");
    await input.press("Enter");
    await expect(page.getByText("A temporary answer")).toBeVisible();
    await page.reload();
    await expect(page.getByText("A question for this page")).not.toBeVisible();
    await expect(page.getByText(/your questions and practical answers will appear here/i)).toBeVisible();
  });
});
