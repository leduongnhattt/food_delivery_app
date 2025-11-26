import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use | Hanala Food',
  description: 'Terms and conditions for using Hanala Food services.'
}

export default function TermsPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero banner */}
      <section className="w-full bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900">
        <div className="container">
          <div className="relative overflow-hidden rounded-b-2xl py-14 sm:py-16">
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 800 400" className="h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="wave-terms" x1="0" x2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,80 C200,160 600,0 800,80 L800,0 L0,0 Z" fill="url(#wave-terms)" />
                <path d="M0,160 C200,240 600,80 800,160 L800,0 L0,0 Z" fill="url(#wave-terms)" />
              </svg>
            </div>
            <h1 className="relative z-10 text-center text-4xl font-extrabold sm:text-5xl">
              Terms of Use
            </h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container">
        <div className="mx-auto my-10 rounded-2xl bg-muted/30 p-6 sm:p-8 lg:p-10">
          <div className="space-y-6 text-muted-foreground">
            <div>
              <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="mt-2">
                By accessing or using Hanala Food services, you agree to these Terms of Use and our
                Privacy Policy. If you do not agree, please discontinue use of the Services.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">2. Use of Services</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6">
                <li>Do not misuse the Services or interfere with their normal operation.</li>
                <li>Comply with applicable laws and regulations.</li>
                <li>Provide accurate account information and keep your credentials secure.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">3. Accounts and Security</h2>
              <p className="mt-2">
                You are responsible for maintaining the confidentiality of your account and for all
                activities under your account. Notify us immediately of any unauthorized use.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">4. Orders and Payments</h2>
              <p className="mt-2">
                Orders are subject to availability and confirmation. Prices, fees, and taxes are
                displayed during checkout. Some orders may require verification or cancellation per
                our policies.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">5. Intellectual Property</h2>
              <p className="mt-2">
                All content and trademarks are the property of Hanala Food or its licensors and may
                not be used without permission.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">6. Limitation of Liability</h2>
              <p className="mt-2">
                To the maximum extent permitted by law, Hanala Food shall not be liable for any
                indirect, incidental, or consequential damages arising from your use of the
                Services.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">7. Changes to Terms</h2>
              <p className="mt-2">
                We may update these Terms from time to time. Continued use of the Services after
                changes constitutes acceptance of the updated Terms.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


