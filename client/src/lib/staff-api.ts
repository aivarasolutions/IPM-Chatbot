import { apiRequest } from "@/lib/queryClient";

export async function staffRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  try {
    return await apiRequest<T>(method, path, body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    const match = message.match(/^(\d+):\s*([\s\S]*)$/);
    if (match) {
      let detail = match[2];
      try { detail = JSON.parse(detail).error || detail; } catch { /* keep server message */ }
      throw new Error(`${match[1]}:${detail}`);
    }
    throw error;
  }
}

export function statusCode(error: unknown): number | null {
  const match = String(error instanceof Error ? error.message : error).match(/^(\d+):/);
  return match ? Number(match[1]) : null;
}
