export type Tone = "green" | "amber" | "red" | "blue" | "slate";

// Status → colour mapping from the Status table in .claude/theme.md. The only place this lives.
export const STATUS_TONE = {
  Match: "green",
  Buy: "green",
  OK: "green",
  LTCG: "green",
  "Slight miss": "amber",
  Miss: "red",
  Sell: "red",
  Triggered: "red",
  Watch: "blue",
  STCG: "blue",
  Hold: "slate",
  "Not hit": "slate",
} as const satisfies Record<string, Tone>;

export type Status = keyof typeof STATUS_TONE;
