import type { ReactNode } from "react";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ShadCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-lg border border-zinc-200 bg-white text-zinc-950 shadow-sm", className)}>{children}</section>;
}

export function ShadCardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>;
}

export function ShadCardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold leading-none tracking-normal", className)}>{children}</h3>;
}

export function ShadCardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm text-zinc-500", className)}>{children}</p>;
}

export function ShadCardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}

export function ShadBadge({
  children,
  variant = "secondary",
  className
}: {
  children: ReactNode;
  variant?: "default" | "secondary" | "outline" | "success";
  className?: string;
}) {
  const variants = {
    default: "border-transparent bg-zinc-900 text-zinc-50",
    secondary: "border-transparent bg-zinc-100 text-zinc-900",
    outline: "border-zinc-200 text-zinc-950",
    success: "border-transparent bg-emerald-100 text-emerald-700"
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}

export function ShadInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm transition placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
    />
  );
}

