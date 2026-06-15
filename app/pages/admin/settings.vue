<script setup lang="ts">
definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Settings - Admin", robots: "noindex" });

const { user, adminFetch } = useAuth();
const me = ref<{ email: string; name: string | null } | null>(null);

onMounted(async () => {
  try {
    me.value = await adminFetch<{ email: string; name: string | null }>(
      "/api/admin/me",
    );
  } catch {
    /* The layout already guards access. */
  }
});
</script>

<template>
  <div class="admin-page admin-page--settings max-w-4xl">
    <h1 class="font-display text-2xl font-semibold text-white">Settings</h1>
    <p class="mt-1 text-sm text-slate-400">Your admin account and access.</p>

    <div class="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <div class="glass gradient-border rounded-3xl p-6 sm:p-8">
        <div class="flex items-start gap-5">
          <div
            class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] font-display text-xl font-medium text-white"
          >
            {{
              (me?.name || user?.displayName || user?.email || "A").charAt(0)
            }}
          </div>
          <div class="min-w-0">
            <p
              class="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600"
            >
              Active administrator
            </p>
            <h2
              class="mt-2 truncate font-display text-2xl font-medium tracking-[-0.04em] text-white"
            >
              {{ me?.name || user?.displayName || "Administrator" }}
            </h2>
            <p class="mt-1 truncate text-sm text-zinc-500">
              {{ me?.email || user?.email }}
            </p>
          </div>
        </div>
        <dl class="mt-8 divide-y divide-white/[0.06] text-sm">
          <div class="flex justify-between py-3">
            <dt class="text-zinc-600">Role</dt>
            <dd class="text-zinc-300">Administrator</dd>
          </div>
          <div class="flex justify-between py-3">
            <dt class="text-zinc-600">Access level</dt>
            <dd class="text-zinc-300">Full workspace</dd>
          </div>
          <div class="flex justify-between py-3">
            <dt class="text-zinc-600">Authentication</dt>
            <dd class="flex items-center gap-2 text-emerald-300">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Verified
            </dd>
          </div>
        </dl>
      </div>

      <div class="glass rounded-3xl p-6 sm:p-8">
        <p
          class="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600"
        >
          Security model
        </p>
        <h2
          class="mt-3 font-display text-2xl font-medium tracking-[-0.04em] text-white"
        >
          Allowlist access.
        </h2>
        <p class="mt-4 text-sm leading-6 text-zinc-500">
          Admin accounts are controlled by the
          <code class="rounded px-1.5 py-0.5 text-xs text-zinc-300">
            ADMIN_EMAILS
          </code>
          environment variable. Update the comma-separated allowlist and
          redeploy to grant or revoke access.
        </p>
        <div
          class="mt-8 rounded-2xl border border-white/[0.06] bg-black/20 p-4"
        >
          <p
            class="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-700"
          >
            Current status
          </p>
          <p class="mt-3 text-xs leading-5 text-zinc-400">
            Your signed-in email is present in the active allowlist.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
