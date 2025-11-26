import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Hanala Food',
  description: 'Get in touch with Hanala Food. We would love to hear from you.'
}

export default function ContactPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero banner - yellow theme */}
      <section className="w-full bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900">
        <div className="container">
          <div className="relative overflow-hidden rounded-b-2xl py-14 sm:py-16">
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 800 400" className="h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="wave-contact" x1="0" x2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,80 C200,160 600,0 800,80 L800,0 L0,0 Z" fill="url(#wave-contact)" />
                <path d="M0,160 C200,240 600,80 800,160 L800,0 L0,0 Z" fill="url(#wave-contact)" />
              </svg>
            </div>
            <h1 className="relative z-10 text-center text-4xl font-extrabold sm:text-5xl">
              Contact us
            </h1>
            <p className="relative z-10 mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base opacity-90">
              From automation to integrations, we help businesses unlock great experiences. Fill
              out the form to start a conversation.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container">
        <div className="mx-auto my-10 max-w-2xl rounded-2xl border bg-muted/30 p-6 shadow-sm sm:p-8 lg:p-10">
          <form className="mx-auto max-w-2xl space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Name</label>
              <input
                type="text"
                placeholder="Your First and Last Name"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-amber-500 focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                placeholder="Your Business Email"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-amber-500 focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Tell us more</label>
              <textarea
                rows={5}
                placeholder="Your message"
                className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none ring-amber-500 focus:ring-2"
              />
            </div>
            <div className="pt-2 flex justify-center">
              <button type="submit" className="inline-flex items-center rounded-md bg-amber-500 px-5 py-2 text-sm font-medium text-slate-900 hover:bg-amber-600">
                Submit and Send
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}


