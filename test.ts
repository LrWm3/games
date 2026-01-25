// test_html_console.ts
import { chromium } from "npm:playwright";
import { resolve, isAbsolute } from "https://deno.land/std/path/mod.ts";

const inputPath = Deno.args[0];

if (!inputPath) {
  console.error("Usage: deno run test_html_console.ts <relative-or-absolute-html-file>");
  Deno.exit(1);
}

// Resolve relative paths from cwd
const filePath = isAbsolute(inputPath)
  ? inputPath
  : resolve(Deno.cwd(), inputPath);

const fileUrl = `file://${filePath}`;

const browser = await chromium.launch();
const page = await browser.newPage();

const errors: string[] = [];

page.on("console", (msg) => {
  if (msg.type() === "error") {
    errors.push(`Console error: ${msg.text()}`);
  }
});

page.on("pageerror", (err) => {
  errors.push(`Page error: ${err.message}`);
});

await page.goto(fileUrl);
await page.waitForTimeout(500);

await browser.close();

if (errors.length) {
  console.error("❌ Errors found:");
  errors.forEach((e) => console.error(e));
  Deno.exit(1);
} else {
  console.log("✅ No console errors found");
}
