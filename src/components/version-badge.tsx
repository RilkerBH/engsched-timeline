/**
 * Small fixed badge in the bottom-left corner showing the app version.
 * The value comes from package.json at build time (see next.config.mjs).
 */
export function VersionBadge() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION;
  if (!version) return null;
  return (
    <div
      className="pointer-events-none fixed bottom-2 left-3 z-50 select-none font-mono text-[11px] text-muted-foreground/70"
      aria-label={`Versão ${version}`}
    >
      v{version}
    </div>
  );
}
