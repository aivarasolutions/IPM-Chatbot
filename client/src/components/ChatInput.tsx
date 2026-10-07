import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => Promise<void> | void;
  onError?: (error: unknown) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_FILES = 3;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 12 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function imageExtension(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  return "png";
}

function ensureImageName(file: File, index: number): File {
  const targetExt = imageExtension(file.type);
  const currentExt = file.name.split(".").pop()?.toLowerCase();
  const matches = currentExt === targetExt || (file.type === "image/jpeg" && currentExt === "jpeg");
  if (file.name && matches) return file;
  return new File([file], `pasted-picture-${Date.now()}-${index}.${imageExtension(file.type)}`, { type: file.type });
}

export function ChatInput({
  onSendMessage,
  onError,
  disabled,
  placeholder = "Ask about international property investment...",
}: ChatInputProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const activeUrls = useRef(new Set<string>());
  const busy = !!disabled || sending;

  const showError = (error: unknown) => {
    if (onError) {
      onError(error);
      return;
    }
    toast({
      title: t("chat.sendErrorTitle"),
      description: error instanceof Error ? error.message : t("chat.sendErrorFallback"),
      variant: "destructive",
    });
  };

  useEffect(() => () => {
    activeUrls.current.forEach((url) => URL.revokeObjectURL(url));
    activeUrls.current.clear();
  }, []);

  const releaseAllPreviews = () => {
    activeUrls.current.forEach((url) => URL.revokeObjectURL(url));
    activeUrls.current.clear();
    setPreviews([]);
  };

  const addFiles = (incoming: FileList | File[]) => {
    const nextFiles = [...files];
    const nextPreviews = [...previews];
    let issue: string | null = null;

    for (const original of Array.from(incoming)) {
      const file = ensureImageName(original, nextFiles.length);
      if (!IMAGE_TYPES.has(file.type)) {
        issue = t("chat.imageTypeError");
        break;
      }
      if (file.size > MAX_FILE_BYTES) {
        issue = t("chat.imageSizeError", { name: file.name });
        break;
      }
      if (nextFiles.length >= MAX_FILES) {
        issue = t("chat.imageCountError");
        break;
      }
      if (nextFiles.reduce((total, item) => total + item.size, 0) + file.size > MAX_TOTAL_BYTES) {
        issue = t("chat.imageTotalSizeError");
        break;
      }
      const url = URL.createObjectURL(file);
      activeUrls.current.add(url);
      nextFiles.push(file);
      nextPreviews.push(url);
    }
    setFiles(nextFiles);
    setPreviews(nextPreviews);
    if (issue) showError(new Error(issue));
  };

  const removeFile = (index: number) => {
    const url = previews[index];
    if (url) {
      URL.revokeObjectURL(url);
      activeUrls.current.delete(url);
    }
    setFiles((current) => current.filter((_, i) => i !== index));
    setPreviews((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || (!message.trim() && files.length === 0)) return;
    setSending(true);
    try {
      await onSendMessage(message.trim(), files.length ? files : undefined);
      setMessage("");
      setFiles([]);
      releaseAllPreviews();
    } catch (error) {
      showError(error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit(event);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItems = Array.from(event.clipboardData.items).filter((item) => item.type.startsWith("image/"));
    const images = imageItems.map((item) => item.getAsFile()).filter((file): file is File => !!file);
    if (images.length) {
      event.preventDefault();
      addFiles(images);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!busy && event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
      }}
      className={`border-t border-border bg-background p-3 ${dragging ? "ring-2 ring-inset ring-primary/40 bg-primary/5" : ""}`}
    >
      <div className="mx-auto w-full max-w-5xl">
        {previews.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2" aria-label={t("chat.attachedPictures")}>
            {previews.map((url, index) => (
              <div key={url} className="relative h-[76px] w-[76px] overflow-hidden rounded-lg border bg-muted sm:h-20 sm:w-20">
                <img src={url} alt={t("chat.picturePreview", { number: index + 1 })} className="h-full w-full object-cover" />
                <button
                  type="button"
                  disabled={busy}
                  aria-label={t("chat.removePicture", { number: index + 1 })}
                  onClick={() => removeFile(index)}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-foreground/80 text-background disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex w-full min-w-0 items-end gap-2">
          <Textarea
            data-testid="input-message"
            value={message}
            maxLength={15000}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={busy}
            className="min-h-[44px] max-h-32 min-w-0 flex-1 resize-none rounded-xl"
            rows={1}
          />
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            aria-label={t("chat.uploadPicture")}
            onChange={(event) => {
              if (event.currentTarget.files) addFiles(event.currentTarget.files);
              event.currentTarget.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInput.current?.click()}
            disabled={busy || files.length >= MAX_FILES}
            aria-label={t("chat.uploadPicture")}
            title={t("chat.uploadPicture")}
            className="h-11 shrink-0 px-2.5"
          >
            <Paperclip className="h-4 w-4" />
            <span className="ml-1.5 text-xs">{t("chat.photoButton")}</span>
          </Button>
          <Button
            data-testid="button-send"
            type="submit"
            disabled={busy || (!message.trim() && files.length === 0)}
            className="h-11 w-11 shrink-0"
            aria-label={t("chat.send")}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] leading-4 text-muted-foreground">
          <span>{t("chat.pictureLimits")}</span>
          <span>{message.length.toLocaleString()} / 15,000</span>
        </p>
      </div>
    </form>
  );
}
