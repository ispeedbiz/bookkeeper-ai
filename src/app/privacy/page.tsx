import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | BookkeeperAI",
  description: "Privacy Policy for BookkeeperAI platform",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-navy-950">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Link href="/" className="text-sm text-teal-400 hover:text-teal-300">
          &larr; Back to Home
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: March 15, 2026</p>

        <div className="mt-10 space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
            <p className="mt-3">
              We collect information you provide directly: name, email address, company name, and
              financial documents you upload. We also collect usage data such as login times,
              features accessed, and browser information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">2. How We Use Your Information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>To provide and maintain the BookkeeperAI service</li>
              <li>To process your financial documents using AI technology</li>
              <li>To communicate with you about your account and service updates</li>
              <li>To improve our service quality and develop new features</li>
              <li>To ensure security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">3. Data Security</h2>
            <p className="mt-3">
              We implement industry-standard security measures including encryption at rest and in
              transit (TLS 1.3), Row Level Security (RLS) on all database tables, and secure
              authentication via Supabase. Your financial documents are stored securely with
              access controls.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">4. Data Sharing</h2>
            <p className="mt-3">
              We do not sell your personal or financial data. We may share data with:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Service providers (Stripe for payments, Supabase for hosting, Resend for email)</li>
              <li>Your designated CPA or accountant (with your explicit consent)</li>
              <li>Law enforcement when required by applicable law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">5. Data Retention</h2>
            <p className="mt-3">
              We retain your data for as long as your account is active. Upon account deletion,
              we will delete your personal data within 30 days. Financial documents may be retained
              for up to 7 years as required by tax regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">6. Your Rights</h2>
            <p className="mt-3">You have the right to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">7. Cookies</h2>
            <p className="mt-3">
              We use essential cookies for authentication and session management. We do not use
              third-party tracking cookies. The Tawk.to chat widget may set its own cookies for
              chat functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">8. Contact</h2>
            <p className="mt-3">
              For privacy-related inquiries, contact us at{" "}
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
