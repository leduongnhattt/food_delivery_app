import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accessibility | Hanala Food',
  description: 'Our commitment to accessibility and inclusive experience for all users.'
}

export default function AccessibilityPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero banner */}
      <section className="w-full bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900">
        <div className="container">
          <div className="relative overflow-hidden rounded-b-2xl py-14 sm:py-16">
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 800 400" className="h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="wave-a11y" x1="0" x2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,80 C200,160 600,0 800,80 L800,0 L0,0 Z" fill="url(#wave-a11y)" />
                <path d="M0,160 C200,240 600,80 800,160 L800,0 L0,0 Z" fill="url(#wave-a11y)" />
              </svg>
            </div>
            <h1 className="relative z-10 text-center text-4xl font-extrabold sm:text-5xl">
              Accessibility
            </h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container">
        <div className="mx-auto my-10 rounded-2xl bg-muted/30 p-6 sm:p-8 lg:p-10">
          <div className="space-y-6 text-muted-foreground">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Our Commitment</h2>
              <p className="mt-2">
                Hanala Food is committed to providing an accessible and inclusive experience for all
                users, including people with disabilities. We strive to conform to WCAG 2.1 AA
                guidelines and continuously improve our products.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">Measures We Take</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6">
                <li>Semantic HTML and ARIA attributes for assistive technologies.</li>
                <li>Keyboard navigable interface and visible focus states.</li>
                <li>Color contrast that meets or exceeds WCAG recommendations.</li>
                <li>Texts with sufficient size and scalable layouts.</li>
                <li>Alt text for images and labels for form controls.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">Feedback</h2>
              <p className="mt-2">
                We welcome your feedback on accessibility. If you encounter accessibility barriers
                on our Services, please let us know via
                <span className="ml-1 font-medium text-foreground">support@hanala.food</span>.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">Ongoing Improvements</h2>
              <p className="mt-2">
                Accessibility is an ongoing effort. We review new features for accessibility and
                train our team on inclusive design and development practices.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


