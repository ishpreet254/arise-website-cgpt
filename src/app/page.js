import Nav from "@/components/global/Nav";
import Footer from "@/components/global/Footer";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import About from "@/components/sections/About";
import Portfolio from "@/components/sections/Portfolio";
import Testimonials from "@/components/sections/Testimonials";
import FAQ from "@/components/sections/FAQ";
import ReachOut from "@/components/sections/ReachOut";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Services />
        <About />
        <Portfolio />
        <Testimonials />
        <FAQ />
        <ReachOut />
        <Contact />
      </main>
      <Footer />
    </>
  );
}