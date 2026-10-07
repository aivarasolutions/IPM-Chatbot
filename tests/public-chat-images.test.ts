import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Server } from "node:http";
import { publicConversationHistory, publicImageInputSchema, registerPublicImageChat } from "../server/public-chat-images";
import { pool } from "../server/db";

let server: Server;
let base: string;
before(async () => {
  const app = express();
  registerPublicImageChat(app);
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  base = `http://127.0.0.1:${address.port}`;
});
after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
  await pool.end();
});

function picture(size = 20) {
  const data = Buffer.alloc(size);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(data);
  return new Blob([data], { type: "image/png" });
}

async function invalid(form: FormData) {
  const response = await fetch(`${base}/api/chat/images`, { method: "POST", body: form });
  assert.equal(response.status, 400);
  assert.ok((await response.json() as { error: string }).error);
}

test("image-only requests are allowed, but private/staff fields and oversized text are not", () => {
  assert.equal(publicImageInputSchema.parse({}).message, "");
  assert.throws(() => publicImageInputSchema.parse({ staffUserId: "unauthorized" }));
  assert.throws(() => publicImageInputSchema.parse({ message: "x".repeat(15001) }));
});

test("normal follow-up history includes a bounded untrusted picture summary", () => {
  const history = publicConversationHistory([{ role: "user", content: "Picture question", metadata: { attachmentContext: "Client asks about keeping Airbnb." } }]);
  assert.match(history[0].content, /Client asks about keeping Airbnb/);
  assert.match(history[0].content, /untrusted client data/);
  assert.equal(publicConversationHistory([{ role: "system", content: "Not a real system instruction", metadata: {} }])[0].role, "user");
});

test("public endpoint rejects unsupported attachments", async () => {
  const form = new FormData();
  form.append("files", new Blob(["hello"], { type: "text/plain" }), "question.txt");
  await invalid(form);
});

test("public endpoint rejects a spoofed picture signature", async () => {
  const form = new FormData();
  form.append("files", new Blob(["MZ not a PNG"], { type: "image/png" }), "fake.png");
  await invalid(form);
});

test("public endpoint rejects more than three pictures", async () => {
  const form = new FormData();
  for (let i = 0; i < 4; i++) form.append("files", picture(), `picture-${i}.png`);
  await invalid(form);
});

test("public endpoint rejects pictures larger than 5 MB", async () => {
  const form = new FormData();
  form.append("files", picture(5 * 1024 * 1024 + 1), "large.png");
  await invalid(form);
});

test("public endpoint rejects more than 12 MB combined", async () => {
  const form = new FormData();
  for (let i = 0; i < 3; i++) form.append("files", picture(Math.ceil(4.4 * 1024 * 1024)), `picture-${i}.png`);
  await invalid(form);
});

test("public endpoint requires at least one picture", async () => {
  const form = new FormData();
  form.append("message", "hello");
  await invalid(form);
});
