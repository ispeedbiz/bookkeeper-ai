import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import Services from "@/components/landing/Services";
import HowItWorks from "@/components/landing/HowItWorks";
import ForCPAs from "@/components/landing/ForCPAs";
import ROICalculator from "@/components/landing/ROICalculator";
import Testimonials from "@/components/landing/Testimonials";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-navy-950">
      <Navbar />
      <Hero />
      <TrustBar />
      <section id="services">
        <Services />
      </section>
      <HowItWorks />
      <section id="for-cpas">
        <ForCPAs />
      </section>
      <ROICalculator />
      <Testimonials />
      <CTASection />
      <Footer />
    </main>
  );
}
