import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-mono uppercase tracking-[0.13em] " +
  "transition-colors duration-150 ease-[var(--ease-out)] rounded-[2px] " +
  "disabled:opacity-45 disabled:pointer-events-none select-none";

/** Radio 2px por defecto: el PDF de Zorvo es recto. El 16px se gana, no se asume. */
const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]",
  accent:
    "bg-[var(--zrv-yellow-400)] text-[var(--zrv-espresso-900)] hover:bg-[var(--zrv-yellow-300)]",
  outline:
    "border-2 border-current bg-transparent hover:bg-current/10",
  ghost: "bg-transparent hover:bg-current/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.6875rem]",
  md: "h-11 px-6 text-xs",
  lg: "h-14 px-8 text-sm",
};

type Props = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: Props & ComponentProps<"button">) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href,
  ...rest
}: Props & ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
