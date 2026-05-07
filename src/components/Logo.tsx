import { Link } from "@tanstack/react-router";
import logoSrc from "@/assets/legacy-logo.png";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary rounded-lg blur-xl opacity-60 group-hover:opacity-90 transition" />
        <img
          src={logoSrc}
          alt="Legacy AR Platform logo"
          className="relative h-10 w-10 object-contain drop-shadow-[0_0_12px_oklch(0.65_0.24_295/60%)]"
        />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display font-semibold text-sm tracking-[0.2em]">LEGACY</div>
          <div className="text-[10px] text-accent uppercase tracking-[0.2em]">AR Platform</div>
        </div>
      )}
    </Link>
  );
}
