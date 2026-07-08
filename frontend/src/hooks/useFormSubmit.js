import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

export default function useFormSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(async (asyncFn, successMessage) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await asyncFn();
      if (successMessage) toast.success(successMessage);
      return { success: true, data: result };
    } catch (err) {
      const msg = err?.message || 'An error occurred.';
      setError(msg);
      toast.error(msg);
      return { success: false, error: msg, code: err?.code };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { isSubmitting, error, handleSubmit, clearError };
}
