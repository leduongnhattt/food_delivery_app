import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-amber-500 bg-amber-400">
      <div className="container pt-12 pb-6 text-slate-900">
        {/* Link columns like modern sites: About us, Legal, Social */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 justify-items-center text-center">
          <div>
            <h4 className="mb-3 text-lg font-semibold text-foreground">About us</h4>
            <ul className="space-y-2 text-[1.05rem]">
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground">Our company</Link></li>
              <li><Link href="/foundation" className="text-muted-foreground hover:text-foreground">Hanala Foundation</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-lg font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-[1.05rem]">
              <li><Link href="/accessibility" className="text-muted-foreground hover:text-foreground">Accessibility</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy policy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of use</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-lg font-semibold text-foreground">Social</h4>
            <ul className="space-y-3 text-[1.05rem]">
              <li>
                <Link href="#" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#ig)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                      <linearGradient id="ig" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#F77737"/>
                        <stop offset="50%" stopColor="#C13584"/>
                        <stop offset="100%" stopColor="#5851DB"/>
                      </linearGradient>
                    </defs>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.5" y2="6.51"/>
                  </svg>
                  Instagram
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1877F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                  Facebook
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 15l5-3-5-3v6z" fill="#EF4444" stroke="none"/>
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="#EF4444"/>
                  </svg>
                  YouTube
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A66C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 1 0-4 10"/>
                    <rect x="14" y="8" width="8" height="8" rx="2"/>
                  </svg>
                  LinkedIn
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 h-px w-full bg-black/10" />

        {/* Legal bar */}
        <div className="text-sm text-slate-800 space-y-2 text-center">
          <p>&copy; 2025 Hanala Food. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}


