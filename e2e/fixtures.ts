import { expect, type Page } from "@playwright/test";
import { createUser, makeAdmin, serviceClient, TEST_PASSWORD } from "../tests/helpers/supabase";
import { totp } from "../tests/helpers/totp";

export { serviceClient };

/** Creates a fresh admin and signs in through the real UI, including MFA enrolment. */
export async function signInAsNewAdmin(page: Page) {
  const admin = await createUser("e2e-admin");
  await makeAdmin(admin.id);
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/admin\/mfa$/);
  await page.getByRole("button", { name: "Set up authenticator" }).click();
  await page.getByText("Can’t scan? Enter this key manually").click();
  const secret = (await page.getByTestId("totp-secret").textContent())!.trim();
  await page.getByLabel("Verification code").fill(totp(secret));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  return { ...admin, secret };
}

/** Latest 6-digit code emailed to `email`, read from the local Mailpit inbox. */
export async function latestEmailCode(email: string): Promise<string> {
  const base = process.env.MAILPIT_URL!;
  for (let attempt = 0; attempt < 30; attempt++) {
    const res = await fetch(
      `${base}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=1`,
    );
    const list = (await res.json()) as { messages?: { ID: string }[] };
    const id = list.messages?.[0]?.ID;
    if (id) {
      const msg = (await (await fetch(`${base}/api/v1/message/${id}`)).json()) as {
        Text?: string;
        HTML?: string;
      };
      const code = `${msg.Text ?? ""} ${msg.HTML ?? ""}`.match(/\b(\d{6})\b/)?.[1];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No sign-in code arrived for ${email}`);
}

export { createUser, makeAdmin, TEST_PASSWORD };
