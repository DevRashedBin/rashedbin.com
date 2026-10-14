import { expect, test } from "@playwright/test";
import { createUser, latestEmailCode, serviceClient } from "./fixtures";

test("a client signs in with an emailed code and sees only their own account", async ({ page }) => {
  const svc = serviceClient();
  const a = await createUser("portal-a");
  const b = await createUser("portal-b");
  const { data } = await svc
    .from("clients")
    .insert([
      { display_name: `Portal Client A ${a.id.slice(0, 4)}`, billing_email: a.email },
      { display_name: `Portal Client B ${b.id.slice(0, 4)}`, billing_email: b.email },
    ])
    .select("id, display_name");
  const clientA = data!.find((c) => c.display_name.startsWith("Portal Client A"))!;
  const clientB = data!.find((c) => c.display_name.startsWith("Portal Client B"))!;
  await svc.from("client_members").insert([
    { client_id: clientA.id, user_id: a.id },
    { client_id: clientB.id, user_id: b.id },
  ]);

  await page.goto("/portal");
  await expect(page).toHaveURL(/\/portal\/login$/);
  await page.getByLabel("Email address").fill(a.email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(page.getByRole("status")).toContainText("a 6-digit code is on its way");

  await page.getByLabel("Sign-in code").fill("000000");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That code is incorrect or has expired.")).toBeVisible();

  await page.getByLabel("Sign-in code").fill(await latestEmailCode(a.email));
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/portal$/);
  await expect(page.getByText(clientA.display_name)).toBeVisible();
  await expect(page.getByText(clientB.display_name)).toHaveCount(0);

  // A portal user is not an admin.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);

  await page.goto("/portal");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/portal\/login$/);
});

test("unknown emails get the same response and no account is created", async ({ page }) => {
  const email = `unknown-${Date.now()}@example.test`;
  await page.goto("/portal/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(page.getByRole("status")).toContainText("a 6-digit code is on its way");
  const { data } = await serviceClient().auth.admin.listUsers({ perPage: 1000 });
  expect(data.users.some((u) => u.email === email)).toBe(false);
});
