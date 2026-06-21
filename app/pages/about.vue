<script setup lang="ts">
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

useSeoMeta({
  title: "About — TheWebsiteForge",
  description:
    "TheWebsiteForge designs, builds, launches, and supports high-performance websites without lock-in or unnecessary friction.",
});

defineOgImage("Forge", {
  title: "About",
  description:
    "We design, build, launch, and support high-performance websites — without lock-in.",
});

const root = ref<HTMLElement | null>(null);
let context: gsap.Context | null = null;

const principles = [
  {
    number: "01",
    title: "Fast by default.",
    body: "Performance is handled while we design and build, not patched in during the final week. We target a 95+ Lighthouse score on every project.",
  },
  {
    number: "02",
    title: "Motion with a job.",
    body: "Animation should clarify the page, guide attention, or improve feedback. If it only adds noise, it does not ship.",
  },
  {
    number: "03",
    title: "You own the work.",
    body: "You receive the source, assets, deployment, and domain. Use our managed services or self-host. There is no platform lock-in.",
  },
  {
    number: "04",
    title: "Simple after launch.",
    body: "Hosting, domains, databases, and approved changes can use one wallet. Your dashboard shows the cost, balance, and remaining runway.",
  },
];

const journey = [
  {
    step: "01",
    label: "Brief",
    title: "Choose a build and explain the job.",
    body: "Select a package and complete the project brief before signing in. We get the pages, features, deadline, and business context upfront.",
  },
  {
    step: "02",
    label: "Build",
    title: "Design and development happen together.",
    body: "We work directly in the final medium, test motion early, and keep you close to the work. Fewer handoffs means fewer details get lost.",
  },
  {
    step: "03",
    label: "Launch",
    title: "Launch with the first month covered.",
    body: "We deploy the site, connect analytics, verify performance, and include the first month of managed hosting.",
  },
  {
    step: "04",
    label: "After launch",
    title: "Keep it managed or take it with you.",
    body: "Use your wallet for ongoing services and small requests, or take the code and self-host. The choice stays yours.",
  },
];

const teamRoles = [
  "Strategy",
  "Design",
  "Development",
  "Motion",
  "Infrastructure",
];

const studioStats = [
  { value: "120+", label: "websites shipped" },
  { value: "98", label: "average Lighthouse score" },
  { value: "14", label: "countries served" },
  { value: "$24M+", label: "client revenue influenced" },
];

onMounted(() => {
  if (
    !root.value ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;

  gsap.registerPlugin(ScrollTrigger);
  context = gsap.context(() => {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: ".about-hero",
          start: "top top",
          end: "+=120%",
          pin: true,
          scrub: 1,
        },
      })
      .to(".hero-line-a", { xPercent: -38, opacity: 0, ease: "power2.in" }, 0)
      .to(".hero-line-b", { xPercent: 44, opacity: 0, ease: "power2.in" }, 0.05)
      .to(".hero-line-c", { xPercent: -28, opacity: 0, ease: "power2.in" }, 0.1)
      .to(".hero-meta", { y: -30, opacity: 0, ease: "power2.in" }, 0)
      .to(".hero-orbit-a", { rotate: 105, scale: 1.18, ease: "none" }, 0)
      .to(".hero-orbit-b", { rotate: -75, scale: 0.82, ease: "none" }, 0)
      .to(".hero-rule", { scaleX: 0, ease: "none" }, 0)
      .fromTo(
        ".hero-exit-label",
        { opacity: 0, scale: 0.7, letterSpacing: "0.2em" },
        { opacity: 1, scale: 1, letterSpacing: "0.55em", ease: "power3.out" },
        0.45,
      );

    gsap.fromTo(
      ".belief-panel",
      { clipPath: "inset(18% 7% 18% 7% round 2rem)", scale: 0.94 },
      {
        clipPath: "inset(0% 0% 0% 0% round 0rem)",
        scale: 1,
        ease: "power3.inOut",
        scrollTrigger: {
          trigger: ".belief-section",
          start: "top bottom",
          end: "top top",
          scrub: 1,
        },
      },
    );

    gsap.from(".belief-line > span", {
      yPercent: 110,
      rotate: 2,
      stagger: 0.08,
      ease: "power4.out",
      scrollTrigger: {
        trigger: ".belief-copy",
        start: "top 72%",
        end: "bottom 58%",
        scrub: 1,
      },
    });

    const journeyTrack =
      root.value!.querySelector<HTMLElement>(".journey-track");
    const journeyViewport =
      root.value!.querySelector<HTMLElement>(".journey-viewport");
    if (journeyTrack && journeyViewport && window.innerWidth >= 900) {
      gsap.to(journeyTrack, {
        x: () => -(journeyTrack.scrollWidth - journeyViewport.clientWidth),
        ease: "none",
        scrollTrigger: {
          trigger: ".journey-pin",
          start: "top top",
          end: () => `+=${journeyTrack.scrollWidth}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      gsap.to(".journey-meter-fill", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".journey-pin",
          start: "top top",
          end: () => `+=${journeyTrack.scrollWidth}`,
          scrub: 1,
        },
      });
    }

    gsap.to(".journey-marquee", {
      xPercent: -32,
      ease: "none",
      scrollTrigger: {
        trigger: ".journey-section",
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });

    gsap.utils.toArray<HTMLElement>(".principle-row").forEach((row) => {
      gsap.fromTo(
        row,
        { clipPath: "inset(0 100% 0 0)", x: -35 },
        {
          clipPath: "inset(0 0% 0 0)",
          x: 0,
          ease: "power3.out",
          scrollTrigger: {
            trigger: row,
            start: "top 88%",
            end: "top 58%",
            scrub: 1,
          },
        },
      );
    });

    gsap
      .timeline({
        scrollTrigger: {
          trigger: ".team-section",
          start: "top bottom",
          end: "center center",
          scrub: 1,
        },
      })
      .fromTo(
        ".team-curtain",
        { scaleY: 1 },
        { scaleY: 0, ease: "power4.inOut" },
        0,
      )
      .fromTo(
        ".team-radar",
        { scale: 0.18, rotate: -45, opacity: 0 },
        { scale: 1, rotate: 0, opacity: 1, ease: "power3.out" },
        0.15,
      )
      .fromTo(
        ".team-heading",
        { yPercent: 80, opacity: 0 },
        { yPercent: 0, opacity: 1, ease: "power3.out" },
        0.32,
      );

    gsap.fromTo(
      ".team-role",
      { xPercent: 35, opacity: 0 },
      {
        xPercent: 0,
        opacity: 1,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".team-roles",
          start: "top 82%",
          end: "bottom 65%",
          scrub: 1,
        },
      },
    );

    gsap.fromTo(
      ".proof-section",
      { clipPath: "inset(0 50% 0 50%)" },
      {
        clipPath: "inset(0 0% 0 0%)",
        ease: "power3.inOut",
        scrollTrigger: {
          trigger: ".proof-section",
          start: "top bottom",
          end: "top 15%",
          scrub: 1,
        },
      },
    );

    gsap.fromTo(
      ".proof-stat",
      { yPercent: 65, opacity: 0, filter: "blur(12px)" },
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        stagger: 0.09,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".proof-grid",
          start: "top 78%",
          end: "bottom 65%",
          scrub: 1,
        },
      },
    );

    gsap
      .timeline({
        scrollTrigger: {
          trigger: ".ownership-section",
          start: "top bottom",
          end: "center center",
          scrub: 1,
        },
      })
      .fromTo(
        ".ownership-door-left",
        { xPercent: 0 },
        { xPercent: -101, ease: "power3.inOut" },
        0,
      )
      .fromTo(
        ".ownership-door-right",
        { xPercent: 0 },
        { xPercent: 101, ease: "power3.inOut" },
        0,
      )
      .fromTo(
        ".ownership-content",
        { scale: 0.84, opacity: 0 },
        { scale: 1, opacity: 1, ease: "power3.out" },
        0.25,
      );
  }, root.value);

  requestAnimationFrame(() => ScrollTrigger.refresh());
});

onBeforeUnmount(() => context?.revert());
</script>

<template>
  <main ref="root" class="about-page bg-[#0e0d0c] text-[#ece9e2]">
    <section
      class="about-hero relative grid min-h-screen place-items-center overflow-hidden px-6 pt-28"
    >
      <div class="hero-orbit hero-orbit-a" />
      <div class="hero-orbit hero-orbit-b" />
      <div class="noise-overlay pointer-events-none absolute inset-0" />

      <div class="about-hero-copy relative z-10 mx-auto w-full max-w-[1500px]">
        <div
          class="hero-meta flex items-center justify-between font-mono text-[0.68rem] uppercase tracking-[0.28em] text-white/42"
        >
          <span>Design / development / hosting</span>
        </div>
        <div class="hero-rule mt-8 h-px origin-left bg-white/15" />
        <h1
          class="mt-12 max-w-[1250px] font-display text-[clamp(4.5rem,11.5vw,12rem)] font-medium leading-[0.78] tracking-[-0.095em]"
        >
          <span class="hero-line-a block">Websites,</span>
          <span
            class="hero-line-b block pl-[12vw] font-serif font-light italic text-white/45"
            >built properly.</span
          >
          <span class="hero-line-c block text-right">That is the job.</span>
        </h1>
        <div
          class="mt-12 flex flex-col justify-between gap-8 border-t border-white/10 pt-7 md:flex-row md:items-end"
        >
          <p class="hero-meta max-w-md text-base leading-relaxed text-white/48">
            We design, build, host, and support websites for businesses that
            care about how they look and how well they perform.
          </p>
          <div class="flex items-center gap-5">
            <span class="h-2 w-2 rounded-full bg-[#ece9e2]" />
            <span
              class="font-mono text-[0.66rem] uppercase tracking-[0.26em] text-white/42"
              >See how we work</span
            >
          </div>
        </div>
      </div>
      <span
        class="hero-exit-label pointer-events-none absolute z-20 font-mono text-[0.68rem] uppercase text-white/50"
        >About the forge</span
      >
    </section>

    <section class="belief-section relative min-h-[150vh]">
      <div
        class="belief-panel sticky top-0 flex min-h-screen items-center overflow-hidden bg-[#ece9e2] px-6 py-24 text-[#151412]"
      >
        <div
          class="belief-index absolute top-10 right-8 font-mono text-[clamp(5rem,17vw,16rem)] leading-none tracking-[-0.1em] text-black/[0.035]"
        >
          WHY
        </div>
        <div
          class="mx-auto grid w-full max-w-[1500px] gap-14 lg:grid-cols-[0.32fr_1fr]"
        >
          <div>
            <p
              class="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-black/48"
            >
              Why we exist / 01
            </p>
            <p class="mt-8 max-w-xs text-base leading-relaxed text-black/55">
              When design and development are separated, good ideas get watered
              down during handoff. We keep both in the same room.
            </p>
          </div>
          <div class="belief-copy">
            <p
              class="belief-line overflow-hidden pb-[0.09em] font-display text-[clamp(3.8rem,8.5vw,9rem)] font-medium leading-[0.83] tracking-[-0.085em]"
            >
              <span class="block">Design and code</span>
            </p>
            <p
              class="belief-line overflow-hidden pb-[0.09em] font-display text-[clamp(3.8rem,8.5vw,9rem)] font-medium leading-[0.83] tracking-[-0.085em]"
            >
              <span class="block pl-[8vw]">belong together.</span>
            </p>
            <p
              class="belief-line overflow-hidden pb-[0.09em] font-display text-[clamp(3.8rem,8.5vw,9rem)] font-medium leading-[0.83] tracking-[-0.085em]"
            >
              <span class="block font-serif font-light italic text-black/42"
                >So we build both.</span
              >
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="journey-section relative overflow-hidden bg-[#151412]">
      <div
        class="journey-marquee pointer-events-none whitespace-nowrap py-5 font-display text-[clamp(5rem,14vw,15rem)] font-medium leading-none tracking-[-0.09em] text-white/[0.035]"
      >
        BRIEF · BUILD · LAUNCH · SUPPORT · BRIEF · BUILD · LAUNCH · SUPPORT ·
      </div>
      <div class="journey-pin px-6 py-20 sm:py-24">
        <div class="mx-auto max-w-[1450px]">
          <div
            class="grid gap-10 border-b border-white/10 pb-16 lg:grid-cols-[1fr_0.5fr] lg:items-end"
          >
            <div>
              <p
                class="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-white/42"
              >
                How projects run / 02
              </p>
              <h2
                class="mt-7 max-w-4xl font-display text-[clamp(4rem,8vw,8.5rem)] font-medium leading-[0.82] tracking-[-0.085em]"
              >
                Fewer handoffs.
                <span class="font-serif font-light italic text-white/38"
                  >Fewer surprises.</span
                >
              </h2>
            </div>
            <p
              class="max-w-md text-base leading-relaxed text-white/48 lg:justify-self-end"
            >
              A direct process from requirements to production, followed by a
              clear choice about hosting and support.
            </p>
          </div>

          <div class="journey-viewport mt-14 overflow-hidden">
            <div class="journey-track flex gap-5">
              <article
                v-for="item in journey"
                :key="item.step"
                :data-step="item.step"
                class="journey-card relative flex min-h-[22rem] w-[min(78vw,34rem)] shrink-0 flex-col justify-between rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-7 backdrop-blur-md md:min-h-[28rem] md:p-10"
              >
                <span
                  class="relative z-10 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-[#151412] font-mono text-[0.65rem] text-white/62"
                  >{{ item.step }}</span
                >
                <div class="mt-auto">
                  <span
                    class="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-white/42"
                    >{{ item.label }}</span
                  >
                  <h3
                    class="mt-3 font-display text-3xl font-medium leading-none tracking-[-0.055em]"
                  >
                    {{ item.title }}
                  </h3>
                </div>
                <p
                  class="mt-6 max-w-md border-t border-white/10 pt-5 text-base leading-relaxed text-white/48"
                >
                  {{ item.body }}
                </p>
              </article>
            </div>
          </div>
          <div class="mt-8 h-px overflow-hidden bg-white/10">
            <div
              class="journey-meter-fill h-full origin-left scale-x-0 bg-[#ece9e2]"
            />
          </div>
        </div>
      </div>
    </section>

    <section
      class="principles-section bg-[#ece9e2] px-6 py-32 text-[#151412] sm:py-44"
    >
      <div class="mx-auto max-w-[1450px]">
        <div
          class="flex flex-col justify-between gap-8 border-b border-black/15 pb-12 md:flex-row md:items-end"
        >
          <h2
            class="max-w-4xl font-display text-[clamp(4rem,9vw,9.5rem)] font-medium leading-[0.78] tracking-[-0.09em]"
          >
            How we work.
          </h2>
          <p class="max-w-xs text-base leading-relaxed text-black/52">
            Four practical rules used on every project.
          </p>
        </div>
        <div class="principles-list">
          <article
            v-for="principle in principles"
            :key="principle.number"
            class="principle-row group grid gap-6 border-b border-black/15 py-9 transition-colors md:grid-cols-[0.16fr_0.7fr_1fr] md:items-start md:py-12"
          >
            <span
              class="font-mono text-[0.66rem] tracking-[0.2em] text-black/45"
              >{{ principle.number }}</span
            >
            <h3
              class="font-display text-[clamp(2rem,3.5vw,4.2rem)] font-medium leading-[0.92] tracking-[-0.065em] transition-transform duration-700 group-hover:translate-x-3"
            >
              {{ principle.title }}
            </h3>
            <p
              class="max-w-lg text-base leading-relaxed text-black/55 md:justify-self-end"
            >
              {{ principle.body }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <section
      class="team-section relative min-h-[125vh] overflow-hidden bg-[#0e0d0c] px-6 py-32 sm:py-44"
    >
      <div
        class="team-curtain absolute inset-0 z-20 origin-bottom bg-[#ece9e2]"
      />
      <div
        class="team-radar absolute top-1/2 right-[-18rem] h-[44rem] w-[44rem] -translate-y-1/2 rounded-full border border-white/10"
      >
        <div
          class="absolute inset-[12%] rounded-full border border-dashed border-white/10"
        />
        <div class="absolute inset-[27%] rounded-full border border-white/10" />
        <div class="absolute top-1/2 left-0 h-px w-full bg-white/10" />
        <div class="absolute top-0 left-1/2 h-full w-px bg-white/10" />
        <span
          class="absolute top-[28%] left-[24%] h-2 w-2 rounded-full bg-[#ece9e2] shadow-[0_0_0_8px_rgba(236,233,226,0.08)]"
        />
      </div>

      <div class="relative z-10 mx-auto max-w-[1450px]">
        <div
          class="flex items-center justify-between border-b border-white/10 pb-6 font-mono text-[0.67rem] uppercase tracking-[0.26em] text-white/42"
        >
          <span>The team / 03</span>
          <span>26.2041° S / 28.0473° E</span>
        </div>

        <div class="mt-16 grid gap-14 lg:grid-cols-[1fr_0.55fr] lg:items-end">
          <div class="overflow-hidden">
            <h2
              class="team-heading font-display text-[clamp(4.5rem,10vw,10.5rem)] font-medium leading-[0.78] tracking-[-0.095em]"
            >
              Based in
              <span class="block font-serif font-light italic text-white/38"
                >South Africa.</span
              >
              <span class="block">Working worldwide.</span>
            </h2>
          </div>
          <p
            class="max-w-md text-base leading-relaxed text-white/48 lg:justify-self-end"
          >
            TheWebsiteForge is built by a South African team of designers,
            developers, motion specialists, and technical problem-solvers. We
            work remotely, collaborate closely, and bring in the right
            specialist when the project needs one.
          </p>
        </div>

        <div
          class="team-roles mt-20 grid border-t border-white/10 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div
            v-for="(role, index) in teamRoles"
            :key="role"
            class="team-role border-b border-white/10 py-6 sm:border-r sm:px-5 lg:border-b-0"
          >
            <span
              class="font-mono text-[0.65rem] tracking-[0.2em] text-white/38"
            >
              {{ String(index + 1).padStart(2, "0") }}
            </span>
            <p
              class="mt-5 font-display text-[clamp(1.5rem,2.2vw,2.25rem)] font-medium leading-none tracking-[-0.045em] text-white/85"
            >
              {{ role }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section
      class="proof-section relative overflow-hidden bg-[#ece9e2] px-6 py-32 text-[#151412] sm:py-44"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap font-display text-[25vw] font-medium leading-none tracking-[-0.12em] text-black/[0.025]"
      >
        SHIPPED
      </div>
      <div class="relative z-10 mx-auto max-w-[1450px]">
        <div
          class="grid gap-10 border-b border-black/15 pb-12 lg:grid-cols-[1fr_0.42fr] lg:items-end"
        >
          <div>
            <p
              class="font-mono text-[0.67rem] uppercase tracking-[0.26em] text-black/48"
            >
              Studio record / 04
            </p>
            <h2
              class="mt-7 max-w-4xl font-display text-[clamp(4rem,8vw,8.5rem)] font-medium leading-[0.8] tracking-[-0.09em]"
            >
              Small team.
              <span class="font-serif font-light italic text-black/38"
                >Real output.</span
              >
            </h2>
          </div>
          <p
            class="max-w-sm text-base leading-relaxed text-black/52 lg:justify-self-end"
          >
            We keep the studio compact so the people making decisions are also
            the people doing the work.
          </p>
        </div>

        <div class="proof-grid mt-12 grid sm:grid-cols-2 lg:grid-cols-4">
          <article
            v-for="stat in studioStats"
            :key="stat.label"
            class="proof-stat border-b border-black/15 py-8 sm:border-r sm:px-6 lg:border-b-0"
          >
            <strong
              class="block font-display text-[clamp(4rem,7vw,7rem)] font-medium leading-none tracking-[-0.09em]"
            >
              {{ stat.value }}
            </strong>
            <span
              class="mt-5 block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-black/48"
            >
              {{ stat.label }}
            </span>
          </article>
        </div>
      </div>
    </section>

    <section
      class="ownership-section relative grid min-h-[135vh] place-items-center overflow-hidden bg-[#0e0d0c] px-6"
    >
      <div
        class="ownership-content relative z-10 mx-auto max-w-5xl text-center"
      >
        <p
          class="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-white/42"
        >
          Ownership / 05
        </p>
        <h2
          class="mt-8 font-display text-[clamp(4.5rem,11vw,11rem)] font-medium leading-[0.78] tracking-[-0.095em]"
        >
          Use our services.
          <span class="mt-3 block font-serif font-light italic text-white/38"
            >Or don't.</span
          >
        </h2>
        <p
          class="mx-auto mt-10 max-w-xl text-base leading-relaxed text-white/48"
        >
          We can manage hosting, domains, databases, and ongoing work. You can
          also take the repository and run everything yourself. You own it
          either way.
        </p>
        <div class="mt-10 flex flex-wrap justify-center gap-3">
          <NuxtLink
            to="/pricing"
            class="btn-gradient px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em]"
            >Start a build</NuxtLink
          >
          <NuxtLink
            to="/showcase"
            class="btn-line px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em]"
            >See the work</NuxtLink
          >
        </div>
      </div>
      <div
        class="ownership-door ownership-door-left absolute inset-y-0 left-0 z-20 w-1/2 bg-[#ece9e2]"
      />
      <div
        class="ownership-door ownership-door-right absolute inset-y-0 right-0 z-20 w-1/2 bg-[#ece9e2]"
      />
    </section>
  </main>
</template>

<style scoped>
.about-page {
  isolation: isolate;
}

.about-hero {
  background:
    radial-gradient(
      circle at 68% 38%,
      rgba(255, 255, 255, 0.055),
      transparent 30rem
    ),
    #0e0d0c;
}

.hero-orbit {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 50%;
  pointer-events: none;
}

.hero-orbit-a {
  top: -24vw;
  right: -16vw;
  width: min(75vw, 70rem);
  aspect-ratio: 1;
  box-shadow:
    inset 0 0 0 5vw rgba(255, 255, 255, 0.008),
    inset 0 0 0 11vw rgba(255, 255, 255, 0.006);
}

.hero-orbit-b {
  bottom: -22rem;
  left: -15rem;
  width: 38rem;
  aspect-ratio: 1;
  border-style: dashed;
}

.journey-section {
  background:
    radial-gradient(
      circle at 20% 35%,
      rgba(255, 255, 255, 0.035),
      transparent 25rem
    ),
    #151412;
}

.journey-card {
  box-shadow: 0 2rem 5rem rgba(0, 0, 0, 0.12);
}

.journey-card::after {
  position: absolute;
  top: 1rem;
  right: 1.4rem;
  font-family: var(--font-display);
  font-size: 9rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.1em;
  color: rgba(255, 255, 255, 0.018);
  content: attr(data-step);
  pointer-events: none;
}

.principle-row {
  background: #ece9e2;
}

.team-section {
  background:
    radial-gradient(
      circle at 78% 45%,
      rgba(255, 255, 255, 0.055),
      transparent 28rem
    ),
    #0e0d0c;
}

.team-radar {
  box-shadow:
    inset 0 0 0 5rem rgba(255, 255, 255, 0.007),
    inset 0 0 0 10rem rgba(255, 255, 255, 0.005);
}

.team-role:last-child {
  border-right: 0;
}

.proof-section {
  transform-origin: center;
}

.proof-stat:last-child {
  border-right: 0;
}

.ownership-section {
  background:
    radial-gradient(
      circle at 50% 46%,
      rgba(255, 255, 255, 0.06),
      transparent 30rem
    ),
    #0e0d0c;
}

.ownership-door-left {
  transform-origin: left;
}

.ownership-door-right {
  transform-origin: right;
}

@media (max-width: 767px) {
  .about-hero {
    min-height: 52rem;
  }

  .belief-section {
    min-height: 120vh;
  }

  .ownership-section {
    min-height: 105vh;
  }

  .team-radar {
    right: -28rem;
    opacity: 0.45;
  }
}

@media (max-width: 899px) {
  .journey-viewport {
    overflow: visible;
  }

  .journey-track {
    flex-direction: column;
  }

  .journey-card {
    width: 100%;
  }
}
</style>
