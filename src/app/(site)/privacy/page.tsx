import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Hanala Food',
  description: 'Learn how Hanala Food collects, uses, and protects your information.'
}

export default function PrivacyPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero banner */}
      <section className="w-full bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900">
        <div className="container">
          <div className="relative overflow-hidden rounded-b-2xl py-14 sm:py-16">
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 800 400" className="h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="wave" x1="0" x2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,80 C200,160 600,0 800,80 L800,0 L0,0 Z" fill="url(#wave)" />
                <path d="M0,160 C200,240 600,80 800,160 L800,0 L0,0 Z" fill="url(#wave)" />
              </svg>
            </div>
            <h1 className="relative z-10 text-center text-4xl font-extrabold sm:text-5xl">
              Privacy Policy
            </h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container">
        <div className="mx-auto my-10 rounded-2xl bg-muted/30 p-6 sm:p-8 lg:p-10">
          <div className="space-y-6 text-muted-foreground">
            <div>
              <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
              <p className="mt-2">
                At Hanala Food, we are committed to safeguarding your privacy. This Privacy
                Policy outlines how we collect, use, and protect your personal information
                when you interact with our website, mobile application, and related services
                (collectively, the “Services”). By using our Services, you agree to the
                practices described in this policy.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">2. Information We Collect</h2>
              <p className="mt-2">We collect the following types of information to enhance and deliver our Services:</p>
              <ul className="mt-3 list-disc space-y-1 pl-6">
                <li>
                  <span className="font-medium text-foreground">Personal Information:</span> Includes your name, email address, and location
                  preferences.
                </li>
                <li>
                  <span className="font-medium text-foreground">Usage Data:</span> Tracks how you interact with our Services, such as features
                  used and items viewed.
                </li>
                <li>
                  <span className="font-medium text-foreground">Technical Information:</span> Includes device details like IP address and browser
                  type.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">3. Use of Information</h2>
              <p className="mt-2">We use your data to:</p>
              <ul className="mt-3 list-disc space-y-1 pl-6">
                <li>Provide and personalize our Services.</li>
                <li>Improve functionality and user experience.</li>
                <li>Communicate updates, promotions, and support.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">4. Sharing of Information</h2>
              <p className="mt-2">
                We do not sell your personal information. We may share information with trusted
                service providers who help us operate the Services, subject to strict
                confidentiality obligations.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">5. Data Security</h2>
              <p className="mt-2">
                We implement administrative, technical, and physical safeguards designed to protect
                your information. However, no method of transmission over the internet is 100%
                secure.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">6. Your Choices</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6">
                <li>You may update certain account details in your profile.</li>
                <li>You can opt out of marketing emails by using the unsubscribe link.</li>
              </ul>
            </div>

            
          </div>
        </div>
      </section>
    </div>
  )
}


