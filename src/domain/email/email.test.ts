import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decideDelivery, nextAttemptAt, parseEmailMode } from "./policy";
import { escapeHtml, firstName, renderTemplate, textToHtml, variablesIn } from "./template";
import { verifySvixSignature } from "./webhook-signature";

describe("templates", () => {
  it("renders variables and reports missing ones", () => {
    const r = renderTemplate("Hi {{first_name}}, book here: {{ consultation_link }} {{unknown}}", {
      first_name: "Jane",
      consultation_link: "",
    });
    expect(r.text).toBe("Hi Jane, book here:  ");
    expect(r.missing.sort()).toEqual(["consultation_link", "unknown"]);
    expect(variablesIn("{{a}} {{b}} {{a}}")).toEqual(["a", "b"]);
  });

  it("does not interpret variable values as further placeholders", () => {
    expect(renderTemplate("{{name}}", { name: "{{reference}}" }).text).toBe("{{reference}}");
  });

  it("escapes HTML and links URLs safely", () => {
    const html = textToHtml(
      'Hi <script>x</script>\n\nSee https://example.com/a?b=1&c="2"',
      "Rashed",
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain('<a href="https://example.com/a?b=1&amp;c=&quot;2&quot;"');
    expect(escapeHtml(`'"<>&`)).toBe("&#39;&quot;&lt;&gt;&amp;");
  });

  it("extracts a first name", () => {
    expect(firstName("  Jane   Doe ")).toBe("Jane");
  });
});

describe("delivery policy", () => {
  it("defaults to log mode when unset or invalid", () => {
    expect(parseEmailMode(undefined)).toBe("log");
    expect(parseEmailMode("nonsense")).toBe("log");
    expect(decideDelivery("a@b.com", "log", []).send).toBe(false);
  });

  it("allowlist mode sends only to listed addresses and domains", () => {
    const list = ["me@rashedbin.com", "@example.test"];
    expect(decideDelivery("Me@Rashedbin.com", "allowlist", list).send).toBe(true);
    expect(decideDelivery("x@example.test", "allowlist", list).send).toBe(true);
    expect(decideDelivery("client@realcompany.com", "allowlist", list).send).toBe(false);
  });

  it("live mode sends everything", () => {
    expect(decideDelivery("anyone@anywhere.com", "live", []).send).toBe(true);
  });

  it("backs off exponentially and stops after the maximum attempts", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(nextAttemptAt(1, now)!.toISOString()).toBe("2026-01-01T00:02:00.000Z");
    expect(nextAttemptAt(3, now)!.toISOString()).toBe("2026-01-01T00:08:00.000Z");
    expect(nextAttemptAt(5, now)).toBeNull();
  });
});

describe("webhook signatures", () => {
  const secret = `whsec_${Buffer.from("test-secret-key-123").toString("base64")}`;
  const sign = (id: string, ts: string, body: string) =>
    createHmac("sha256", Buffer.from("test-secret-key-123"))
      .update(`${id}.${ts}.${body}`)
      .digest("base64");
  const now = 1_800_000_000_000;
  const ts = String(now / 1000);
  const body = JSON.stringify({ type: "email.delivered" });

  it("accepts a valid signature", () => {
    expect(
      verifySvixSignature(
        body,
        { id: "msg_1", timestamp: ts, signature: `v1,${sign("msg_1", ts, body)}` },
        secret,
        now,
      ),
    ).toBe(true);
  });

  it("accepts when one of several signatures matches", () => {
    const sig = `v1,AAAA v1,${sign("msg_1", ts, body)}`;
    expect(
      verifySvixSignature(body, { id: "msg_1", timestamp: ts, signature: sig }, secret, now),
    ).toBe(true);
  });

  it("rejects tampered bodies, wrong secrets, missing headers and stale timestamps", () => {
    const good = `v1,${sign("msg_1", ts, body)}`;
    expect(
      verifySvixSignature(body + " ", { id: "msg_1", timestamp: ts, signature: good }, secret, now),
    ).toBe(false);
    expect(
      verifySvixSignature(body, { id: "msg_2", timestamp: ts, signature: good }, secret, now),
    ).toBe(false);
    expect(
      verifySvixSignature(
        body,
        { id: "msg_1", timestamp: ts, signature: good },
        "whsec_d3Jvbmc=",
        now,
      ),
    ).toBe(false);
    expect(
      verifySvixSignature(body, { id: null, timestamp: ts, signature: good }, secret, now),
    ).toBe(false);
    expect(
      verifySvixSignature(
        body,
        { id: "msg_1", timestamp: ts, signature: good },
        secret,
        now + 10 * 60_000,
      ),
    ).toBe(false);
  });
});
