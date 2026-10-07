// Manual end-to-end test against the running development app. Uses real AI.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import WebSocket from "ws";
import { eq } from "drizzle-orm";
import { db, pool } from "../server/db";
import { chatMessages } from "../shared/schema";

if (process.env.NODE_ENV === "production" || !process.env.REPLIT_DEV_DOMAIN) throw new Error("Run only in the development workspace.");
const profile = await mkdtemp(path.join(tmpdir(), "ipm-public-chat-"));
const sessions = new Set<string>();
const font = execFileSync("fc-match", ["sans", "-f", "%{file}"], { encoding: "utf8" }).trim();
const image = execFileSync("convert", [
  "-size", "950x200", "xc:white", "-font", font, "-fill", "#0D2240", "-pointsize", "34",
  "-annotate", "+25+85", "¿Puedo mantener mi propia cuenta de Airbnb?", "png:-",
], { maxBuffer: 5 * 1024 * 1024 });
const imagePath = path.join(profile, "question.png"), badPath = path.join(profile, "invalid.png");
await writeFile(imagePath, image);
await writeFile(badPath, Buffer.from("Not actually a PNG"));
const browser = spawn(process.env.CHROMIUM_PATH || "/repl/tools/bin/chromium", [
  "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
  "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
let socket: WebSocket | undefined;
let counter = 0;
const pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
const responses: Array<{ requestId: string; url: string; status: number }> = [];
const loaded = new Set<string>();
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
let targetSession: string | undefined;

function cdp(method: string, params: Record<string, unknown> = {}, sessionId = targetSession): Promise<any> {
  const id = ++counter;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket!.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    setTimeout(() => { if (pending.delete(id)) reject(new Error(`CDP timed out: ${method}`)); }, 15000).unref();
  });
}
async function evaluate(expression: string) {
  const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error("Browser evaluation failed.");
  return result.result.value;
}
async function until(check: () => Promise<any>, description: string, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await check();
    if (result) return result;
    await pause(150);
  }
  throw new Error(`Timed out waiting for ${description}`);
}
async function selectFiles(files: string[]) {
  const { root } = await cdp("DOM.getDocument");
  const { nodeId } = await cdp("DOM.querySelector", { nodeId: root.nodeId, selector: "input[type=file]" });
  assert.ok(nodeId, "Picture input is present");
  await cdp("DOM.setFileInputFiles", { nodeId, files });
}
async function reply(endpoint: string, offset: number, status = 200) {
  const found = await until(async () => responses.slice(offset).find(item => item.url.endsWith(endpoint) && loaded.has(item.requestId)), endpoint);
  assert.equal(found.status, status);
  const body = await cdp("Network.getResponseBody", { requestId: found.requestId });
  const result = JSON.parse(body.body);
  if (result.sessionId) sessions.add(result.sessionId);
  return result;
}

try {
  const endpoint = await new Promise<string>((resolve, reject) => {
    let output = "";
    browser.stderr.on("data", chunk => {
      output = (output + chunk.toString()).slice(-8000);
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) resolve(match[1]);
    });
    browser.once("error", reject);
    browser.once("exit", code => reject(new Error(`Chromium exited before startup: ${code}`)));
    setTimeout(() => reject(new Error("Chromium startup timed out")), 15000).unref();
  });
  socket = new WebSocket(endpoint);
  socket.on("message", data => {
    const message = JSON.parse(data.toString());
    if (message.id) {
      const job = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) job?.reject(new Error(message.error.message));
      else job?.resolve(message.result);
    }
    if (message.method === "Network.responseReceived") responses.push({ requestId: message.params.requestId, url: message.params.response.url, status: message.params.response.status });
    if (message.method === "Network.loadingFinished") loaded.add(message.params.requestId);
  });
  await new Promise<void>((resolve, reject) => { socket!.once("open", resolve); socket!.once("error", reject); });
  const target = await cdp("Target.createTarget", { url: "about:blank" });
  const attached = await cdp("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  targetSession = attached.sessionId;
  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 380, height: 700, deviceScaleFactor: 1, mobile: true });
  await cdp("Page.navigate", { url: `https://${process.env.REPLIT_DEV_DOMAIN}/?embedded=true` });
  await until(() => evaluate("!!document.querySelector('input[type=file]')"), "public picture input");
  await selectFiles([imagePath, imagePath]);
  await until(() => evaluate("document.querySelectorAll('img[src^=\"blob:\"]').length === 2"), "two picture previews");
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, "Mobile page has no horizontal overflow");
  await evaluate("Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.startsWith('Remove picture'))?.click()");
  await until(() => evaluate("document.querySelectorAll('img[src^=\"blob:\"]').length === 1"), "remove-picture action");
  assert.equal(await evaluate("document.querySelector('[data-testid=button-send]').disabled"), false, "Image-only send is enabled");
  const uploadCapture = await cdp("Page.captureScreenshot", { format: "png" });
  await writeFile("/tmp/ipm-public-picture-composer.png", Buffer.from(uploadCapture.data, "base64"));
  let offset = responses.length;
  await evaluate("document.querySelector('[data-testid=button-send]').click()");
  const answer = await reply("/api/chat/images", offset);
  assert.match(answer.message, /Airbnb/i);
  assert.match(answer.message, /cuenta|puedes|mantener|propiedad|sí/i, "Picture question receives a Spanish reply");
  await until(() => evaluate("document.querySelectorAll('[data-testid=message-assistant]').length === 1"), "AI reply rendered");
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true);
  await pause(1200);
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
  await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
  await evaluate("document.querySelector('textarea').focus()");
  await cdp("Input.insertText", { text: "¿Y puedo seguir recibiendo mis propias reservas?" });
  offset = responses.length;
  await evaluate("document.querySelector('[data-testid=button-send]').click()");
  const followup = await reply("/api/chat", offset);
  assert.equal(followup.sessionId, answer.sessionId);
  await until(() => evaluate("document.querySelectorAll('[data-testid=message-assistant]').length === 2"), "text follow-up rendered");
  assert.ok(followup.message.length);
  await pause(1200);
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
  await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
  await selectFiles([badPath]);
  await evaluate("document.querySelector('textarea').focus()");
  await cdp("Input.insertText", { text: "Keep this unsent message" });
  offset = responses.length;
  await evaluate("document.querySelector('[data-testid=button-send]').click()");
  await reply("/api/chat/images", offset, 400);
  await until(() => evaluate("!document.querySelector('[data-testid=button-send]').disabled"), "failed-send controls");
  assert.equal(await evaluate("document.querySelector('textarea').value"), "Keep this unsent message");
  assert.equal(await evaluate("document.querySelectorAll('[data-testid=message-user]').length"), 2, "Failed send does not add a duplicate message");
  assert.equal(await evaluate("document.querySelectorAll('img[src^=\"blob:\"]').length"), 2, "Unsent preview and prior sent picture are retained");
  const history = await db.select().from(chatMessages).where(eq(chatMessages.sessionId, answer.sessionId));
  assert.equal(history.length, 4);
  assert.match(JSON.stringify(history.find(message => message.role === "user" && message.metadata)?.metadata), /Airbnb/i);
  assert.doesNotMatch(JSON.stringify(history), /data:image|base64|blob:|question\.png/);
  console.log("PASS: mobile public-chat picker, previews, removal, image-only Spanish reply, text follow-up, error retention, and transient originals.");
  console.log("Composer screenshot: /tmp/ipm-public-picture-composer.png");
} finally {
  socket?.close();
  browser.kill("SIGTERM");
  for (const session of sessions) await db.delete(chatMessages).where(eq(chatMessages.sessionId, session));
  await pool.end();
  await pause(300);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
