/**
 * Secure initial-admin setup. Run locally against the target project:
 *
 *   pnpm admin:bootstrap --email you@example.com              # create the first admin
 *   pnpm admin:bootstrap --email you@example.com --reset-password
 *   pnpm admin:bootstrap --email you@example.com --reset-mfa  # lost authenticator
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (read from
 * .env.local by the package script). The password is typed interactively and
 * never stored anywhere but Supabase Auth. ADMIN_BOOTSTRAP_PASSWORD may be set
 * for automated local tests only.
 *
 * Safety rules:
 *   - Creating an admin is refused if any admin already exists.
 *   - An existing non-admin account is never promoted.
 *   - Resets only apply to an account that is already an admin.
 *   - There are no default credentials.
 */
import { createClient } from "@supabase/supabase-js";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline";

type Mode = "create" | "reset-password" | "reset-mfa";

function parseArgs(argv: string[]): { email: string; mode: Mode } {
  const emailIdx = argv.indexOf("--email");
  const email = emailIdx >= 0 ? (argv[emailIdx + 1] ?? "").trim().toLowerCase() : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    fail("Usage: pnpm admin:bootstrap --email you@example.com [--reset-password | --reset-mfa]");
  const mode: Mode = argv.includes("--reset-password")
    ? "reset-password"
    : argv.includes("--reset-mfa")
      ? "reset-mfa"
      : "create";
  return { email, mode };
}

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

export function passwordProblems(pw: string): string[] {
  const problems: string[] = [];
  if (pw.length < 12) problems.push("at least 12 characters");
  if (!/[a-z]/.test(pw)) problems.push("a lowercase letter");
  if (!/[A-Z]/.test(pw)) problems.push("an uppercase letter");
  if (!/\d/.test(pw)) problems.push("a digit");
  return problems;
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true });
    const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput.bind(
      rl,
    );
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
      if (s.startsWith(question)) write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      stdout.write("\n");
      resolve(answer);
    });
  });
}

async function readPassword(): Promise<string> {
  const fromEnv = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const pw = fromEnv ?? (await askHidden("New admin password: "));
  const problems = passwordProblems(pw);
  if (problems.length) fail(`Password needs ${problems.join(", ")}.`);
  if (!fromEnv) {
    const again = await askHidden("Repeat password: ");
    if (again !== pw) fail("Passwords did not match.");
  }
  return pw;
}

async function main() {
  const { email, mode } = parseArgs(process.argv.slice(2));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set.");

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: admins, error: adminErr } = await db
    .from("profiles")
    .select("id")
    .eq("role", "admin");
  if (adminErr) fail(`Could not read profiles: ${adminErr.message}`);

  // Find the auth user by email (paged).
  let user: { id: string; email?: string } | undefined;
  for (let page = 1; !user; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) fail(`Could not list users: ${error.message}`);
    user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (data.users.length < 1000) break;
  }
  const isAdmin = Boolean(user && admins?.some((a) => a.id === user!.id));

  if (mode === "create") {
    if (admins && admins.length > 0) {
      fail("An admin already exists. Use --reset-password or --reset-mfa for that account.");
    }
    if (user)
      fail("That email already belongs to a non-admin account. Use a different email address.");
    const password = await readPassword();
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) fail(`Could not create the user: ${error?.message}`);
    const { error: roleErr } = await db
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", data.user.id);
    if (roleErr) {
      await db.auth.admin.deleteUser(data.user.id);
      fail(`Could not assign the admin role (user removed): ${roleErr.message}`);
    }
    console.log(
      `\n✔ Admin created for ${email}.\n  Sign in at /admin/login — you'll set up two-step verification on first sign-in.\n`,
    );
    return;
  }

  if (!user || !isAdmin) fail("No admin account exists for that email.");

  if (mode === "reset-password") {
    const password = await readPassword();
    const { error } = await db.auth.admin.updateUserById(user.id, { password });
    if (error) fail(`Could not update the password: ${error.message}`);
    console.log(`\n✔ Password updated for ${email}.\n`);
    return;
  }

  const { data: factors, error } = await db.auth.admin.mfa.listFactors({ userId: user.id });
  if (error) fail(`Could not list MFA factors: ${error.message}`);
  for (const f of factors.factors) {
    const { error: delErr } = await db.auth.admin.mfa.deleteFactor({ userId: user.id, id: f.id });
    if (delErr) fail(`Could not remove a factor: ${delErr.message}`);
  }
  console.log(
    `\n✔ Removed ${factors.factors.length} authenticator(s) for ${email}.\n  Set up a new one on your next sign-in.\n`,
  );
}

if (process.argv[1]?.endsWith("admin-bootstrap.mts")) await main();
