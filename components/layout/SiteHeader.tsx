interface SiteHeaderProps {
  readonly tag?: string;
}

export function SiteHeader({ tag = "Class study" }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <span className="wordmark">
        <span className="wordmark-key" aria-hidden="true" />
        LionLocker
      </span>
      <span className="label">{tag}</span>
    </header>
  );
}
