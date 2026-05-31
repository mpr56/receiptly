"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface Props {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: "sm" | "md" | "lg" | "none";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export default function GlassSurface({ children, className, hover, onClick, padding = "md" }: Props) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-2xl border transition-all duration-300",
        paddingMap[padding],
        hover && "cursor-pointer hover:border-white/20 hover:bg-white/[0.09] hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        className
      )}
      style={{
        background: "rgba(255,255,255,0.055)",
        borderColor: "rgba(255,255,255,0.1)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {children}
    </div>
  );
}
