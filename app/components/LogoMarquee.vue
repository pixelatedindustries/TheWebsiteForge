<script setup lang="ts">
import type { TechStackItem } from "~/types/tech-stack";

const techStack: TechStackItem[] = [
  { name: "HTML5", icon: "html", color: "#e44d26" },
  { name: "CSS3", icon: "css", color: "#1572b6" },
  { name: "Tailwind CSS", icon: "tailwind", color: "#38bdf8" },
  { name: "Tailwind 4", icon: "tailwind", color: "#34d8a6" },
  { name: "Nuxt", icon: "nuxt", color: "#00dc82" },
  { name: "Vue", icon: "vue", color: "#42b883" },
  { name: "TypeScript", icon: "typescript", color: "#3178c6" },
  { name: "C#", icon: "csharp", color: "#9b4fdb" },
  { name: "Java", icon: "java", color: "#f89820" },
  { name: "Python", icon: "python", color: "#ffd43b" },
  { name: "XML", icon: "xml", color: "#f97316" },
  { name: "ASP.NET", icon: "aspnet", color: "#7c3aed" },
  { name: "Node.js", icon: "node", color: "#68a063" },
  { name: "SQL", icon: "sql", color: "#38bdf8" },
  { name: "Git", icon: "git", color: "#f05032" },
  { name: "Azure", icon: "azure", color: "#0078d4" },
];

// duplicated once so the -50% marquee loops seamlessly
const row = [...techStack, ...techStack];
</script>

<template>
  <section class="pt-20 pb-10 lg:pt-28">
    <p
      v-reveal="{ y: 12, duration: 0.6 }"
      class="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-slate-500"
    >
      Tech stack we build with
    </p>
    <div
      class="tech-marquee relative"
      style="
        mask-image: linear-gradient(
          to right,
          transparent,
          #000 12%,
          #000 88%,
          transparent
        );
      "
    >
      <div class="flex w-max animate-marquee items-center gap-4 py-2 pr-4">
        <span
          v-for="(tech, i) in row"
          :key="`${tech.name}-${i}`"
          class="tech-chip group"
          :style="`--tech:${tech.color}`"
        >
          <span class="tech-icon" aria-hidden="true">
            <svg v-if="tech.icon === 'html'" viewBox="0 0 32 32" fill="none">
              <path
                d="M6 3h20l-1.8 22.2L16 29l-8.2-3.8L6 3Z"
                fill="currentColor"
              />
              <path
                d="M16 5v21l5.4-2.5L22.8 7H16Z"
                fill="white"
                opacity=".18"
              />
              <path
                d="M11 9h10l-.2 3H14l.2 2h6.4l-.6 7-4 1.8-4-1.8-.3-3h3l.1 1.1 1.2.5 1.2-.5.2-2.1h-5.9L11 9Z"
                fill="#fff"
              />
            </svg>

            <svg
              v-else-if="tech.icon === 'css'"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M6 3h20l-1.8 22.2L16 29l-8.2-3.8L6 3Z"
                fill="currentColor"
              />
              <path
                d="M16 5v21l5.4-2.5L22.8 7H16Z"
                fill="white"
                opacity=".18"
              />
              <path
                d="M11 9h10l-.2 3h-6.9l-.2 2h6.9l-.6 7-4 1.8-4-1.8-.3-3h3l.1 1.1 1.2.5 1.2-.5.2-2.1h-5.9L11 9Z"
                fill="#fff"
              />
            </svg>

            <svg
              v-else-if="tech.icon === 'tailwind'"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M9.5 13.2c1.1-4.4 3.9-6.6 8.4-6.6 2.7 0 4.8 1 6.3 3 1 .9 1.8 1.4 2.6 1.4 1.1 0 2-.7 2.7-2.1-1.1 4.4-3.9 6.6-8.4 6.6-2.7 0-4.8-1-6.3-3-1-.9-1.8-1.4-2.6-1.4-1.1 0-2 .7-2.7 2.1Zm-7 9.6c1.1-4.4 3.9-6.6 8.4-6.6 2.7 0 4.8 1 6.3 3 1 .9 1.8 1.4 2.6 1.4 1.1 0 2-.7 2.7-2.1-1.1 4.4-3.9 6.6-8.4 6.6-2.7 0-4.8-1-6.3-3-1-.9-1.8-1.4-2.6-1.4-1.1 0-2 .7-2.7 2.1Z"
                fill="currentColor"
              />
            </svg>

            <svg
              v-else-if="tech.icon === 'nuxt'"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path d="M12.2 6.5 2.8 23.2h18.8L12.2 6.5Z" fill="currentColor" />
              <path
                d="M20 10.8 12.8 23.2h14.4L20 10.8Z"
                fill="white"
                opacity=".7"
              />
            </svg>

            <svg
              v-else-if="tech.icon === 'vue'"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M2.5 6h7L16 17.2 22.5 6h7L16 29 2.5 6Z"
                fill="currentColor"
              />
              <path
                d="M9.5 6h4L16 10.2 18.5 6h4L16 17.2 9.5 6Z"
                fill="#fff"
                opacity=".75"
              />
            </svg>

            <svg
              v-else-if="tech.icon === 'typescript'"
              viewBox="0 0 32 32"
              fill="none"
            >
              <rect
                x="4"
                y="4"
                width="24"
                height="24"
                rx="3"
                fill="currentColor"
              />
              <path
                d="M9 13h11v3h-4v10h-3V16H9v-3Zm12.3 12.5v-3.2c.7.6 1.6.9 2.6.9.8 0 1.2-.2 1.2-.7 0-.3-.2-.5-.6-.7l-1.3-.5c-1.3-.5-2-1.4-2-2.8 0-1 .4-1.8 1.2-2.3.8-.6 1.8-.8 3-.8.9 0 1.7.1 2.3.4v3c-.6-.4-1.3-.6-2.1-.6-.7 0-1.1.2-1.1.7 0 .3.2.5.7.7l1.1.4c1.5.6 2.2 1.5 2.2 2.8 0 1-.4 1.8-1.1 2.4-.8.6-1.9.9-3.3.9-1.1 0-2-.2-2.8-.6Z"
                fill="#fff"
              />
            </svg>

            <svg
              v-else-if="tech.icon === 'csharp'"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M16 2.8 27.4 9.4v13.2L16 29.2 4.6 22.6V9.4L16 2.8Z"
                fill="currentColor"
              />
              <path
                d="M16.3 21.5c-3.5 0-6-2.4-6-5.6s2.6-5.6 6-5.6c1.9 0 3.3.6 4.4 1.8l-1.9 2c-.6-.7-1.4-1-2.3-1-1.8 0-3 1.2-3 2.8s1.2 2.8 3 2.8c.9 0 1.7-.3 2.3-1l1.9 2c-1 1.2-2.5 1.8-4.4 1.8Zm6.2-7.4h1.2l.2-1.6h1.4l-.2 1.6h1.1v1.3h-1.3l-.2 1.2H26v1.3h-1.4l-.2 1.6H23l.2-1.6H22l-.2 1.6h-1.4l.2-1.6h-1.1v-1.3h1.3l.2-1.2h-1.1v-1.3h1.3l.2-1.6h1.4l-.2 1.6Zm-.3 2.5h1.2l.2-1.2h-1.2l-.2 1.2Z"
                fill="#fff"
              />
            </svg>

            <svg
              v-else-if="tech.icon === 'java'"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M12.5 23.5c-4 .4-7.1-.2-7.1-1.4 0-.8 1.5-1.6 3.8-2"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M20.4 21.5c2.3.5 3.7 1.3 3.7 2.2 0 1.5-4.1 2.7-9.1 2.7s-9.1-1.2-9.1-2.7"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M14.5 17c-2.2-2.4 4.8-3.8.8-7.6M18.5 17c-2.2-2.4 4.8-3.8.8-7.6M16.7 2.8c1.7 2.4-4.1 4.2-1.2 6.5"
                stroke="#fff"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path d="M10 18h12l-1.4 4.8H11.4L10 18Z" fill="currentColor" />
            </svg>

            <svg
              v-else-if="tech.icon === 'python'"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M15.7 3.5c-4.5 0-6 1.2-6 4.3v3.1h6.7v1.5H7.8c-3 0-5.3 1.8-5.3 5.5 0 3.5 1.9 5.6 5.2 5.6h3.1v-4.3c0-3.2 1.8-5.1 5-5.1h5.9c2.8 0 4.4-1.6 4.4-4.4V7.8c0-3-2.1-4.3-6-4.3h-4.4Z"
                fill="currentColor"
              />
              <path
                d="M16.3 28.5c4.5 0 6-1.2 6-4.3v-3.1h-6.7v-1.5h8.6c3 0 5.3-1.8 5.3-5.5 0-3.5-1.9-5.6-5.2-5.6h-3.1v4.3c0 3.2-1.8 5.1-5 5.1h-5.9c-2.8 0-4.4 1.6-4.4 4.4v1.9c0 3 2.1 4.3 6 4.3h4.4Z"
                fill="#3675a9"
              />
              <circle cx="12.2" cy="7.3" r="1.1" fill="#fff" />
              <circle cx="19.8" cy="24.7" r="1.1" fill="#fff" />
            </svg>

            <svg
              v-else-if="tech.icon === 'xml'"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M12.5 9 5 16l7.5 7M19.5 9 27 16l-7.5 7"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="m18 6-4 20"
                stroke="#fff"
                stroke-width="2.5"
                stroke-linecap="round"
                opacity=".75"
              />
            </svg>

            <svg
              v-else-if="tech.icon === 'aspnet'"
              viewBox="0 0 32 32"
              fill="none"
            >
              <circle cx="16" cy="16" r="12" fill="currentColor" />
              <path
                d="M7.5 18.8h3.1v2.9H7.5v-2.9Zm5.5 2.9V10.3h3l4.2 6.8v-6.8h3.2v11.4h-3l-4.2-6.8v6.8H13Z"
                fill="#fff"
              />
            </svg>

            <svg
              v-else-if="tech.icon === 'node'"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M16 2.8 27.4 9.4v13.2L16 29.2 4.6 22.6V9.4L16 2.8Z"
                fill="currentColor"
              />
              <path
                d="M10 21.8V10.2h3l4.5 6.8v-6.8H21v11.6h-3l-4.5-6.8v6.8H10Z"
                fill="#fff"
              />
            </svg>

            <svg
              v-else-if="tech.icon === 'sql'"
              viewBox="0 0 32 32"
              fill="none"
            >
              <ellipse cx="16" cy="7.5" rx="10" ry="4.5" fill="currentColor" />
              <path
                d="M6 7.5v17c0 2.5 4.5 4.5 10 4.5s10-2 10-4.5v-17"
                stroke="currentColor"
                stroke-width="2"
              />
              <path
                d="M6 15c0 2.5 4.5 4.5 10 4.5s10-2 10-4.5M6 22c0 2.5 4.5 4.5 10 4.5s10-2 10-4.5"
                stroke="#fff"
                stroke-width="1.7"
                opacity=".8"
              />
            </svg>

            <svg
              v-else-if="tech.icon === 'git'"
              viewBox="0 0 32 32"
              fill="none"
            >
              <rect
                x="7"
                y="7"
                width="18"
                height="18"
                rx="3"
                transform="rotate(45 16 16)"
                fill="currentColor"
              />
              <path
                d="M12 10.5v7.2M12 12.5h5.8M17.8 12.5l3.5 3.5"
                stroke="#fff"
                stroke-width="2"
                stroke-linecap="round"
              />
              <circle cx="12" cy="10.5" r="2" fill="#fff" />
              <circle cx="12" cy="20.2" r="2" fill="#fff" />
              <circle cx="21.3" cy="16" r="2" fill="#fff" />
            </svg>

            <svg v-else viewBox="0 0 32 32" fill="none">
              <path
                d="M17.8 3 6.2 25.6h10.4l1.6-4.6h-5.3l5-9.4 6.7 17.4h4.9L21.4 3h-3.6Z"
                fill="currentColor"
              />
              <path
                d="M9 25.6 22 8.8l-4.1 12.2-1.6 4.6H9Z"
                fill="#fff"
                opacity=".28"
              />
            </svg>
          </span>
          <span
            class="select-none whitespace-nowrap font-display text-base font-semibold text-slate-300 transition group-hover:text-white sm:text-lg"
          >
            {{ tech.name }}
          </span>
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tech-marquee {
  overflow-x: hidden;
  overflow-y: visible;
}

.tech-chip {
  align-items: center;
  background:
    radial-gradient(
      circle at 18% 18%,
      color-mix(in srgb, var(--tech) 18%, transparent),
      transparent 48%
    ),
    rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: inline-flex;
  gap: 0.65rem;
  padding: 0.55rem 1rem 0.55rem 0.65rem;
  transition:
    border-color 0.25s ease,
    background 0.25s ease,
    transform 0.25s ease;
}

.tech-chip:hover {
  background:
    radial-gradient(
      circle at 18% 18%,
      color-mix(in srgb, var(--tech) 28%, transparent),
      transparent 52%
    ),
    rgba(255, 255, 255, 0.07);
  border-color: color-mix(in srgb, var(--tech) 45%, rgba(255, 255, 255, 0.12));
  transform: translateY(-2px);
}

.tech-icon {
  color: var(--tech);
  display: grid;
  height: 2rem;
  place-items: center;
  width: 2rem;
}

.tech-icon svg {
  display: block;
  height: 1.65rem;
  width: 1.65rem;
}
</style>
