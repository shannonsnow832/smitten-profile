export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          {/*
            A wrapping flex row rather than a fixed row: six links will not sit
            on one line on a phone, and a horizontal scroll in the footer is
            how links end up unreachable.
          */}
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
            <a
              href="https://smittensingles.com/terms-of-service"
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-[36px] items-center text-primary hover:underline"
            >
              Terms of Service
            </a>
            <a
              href="https://smittensingles.com/code-of-conduct"
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-[36px] items-center text-primary hover:underline"
            >
              Code of Conduct
            </a>
            <a
              href="https://smittensingles.com/privacy-policy"
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-[36px] items-center text-primary hover:underline"
            >
              Privacy Policy
            </a>
            <a
              href="https://smittensingles.com/cookie-policy"
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-[36px] items-center text-primary hover:underline"
            >
              Cookie Policy
            </a>
            <a
              href="https://wevow.com/smitten-llc/report-incident"
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-[36px] items-center text-primary hover:underline"
            >
              Report an Incident
            </a>
            <a
              href="mailto:info@thesmittenproject.com"
              className="inline-flex min-h-[36px] items-center text-primary hover:underline"
            >
              Contact
            </a>
          </nav>
          <p className="text-center text-xs text-muted-foreground md:text-right">
            &copy; 2026 Smitten, LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
