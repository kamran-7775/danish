import { portfolio } from "@/data/portfolio";
import { getSiteDataSafe } from "@/lib/db";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Band from "@/components/Band";
import About from "@/components/About";
import Identity from "@/components/Identity";
import Services from "@/components/Services";
import Showreel from "@/components/Showreel";
import Work from "@/components/Work";
import Bts from "@/components/Bts";
import Process from "@/components/Process";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

/* Videos, projects, categories, BTS and the showreel come from the database (managed in /admin).
   The page is cached and re-rendered whenever the admin saves a change (revalidatePath). */
export const revalidate = 3600;

export default async function Home() {
  const { bands } = portfolio;
  const { categories, projects, bts, showreel } = await getSiteDataSafe();
  const tracks = categories.map((c) => ({ category: c.name, band: c.label }));

  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Band text={bands.about} font="wide" />
        <About />
        <Identity />
        <Services />
        <Showreel showreel={showreel} />
        <Work projects={projects} tracks={tracks} />
        <Bts items={bts} />
        <Process />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
