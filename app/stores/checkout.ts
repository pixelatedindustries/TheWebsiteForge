export const useCheckoutStore = defineStore("checkout", {
  state: () => ({
    loading: false,
    error: null as string | null,
  }),
  actions: {
    setLoading(value: boolean) {
      this.loading = value;
    },
    setError(value: string | null) {
      this.error = value;
    },
  },
});
