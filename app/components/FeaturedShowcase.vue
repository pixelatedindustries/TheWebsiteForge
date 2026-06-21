<script setup lang="ts">
import { projects } from "~~/shared/site";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollVelocity } from "~/plugins/motion";

const featured = projects.slice(0, 4);

// Let the pinned horizontal track lay out before recalculating ScrollTrigger
// positions, so the pin distance measures correctly on first paint.
const SCROLL_REFRESH_DELAY_MS = 120;

const section = ref<HTMLElement | null>(null);
const track = ref<HTMLElement | null>(null);
const progress = ref<HTMLElement | null>(null);

let mounted = false;
let mm: gsap.MatchMedia | null = null;

const isExternal = (url?: string) => !!url && /^https?:\/\//.test(url);
const linkAttrs = (url?: string) =>
  isExternal(url)
    ? { href: url, target: "_blank", rel: "noopener noreferrer" }
    : { href: url || "/showcase" };

onBeforeUnmount(() => {
  mounted = false;
  mm?.revert();
});

onMounted(() => {
  mounted = true;

  const setup = () => {
    if (!mounted || mm) return;
    mm = gsap.matchMedia();
    mm.add(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      () => {
        const sec = section.value;
        const tr = track.value;
        if (!sec || !tr) return;

        const distance = () => Math.max(0, tr.scrollWidth - window.innerWidth);
        gsap.set(tr, { willChange: "transform" });
        const tween = gsap.to(tr, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: sec,
            start: "center center",
            end: () => "+=" + distance(),
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) =>
              progress.value &&
              gsap.set(progress.value, { scaleX: self.progress }),
          },
        });

        const skewTo = gsap.quickTo(tr, "skewX", {
          duration: 1.1,
          ease: "power3.out",
        });
        const skewTick = () =>
          skewTo(gsap.utils.clamp(-5, 5, scrollVelocity() * 0.12));
        gsap.ticker.add(skewTick);

        return () => {
          gsap.ticker.remove(skewTick);
          tween.kill();
          gsap.set(tr, { willChange: "auto", skewX: 0 });
        };
      },
    );
  };

  requestAnimationFrame(() => {
    setup();
    setTimeout(() => ScrollTrigger.refresh(true), SCROLL_REFRESH_DELAY_MS);
  });
});
</script>

<template>
  <section
    ref="section"
    class="relative hidden h-screen overflow-hidden lg:block"
  >
    <div class="flex h-full items-center">
      <div ref="track" class="flex h-full items-center gap-8 pr-[12vw]">
        <div
          class="flex h-full w-[40vw] shrink-0 flex-col justify-center pr-[5vw] pl-[8vw]"
        >
          <p
            class="mb-8 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.4em] text-slate-500"
          >
            <span class="h-px w-12 bg-slate-700" />
            Selected work
          </p>
          <h2
            class="font-serif text-[clamp(2.5rem,5.5vw,5rem)] font-light leading-[1.04] tracking-[-0.01em] text-[#ece9e2]"
          >
            The <span class="italic text-brand-300">work</span>
          </h2>
          <NuxtLink
            to="/showcase"
            class="btn-line mt-12 inline-flex w-fit items-center gap-3 px-7 py-3.5 text-xs font-medium uppercase tracking-[0.2em]"
          >
            View all
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </NuxtLink>
        </div>

        <a
          v-for="(project, i) in featured"
          :key="project.id"
          v-bind="linkAttrs(project.url)"
          class="work-frame group relative block h-[68vh] w-[44vw] shrink-0 overflow-hidden rounded-[1.75rem] border border-white/10"
        >
          <ProjectIdentityVisual :name="project.name" :index="i" />
          <div
            class="absolute inset-0 flex flex-col justify-between p-10"
            style="
              background: linear-gradient(
                to top,
                rgba(14, 13, 12, 0.72),
                transparent 32%,
                rgba(14, 13, 12, 0.2)
              );
            "
          >
            <div
              class="flex items-center justify-between font-mono text-xs uppercase tracking-[0.3em] text-[#ece9e2]/70"
            >
              <span>0{{ i + 1 }}</span>
              <span class="flex items-center gap-2">
                {{ project.category }}
                <svg
                  class="opacity-50 transition duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </span>
            </div>
            <div class="flex items-end justify-between gap-6">
              <p
                class="font-mono text-xs uppercase tracking-[0.25em] text-slate-400"
              >
                {{ project.metric }} — {{ project.metricLabel }}
              </p>
              <span
                class="work-open-label font-mono text-[0.55rem] uppercase tracking-[0.28em] text-white/35"
              >
                Open project
              </span>
            </div>
          </div>
        </a>
      </div>
    </div>

    <div class="absolute inset-x-[8vw] bottom-8 h-px bg-white/10">
      <div ref="progress" class="h-full origin-left scale-x-0 bg-brand-300" />
    </div>
  </section>

  <section class="px-6 py-24 sm:px-10 lg:hidden">
    <p
      class="mb-8 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.4em] text-slate-500"
    >
      <span class="h-px w-12 bg-slate-700" />
      Selected work
    </p>
    <h2
      class="font-serif text-[clamp(2.5rem,12vw,4rem)] font-light leading-[1.05] tracking-tight text-[#ece9e2]"
    >
      The <span class="italic text-brand-300">work</span>
    </h2>

    <div
      v-reveal:stagger="{ selector: '.m-frame', stagger: 0.12 }"
      class="mt-12 space-y-5"
    >
      <a
        v-for="(project, i) in featured"
        :key="project.id"
        v-bind="linkAttrs(project.url)"
        class="m-frame group relative block aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/10"
      >
        <ProjectIdentityVisual :name="project.name" :index="i" />
        <div
          class="absolute inset-0 flex flex-col justify-between p-7"
          style="
            background: linear-gradient(
              to top,
              rgba(14, 13, 12, 0.72),
              transparent 38%,
              rgba(14, 13, 12, 0.2)
            );
          "
        >
          <div
            class="flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[#ece9e2]/70"
          >
            <span>0{{ i + 1 }}</span>
            <span class="flex items-center gap-2">
              {{ project.category }}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </span>
          </div>
          <p
            class="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-slate-400"
          >
            {{ project.metric }} — {{ project.metricLabel }}
          </p>
        </div>
      </a>
    </div>
  </section>
</template>

<style scoped>
.work-frame,
.m-frame {
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0);
  transition:
    transform 1.5s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 1.2s ease,
    box-shadow 1.8s ease;
}

.work-frame > div:last-child,
.m-frame > div:last-child {
  transition: background-color 1.5s ease;
}

.work-frame:hover,
.m-frame:hover {
  transform: translateY(-0.45rem);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 36px 100px rgba(0, 0, 0, 0.34);
}

.work-open-label {
  opacity: 0.55;
  transform: translateY(0.35rem);
  transition:
    opacity 1.2s ease 0.12s,
    transform 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.12s;
}

.work-frame:hover .work-open-label {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .work-frame,
  .m-frame,
  .work-open-label {
    transition: none;
  }

  .work-frame:hover,
  .m-frame:hover {
    transform: none;
  }
}
</style>
