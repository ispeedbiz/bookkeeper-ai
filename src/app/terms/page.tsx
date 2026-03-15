import Link from "next/link";

export const metadata = {
  title: "Terms of Service | BookkeeperAI",
  description: "Terms of Service for BookkeeperAI platform",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-navy-950">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Link href="/" className="text-sm text-teal-400 hover:text-teal-300">
          &larr; Back to Home
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: March 15, 2026</p>

        <div className="mt-10 space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="mt-3">
              By accessing or using BookkeeperAI (&quot;Service&quot;), operated by SMS360S LLP
              (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), you agree to be bound by these Terms of
              Service. If you do not agree, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">2. Description of Service</h2>
            <p className="mt-3">
              BookkeeperAI is an AI-powered bookkeeping platform that provides document processing,
              financial reporting, and accounting automation services. The Service is provided on a
              subscription basis with various plan tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">3. Accounts & Registration</h2>
            <p className="mt-3">
              You must provide accurate and complete information when creating an account. You are
              responsible for maintaining the security of your account credentials and for all
              activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">4. Subscription & Billing</h2>
            <p className="mt-3">
              Paid plans are billed monthly. You may cancel your subscription at any time. Refunds
              are handled on a case-by-case basis. Free trial periods are offered as specified at
              the time of registration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">5. Data Privacy</h2>
            <p className="mt-3">
              Your financial data is encrypted at rest and in transit. We do not sell your data to
              third parties. Please review our{" "}
              <Link href="/privacy" className="text-teal-400 hover:text-teal-300 underline">
                Privacy Policy
              </Link>{" "}
              for complete details on how we handle your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">6. Acceptable Use</h2>
            <p className="mt-3">
              You agree not to misuse the Service, including uploading malicious files, attempting
              unauthorized access, or using the Service for any illegal purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">7. Limitation of Liability</h2>
            <p className="mt-3">
              The Service is provided &quot;as is&quot; without warranties of any kind. SMS360S LLP shall
              not be liable for any indirect, incidental, or consequential damages arising from
              your use of the Service. Our total liability shall not exceed the amount paid by you
              in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">8. Termination</h2>
            <p className="mt-3">
              We may suspend or terminate your access to the Service at our discretion if you
              violate these terms. You may delete your account at any time through the Settings
              page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">9. Changes to Terms</h2>
            <p className="mt-3">
              We may update these terms from time to time. We will notify you of material changes
              via email or through the Service. Continued use of the Service after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">10. Contact</h2>
            <p className="mt-3">
              For questions about these Terms, contact us at{" "}
              <a href="mailto:accounts@sms360s.com" className="text-teal-400 hover:text-teal-300 underline">
                accounts@sms360s.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
