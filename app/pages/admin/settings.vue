<script setup lang="ts">
definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Settings — Admin", robots: "noindex" });

const { user, adminFetch } = useAuth();
const me = ref<{ email: string; name: string | null } | null>(null);

onMounted(async () => {
  try {
    me.value = await adminFetch<{ email: string; name: string | null }>(
      "/api/admin/me",
    );
  } catch {
    /* the layout already guards access */
  }
});
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="font-display text-2xl font-semibold text-white">Settings</h1>
    <p class="mt-1 text-sm text-slate-400">Your admin account and access.</p>

    <div class="glass gradient-border mt-8 rounded-2xl p-6">
      <h2 class="text-sm font-semibold text-white">Signed in as</h2>
      <dl class="mt-4 space-y-3 text-sm">
        <div class="flex justify-between">
          <dt class="text-slate-500">Name</dt>
          <dd class="text-slate-200">{{ me?.name || user?.displayName || "—" }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">Email</dt>
          <dd class="text-slate-200">{{ me?.email || user?.email }}</dd>
        </div>
      </dl>
    </div>

    <div class="glass mt-6 rounded-2xl p-6">
      <h2 class="text-sm font-semibold text-white">Admin access</h2>
      <p class="mt-3 text-sm text-slate-400">
        Admin accounts are controlled by the
        <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-200">
          ADMIN_EMAILS
        </code>
        environment variable (a comma-separated allowlist). To grant or revoke
        access, update that value and redeploy.
      </p>
    </div>
  </div>
</template>
