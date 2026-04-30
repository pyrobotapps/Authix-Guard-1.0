import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Commands from "@/components/Commands";
import Premium from "@/components/Premium";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Landing() {
  return (
    <div data-testid="landing-page" className="relative bg-[#050505] text-white min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Commands />
        <Premium />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
