import { Boxes } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary rounded-lg blur-md opacity-70 group-hover:opacity-100 transition" />
        <div className="relative h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center">
          <Boxes className="h-5 w-5 text-white" />
        </div>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display font-semibold text-sm tracking-wide">LEGACY</div>
          <div className="text-[10px] text-accent uppercase tracking-[0.2em]">AR Platform</div>
        </div>
      )}
    </Link>
  );
}
