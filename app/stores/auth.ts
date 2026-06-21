import type { AuthUser } from "~/types/auth";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AuthUser | null>(null);
  const ready = ref(false);
  const configured = ref(false);

  function setUser(value: AuthUser | null) {
    user.value = value;
  }
  function setReady(value: boolean) {
    ready.value = value;
  }
  function setConfigured(value: boolean) {
    configured.value = value;
  }
  function clearUser() {
    user.value = null;
  }

  return {
    user,
    ready,
    configured,
    setUser,
    setReady,
    setConfigured,
    clearUser,
  };
});
