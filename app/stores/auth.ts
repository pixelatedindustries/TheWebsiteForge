import type { AuthUser } from "~/types/auth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as AuthUser | null,
    ready: false,
    configured: false,
  }),
  actions: {
    setUser(user: AuthUser | null) {
      this.user = user;
    },
    setReady(value: boolean) {
      this.ready = value;
    },
    setConfigured(value: boolean) {
      this.configured = value;
    },
    clearUser() {
      this.user = null;
    },
  },
});
