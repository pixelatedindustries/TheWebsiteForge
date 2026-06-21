export const useCheckoutStore = defineStore("checkout", () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  function setLoading(value: boolean) {
    loading.value = value;
  }
  function setError(value: string | null) {
    error.value = value;
  }

  return { loading, error, setLoading, setError };
});
