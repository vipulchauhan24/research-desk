import type { JSONContent } from "@tiptap/react";
import { z } from "zod";

export const CHANGE_NOTE_MAX_LENGTH = 120;

// Debounce for writing the draft: long enough not to save per keystroke, short enough to lose little on a crash.
export const DRAFT_AUTOSAVE_DEBOUNCE_MS = 1500;

export const saveVersionSchema = z.object({
  changeNote: z
    .string()
    .trim()
    .min(1, "Describe what changed")
    .max(CHANGE_NOTE_MAX_LENGTH, `Keep it under ${CHANGE_NOTE_MAX_LENGTH} characters`),
});

// People paste "example.com/report"; add https:// so it becomes a real link instead of a relative one.
export const linkSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Enter a web address")
    .transform((value) => (/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`))
    .pipe(z.url({ protocol: /^https?$/, error: "Enter a valid web address" })),
});

export const RESOURCE_LABEL_MAX_LENGTH = 80;

// One external resource: a custom label plus a web address (same address rules as links inside the note).
export const resourceLinkSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Enter a label")
    .max(RESOURCE_LABEL_MAX_LENGTH, `Keep it under ${RESOURCE_LABEL_MAX_LENGTH} characters`),
  url: linkSchema.shape.url,
});

export interface ResourceLinkDraft {
  label: string;
  url: string;
}

// "https://www.screener.in/company/X/" -> "screener.in", shown beside the label so you can see where a link goes.
export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export interface LinkDraft {
  url: string;
}

export interface SaveVersionDraft {
  changeNote: string;
}

// Loose on purpose: the editor's own schema is the real check (see the editor's content loader); this only
// stops a malformed jsonb value from reaching it.
const docSchema = z.looseObject({ type: z.literal("doc"), content: z.array(z.unknown()).optional() });

export function parseDoc(value: unknown): JSONContent {
  return docSchema.parse(value) as JSONContent;
}

export const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

// The editor has H2 and H3 only. Word's Title/Heading 1 become H2 and anything deeper becomes H3, so headings survive import.
export function fitHeadings(html: string): string {
  return html.replace(/<(\/?)h1\b/g, "<$1h2").replace(/<(\/?)h[4-6]\b/g, "<$1h3");
}
