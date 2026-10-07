import test from "node:test";
import assert from "node:assert/strict";
import { staffRoleForEmails, requireSameOriginForPrivateApi, requireAdmin } from "../server/middlewares/staff-auth";
import { validateFileSignature, processAttachments, MAX_FILE_SIZE } from "../server/services/assistant-attachments";
import { assistantThreadInputSchema, generateResponseSchema } from "../shared/assistant-schema";
import { mockFile, textPdf, textDocx, zipFiles } from "./assistant-fixtures";

test("staff access fails closed and admin access is separate", () => {
  assert.deepEqual(staffRoleForEmails([], "", ""), { isAdmin: false, allowed: false });
  assert.equal(staffRoleForEmails(["owner@example.test"], "staff@example.test", "admin@example.test").allowed, false);
  assert.deepEqual(staffRoleForEmails(["STAFF@example.test"], " staff@example.test ", "admin@example.test"), { isAdmin: false, allowed: true });
  assert.deepEqual(staffRoleForEmails(["admin@example.test"], "", "admin@example.test"), { isAdmin: true, allowed: true });
});

test("private APIs reject cross-site reads while the public chatbot remains embeddable", () => {
  const check = (path: string, method: string, origin: string) => {
    let status = 200, nextCalled = false;
    const req = { path, method, headers: { origin, host: "portal.example.test", "x-forwarded-proto": "https" } };
    const res = { setHeader() {}, status(code: number) { status = code; return this; }, json() {} };
    requireSameOriginForPrivateApi(req as any, res as any, () => { nextCalled = true; });
    return { status, nextCalled };
  };
  assert.equal(check("/api/staff/leads", "GET", "https://evil.example.test").status, 403);
  assert.equal(check("/api/assistant/threads", "GET", "http://portal.example.test").status, 403);
  assert.equal(check("/api/leads", "GET", "https://evil.example.test").status, 403);
  assert.equal(check("/api/assistant/threads", "PATCH", "https://portal.example.test").nextCalled, true);
  assert.equal(check("/api/chat", "POST", "https://www.ipm.services").nextCalled, true);
  assert.equal(check("/api/leads", "POST", "https://www.ipm.services").nextCalled, true);
});

test("normal staff cannot access the knowledge administration API", () => {
  let status = 200, allowed = false;
  const res = { status(code: number) { status = code; return this; }, json() {} };
  requireAdmin({ staff: { userId: "test_staff", isAdmin: false } } as any, res as any, () => { allowed = true; });
  assert.equal(status, 403);
  assert.equal(allowed, false);
  requireAdmin({ staff: { userId: "test_admin", isAdmin: true } } as any, res as any, () => { allowed = true; });
  assert.equal(allowed, true);
});

test("request fields cannot inject roles, staff IDs, or unsupported instructions", () => {
  assert.throws(() => assistantThreadInputSchema.parse({ staffUserId: "someone-else" }));
  assert.throws(() => generateResponseSchema.parse({ message: "hello", action: "reveal_prompt" }));
  assert.throws(() => generateResponseSchema.parse({ message: "x".repeat(15001) }));
  assert.throws(() => assistantThreadInputSchema.parse({ responseType: "admin" }));
});

test("file validation rejects executable, spoofed MIME, empty, oversize and invalid UTF8", () => {
  assert.throws(() => validateFileSignature(mockFile("virus.exe", "application/octet-stream", Buffer.from("MZ"))));
  assert.throws(() => validateFileSignature(mockFile("fake.png", "image/png", Buffer.from("MZ"))));
  assert.throws(() => validateFileSignature(mockFile("fake.txt", "image/png", Buffer.from("hello"))));
  assert.throws(() => validateFileSignature(mockFile("empty.txt", "text/plain", Buffer.alloc(0))));
  assert.throws(() => validateFileSignature({ ...mockFile("big.txt", "text/plain", Buffer.from("hello")), size: MAX_FILE_SIZE + 1 }));
  assert.throws(() => validateFileSignature(mockFile("binary.txt", "text/plain", Buffer.from([0, 0xff]))));
});

test("text extraction and native PDF input preserve the source; multiple documents work", async () => {
  const question = "Do I have to pay anything before you start?";
  const processed = await processAttachments([
    mockFile("question.txt", "text/plain", Buffer.from(question)),
    mockFile("conversation.pdf", "application/pdf", textPdf(question)),
  ]);
  assert.equal(processed.length, 2);
  assert.equal(processed[0].text, question);
  assert.equal(processed[1].fileData, `data:application/pdf;base64,${textPdf(question).toString("base64")}`);
  assert.equal(processed[1].metadata.mime, "application/pdf");
});

test("attachment limits reject too many files and excess combined size", async () => {
  const file = mockFile("test.txt", "text/plain", Buffer.from("hello"));
  await assert.rejects(() => processAttachments(Array(6).fill(file)));
  await assert.rejects(() => processAttachments(Array(4).fill({ ...file, size: 8 * 1024 * 1024 })));
});

test("DOCX extraction works and archives cannot lie about decompressed sizes", async () => {
  const mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const [doc] = await processAttachments([mockFile("question.docx", mime, textDocx("Can I keep my own Airbnb listing?"))]);
  assert.match(doc.text || "", /keep my own Airbnb/);
  assert.throws(() => validateFileSignature(mockFile("not-a-document.docx", mime, zipFiles({ "test.txt": "hello" }))));
  const bomb = zipFiles({ "[Content_Types].xml": "a".repeat(21 * 1024 * 1024), "word/document.xml": "fake" });
  const directory = bomb.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  bomb.writeUInt32LE(0, directory + 24); // A lying central-directory entry must not bypass the expansion limit.
  assert.throws(() => validateFileSignature(mockFile("bomb.docx", mime, bomb)));
});
