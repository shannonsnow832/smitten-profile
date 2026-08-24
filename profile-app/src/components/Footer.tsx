export function Footer() {
  return (
    <footer className="bg-muted border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm">
            <a
              href="https://smittensingles.com/terms-of-service"
              target="_blank"
              rel="noopener"
              className="text-primary hover:underline"
            >
              Terms of Service
            </a>
            <a
              href="https://smittensingles.com/code-of-conduct"
              target="_blank"
              rel="noopener"
              className="text-primary hover:underline"
            >
              Code of Conduct
            </a>
            <a
              href="https://smittensingles.com/privacy-policy"
              target="_blank"
              rel="noopener"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>
            <a
              href="https://smittensingles.com/cookie-policy"
              target="_blank"
              rel="noopener"
              className="text-primary hover:underline"
            >
              Cookie Policy
            </a>
            <a
              href="https://wevow.com/smitten-llc/report-incident"
              target="_blank"
              rel="noopener"
              className="text-primary hover:underline"
            >
              Report an Incident
            </a>
            <a
              href="mailto:info@thesmittenproject.com"
              className="text-primary hover:underline"
            >
              Contact
            </a>
          </div>
          <p className="text-xs text-muted-foreground text-center md:text-right">
            © 2026 Smitten, LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
