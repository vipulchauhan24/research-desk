import type { ComponentProps } from "react";

function Svg({ children, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
      style={{ display: "block", ...props.style }}
    >
      {children}
    </svg>
  );
}

export function CheckIcon(props: ComponentProps<"svg">) {
  return (
    <Svg {...props}>
      <path d="m3 8.5 3.5 3.5L13 4.5" />
    </Svg>
  );
}

export function XIcon(props: ComponentProps<"svg">) {
  return (
    <Svg {...props}>
      <path d="m4 4 8 8M12 4l-8 8" />
    </Svg>
  );
}

export function PlusIcon(props: ComponentProps<"svg">) {
  return (
    <Svg {...props}>
      <path d="M2.5 8h11M8 2.5v11" />
    </Svg>
  );
}

export function MinusIcon(props: ComponentProps<"svg">) {
  return (
    <Svg {...props}>
      <path d="M2.5 8h11" />
    </Svg>
  );
}

export function ChevronDownIcon(props: ComponentProps<"svg">) {
  return (
    <Svg {...props}>
      <path d="m4 6 4 4 4-4" />
    </Svg>
  );
}

export function ChevronUpDownIcon(props: ComponentProps<"svg">) {
  return (
    <Svg {...props}>
      <path d="m5 6.5 3-3 3 3M5 9.5l3 3 3-3" />
    </Svg>
  );
}

export function ArrowUpIcon(props: ComponentProps<"svg">) {
  return (
    <Svg {...props}>
      <path d="M8 13V3M4 7l4-4 4 4" />
    </Svg>
  );
}

export function ArrowDownIcon(props: ComponentProps<"svg">) {
  return (
    <Svg {...props}>
      <path d="M8 3v10M4 9l4 4 4-4" />
    </Svg>
  );
}

export function MoreIcon(props: ComponentProps<"svg">) {
  return (
    <Svg {...props}>
      <circle cx="3.5" cy="8" r="0.75" fill="currentColor" />
      <circle cx="8" cy="8" r="0.75" fill="currentColor" />
      <circle cx="12.5" cy="8" r="0.75" fill="currentColor" />
    </Svg>
  );
}
