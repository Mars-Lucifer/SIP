import React from "react";

type ButtonVariant =
  | "dark"
  | "accent"
  | "outline"
  | "outlineMuted"
  | "danger"
  | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  as?: "button" | "a";
  href?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  dark: "bg-q-dark text-white hover:bg-q-accent hover:text-q-dark",
  accent: "bg-q-accent text-q-dark hover:bg-q-dark hover:text-q-accent",
  outline: "border border-q-dark text-q-dark bg-transparent hover:bg-q-surface",
  outlineMuted:
    "border border-q-border text-q-dark bg-white hover:bg-q-surface hover:border-q-border",
  danger: "bg-q-danger text-white hover:bg-q-danger-soft",
  ghost: "bg-q-surface text-q-dark hover:bg-q-surface-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-[18px] py-3 text-base",
};

export function Button({
  variant = "dark",
  size = "md",
  icon,
  iconPosition = "right",
  fullWidth = false,
  children,
  className = "",
  as: Tag = "button",
  href,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2.5 rounded-q-pill font-medium leading-normal transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap select-none disabled:cursor-not-allowed disabled:border-q-border disabled:bg-q-surface disabled:text-q-muted disabled:hover:bg-q-surface disabled:hover:text-q-muted";

  const classes = [
    base,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (Tag === "a" && href) {
    return (
      <a href={href} className={classes}>
        {icon && iconPosition === "left" && icon}
        {children}
        {icon && iconPosition === "right" && icon}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {icon && iconPosition === "left" && icon}
      {children}
      {icon && iconPosition === "right" && icon}
    </button>
  );
}
