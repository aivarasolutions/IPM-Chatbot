import { clerkClient, getAuth } from "@clerk/express";
import type { RequestHandler } from "express";
import { getClerkProxyHost } from "./clerkProxyMiddleware";

declare global {
  namespace Express {
    interface Request { staff?: { userId: string; isAdmin: boolean } }
  }
}

const verifiedEmailCache = new Map<string, { emails: string[]; expires: number }>();
const parseAllowlist = (value = "") => new Set(value.split(",").map(email => email.trim().toLowerCase()).filter(Boolean));

export function staffRoleForEmails(emails: string[], staffList: string, adminList: string) {
  const admins = parseAllowlist(adminList);
  const staff = parseAllowlist(staffList);
  const normalized = emails.map(email => email.toLowerCase());
  const isAdmin = normalized.some(email => admins.has(email));
  return { isAdmin, allowed: isAdmin || normalized.some(email => staff.has(email)) };
}

function matchesPortalOrigin(req: Parameters<RequestHandler>[0]) {
  try {
    const protocol = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0].trim();
    return !!req.headers.origin && new URL(req.headers.origin).origin === `${protocol}://${getClerkProxyHost(req)}`;
  } catch { return false; }
}

// Keep the embeddable public chatbot's CORS behavior separate from cookie-authenticated staff data.
export const requireSameOriginForPrivateApi: RequestHandler = (req, res, next) => {
  const privateApi = /^\/api\/(?:staff|assistant|analytics)(?:\/|$)/.test(req.path)
    || (["GET", "HEAD"].includes(req.method) && /^\/api\/leads(?:\/|$)/.test(req.path));
  if (privateApi && req.headers.origin && !matchesPortalOrigin(req)) {
    res.setHeader("Cache-Control", "no-store");
    res.status(403).json({ error: "Staff data may only be accessed from the IPM portal." });
    return;
  }
  next();
};

export const requireStaff: RequestHandler = async (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.vary("Cookie");
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to the IPM staff portal." });
    return;
  }
  if (!process.env.IPM_STAFF_EMAILS && !process.env.IPM_ADMIN_EMAILS) {
    res.status(503).json({ error: "Staff access is not configured. Add IPM_STAFF_EMAILS and IPM_ADMIN_EMAILS in the project's environment settings." });
    return;
  }
  // A browser carrying session cookies may only mutate staff data from this origin.
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !matchesPortalOrigin(req)) {
    res.status(403).json({ error: "Staff requests must originate from this portal." });
    return;
  }
  try {
    let cached = verifiedEmailCache.get(userId);
    if (!cached || cached.expires < Date.now()) {
      const user = await clerkClient.users.getUser(userId);
      const emails = user.emailAddresses
        .filter(email => email.verification?.status === "verified")
        .map(email => email.emailAddress.toLowerCase());
      cached = { emails, expires: Date.now() + 60000 };
      if (verifiedEmailCache.size > 1000) verifiedEmailCache.clear();
      verifiedEmailCache.set(userId, cached);
    }
    const role = staffRoleForEmails(cached.emails, process.env.IPM_STAFF_EMAILS || "", process.env.IPM_ADMIN_EMAILS || "");
    if (!role.allowed) {
      res.status(403).json({ error: "This account is not authorized for the IPM staff portal. Ask an IPM administrator to grant access." });
      return;
    }
    req.staff = { userId, isAdmin: role.isAdmin };
    next();
  } catch {
    res.status(503).json({ error: "Unable to verify staff access. Please try again shortly." });
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.staff?.isAdmin) {
    res.status(403).json({ error: "Administrator access is required to maintain AI knowledge." });
    return;
  }
  next();
};
