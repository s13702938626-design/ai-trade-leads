import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-slate-950 text-white hover:bg-slate-800",
  secondary: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

type BaseProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkButtonProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

function classes(variant: ButtonVariant, className = ""): string {
  return `inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition ${variantClass[variant]} disabled:cursor-not-allowed disabled:opacity-50 ${className}`;
}

export function Button({ children, variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button className={classes(variant, className)} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({ children, variant = "primary", className, href, ...props }: LinkButtonProps) {
  return (
    <Link className={classes(variant, className)} href={href} {...props}>
      {children}
    </Link>
  );
}
