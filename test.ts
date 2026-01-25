// test_html_console.ts
import { chromium } from "npm:playwright";
import { resolve, isAbsolute } from "https://deno.land/std/path/mod.ts";

function usage() {
  console.error("Usage: deno run --allow-read --allow-run test_html_console.ts <path-to-html>");
}

const inputPath = Deno.args[0];
if (!inputPath) {
  usage();
  Deno.exit(1);
}

const filePath = isAbsolute(inputPath) ? inputPath : resolve(Deno.cwd(), inputPath);
const fileUrl = `file://${filePath}`;

try {
  await Deno.stat(filePath);
} catch {
  console.error(`File not found: ${filePath}`);
  Deno.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();

const errors: string[] = [];

// Helper: pretty print console args (objects, errors, etc.)
async function formatConsoleArgs(msg: any) {
  const parts: string[] = [];
  for (const arg of msg.args()) {
    try {
      // Try to serialize JSHandle to JSON-ish
      const val = await arg.jsonValue();
      if (val && typeof val === "object") {
        parts.push(JSON.stringify(val, null, 2));
      } else {
        parts.push(String(val));
      }
    } catch {
      // Fallback to a string representation
      try {
        parts.push(String(await arg.evaluate((v: any) => String(v))));
      } catch {
        parts.push("[unserializable]");
      }
    }
  }
  return parts.join(" ");
}

// Console (error/warn can be useful too)
page.on("console", async (msg) => {
  const type = msg.type();
  if (type === "error" || type === "warning") {
    const loc = msg.location();
    const locStr =
      loc?.url ? ` (${loc.url}${loc.lineNumber ? `:${loc.lineNumber}` : ""}${loc.columnNumber ? `:${loc.columnNumber}` : ""})` : "";

    const argsText = await formatConsoleArgs(msg);
    errors.push(`Console ${type}${locStr}: ${msg.text()}${argsText && argsText !== msg.text() ? `\n  args: ${argsText}` : ""}`);
  }
});

// Uncaught exceptions (best chance for stack)
page.on("pageerror", (err) => {
  const stack = (err as any)?.stack ? `\n${(err as any).stack}` : "";
  errors.push(`Uncaught page error: ${(err as any)?.message ?? String(err)}${stack}`);
});

// Failed requests (very common cause of console noise)
page.on("requestfailed", (req) => {
  const failure = req.failure();
  errors.push(
    `Request failed: ${req.method()} ${req.url()}\n  ${failure?.errorText ?? "unknown failure"}`
  );
});

// Non-OK responses (optional but handy)
page.on("response", (res) => {
  if (res.status() >= 400) {
    errors.push(`HTTP ${res.status()} for ${res.url()}`);
  }
});

await page.goto(fileUrl, { waitUntil: "load" });

// Give any async errors time to surface
await page.waitForTimeout(1000);

await browser.close();

if (errors.length) {
  console.error("❌ Errors found:");
  console.error(errors.join("\n\n"));
  Deno.exit(1);
} else {
  console.log("✅ No console/page/network errors found");
}
