import path from "node:path";
import multer from "multer";
import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import { inflateRawSync } from "node:zlib";
import type { AttachmentMetadata } from "@shared/schema";

export const MAX_FILE_SIZE = 8 * 1024 * 1024;
export const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const mimeByExtension: Record<string, string[]> = {
  ".jpg": ["image/jpeg"], ".jpeg": ["image/jpeg"], ".png": ["image/png"], ".webp": ["image/webp"],
  ".pdf": ["application/pdf"], ".txt": ["text/plain"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};
export const assistantUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 5, fields: 4, fieldSize: 16000, parts: 9 },
  fileFilter: (_req, file, callback) => {
    const allowed = mimeByExtension[path.extname(file.originalname).toLowerCase()];
    if (!allowed?.includes(file.mimetype)) return callback(new Error("Unsupported file type or MIME type. Use JPG, PNG, WEBP, PDF, TXT, DOC or DOCX."));
    callback(null, true);
  },
}).array("files", 5);

export interface ProcessedAttachment {
  metadata: AttachmentMetadata;
  text?: string;
  imageUrl?: string;
  fileData?: string;
}

function validateDocxArchive(buffer: Buffer) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0 || end + 22 > buffer.length) throw new Error("Invalid DOCX archive.");
  const count = buffer.readUInt16LE(end + 10);
  const start = buffer.readUInt32LE(end + 16);
  const directorySize = buffer.readUInt32LE(end + 12);
  if (buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6) || !count || count > 500 || start + directorySize > end) {
    throw new Error("Unsupported or oversized DOCX archive.");
  }
  let offset = start, expanded = 0, hasDocument = false, hasTypes = false;
  for (let entry = 0; entry < count; entry++) {
    if (offset + 46 > end || buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("Invalid DOCX directory.");
    const flags = buffer.readUInt16LE(offset + 8), method = buffer.readUInt16LE(offset + 10);
    const compressed = buffer.readUInt32LE(offset + 20), declared = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28), extraLength = buffer.readUInt16LE(offset + 30), commentLength = buffer.readUInt16LE(offset + 32);
    const local = buffer.readUInt32LE(offset + 42);
    if ((flags & 1) || ![0, 8].includes(method) || declared > 20 * 1024 * 1024 - expanded || local + 30 > start) {
      throw new Error("Encrypted or oversized DOCX files are not supported.");
    }
    if (buffer.readUInt32LE(local) !== 0x04034b50) throw new Error("Invalid DOCX entry.");
    const dataStart = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    if (dataStart + compressed > start || offset + 46 + nameLength + extraLength + commentLength > end) throw new Error("Invalid DOCX entry bounds.");
    const raw = buffer.subarray(dataStart, dataStart + compressed);
    // Verify actual decompression, not merely attacker-controlled declared sizes.
    const unpacked = method === 0 ? raw : inflateRawSync(raw, { maxOutputLength: Math.max(1, 20 * 1024 * 1024 - expanded) });
    if (unpacked.length !== declared) throw new Error("Invalid DOCX decompressed size.");
    expanded += unpacked.length;
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    if (name === "word/document.xml") hasDocument = true;
    if (name === "[Content_Types].xml") hasTypes = true;
    offset += 46 + nameLength + extraLength + commentLength;
  }
  if (!hasDocument || !hasTypes) throw new Error("This ZIP file is not a supported Word document.");
}

export function validateFileSignature(file: Pick<Express.Multer.File, "originalname" | "mimetype" | "buffer" | "size">) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!mimeByExtension[ext]?.includes(file.mimetype) || file.size > MAX_FILE_SIZE || file.size === 0) {
    throw new Error("Invalid file type or size.");
  }
  const b = file.buffer;
  let valid = false;
  if (ext === ".jpg" || ext === ".jpeg") valid = b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (ext === ".png") valid = b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (ext === ".webp") valid = b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP";
  if (ext === ".pdf") valid = b.toString("ascii", 0, 5) === "%PDF-";
  if (ext === ".doc") valid = b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  if (ext === ".docx") {
    valid = b.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    if (valid) validateDocxArchive(b);
  }
  if (ext === ".txt") {
    try { new TextDecoder("utf-8", { fatal: true }).decode(b); valid = !b.includes(0); } catch { valid = false; }
  }
  if (!valid) throw new Error("The attachment contents do not match its declared file type.");
}

export async function processAttachments(files: Express.Multer.File[]): Promise<ProcessedAttachment[]> {
  if (files.length > 5 || files.reduce((size, file) => size + file.size, 0) > MAX_TOTAL_SIZE) {
    throw new Error("Use up to 5 attachments with a combined size of 25 MB.");
  }
  let totalText = 0;
  const result: ProcessedAttachment[] = [];
  for (const file of files) {
    validateFileSignature(file);
    const metadata = { name: path.basename(file.originalname).replace(/[\u0000-\u001f]/g, "").slice(0, 180), mime: file.mimetype, size: file.size };
    if (file.mimetype.startsWith("image/")) {
      result.push({ metadata, imageUrl: `data:${file.mimetype};base64,${file.buffer.toString("base64")}` });
      continue;
    }
    if (file.mimetype === "application/pdf") {
      result.push({ metadata, fileData: `data:application/pdf;base64,${file.buffer.toString("base64")}` });
      continue;
    }
    let text: string;
    try {
      if (file.mimetype === "application/msword") {
        text = (await new WordExtractor().extract(file.buffer)).getBody();
      } else if (path.extname(file.originalname).toLowerCase() === ".docx") {
        text = (await mammoth.extractRawText({ buffer: file.buffer })).value;
      } else {
        text = new TextDecoder("utf-8", { fatal: true }).decode(file.buffer);
      }
    } catch (error) {
      throw new Error("Unable to read this document. Try a non-encrypted DOC/DOCX, text file or a screenshot.");
    }
    text = text.trim();
    if (!text) throw new Error("No readable text was found in this document. Upload a screenshot or PDF of the relevant pages instead.");
    totalText += text.length;
    if (totalText > 50000) throw new Error("The documents contain too much text. Upload only the relevant conversation or pages.");
    result.push({ metadata, text });
  }
  return result;
}
