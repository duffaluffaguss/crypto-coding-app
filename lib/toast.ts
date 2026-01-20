// Simple toast utility (replace with proper toast implementation)
export const toast = {
  success: (message: string) => {
    console.log('✅ Success:', message);
    // In a real implementation, this would trigger a toast notification
    // For now, just showing an alert for development
    if (typeof window !== 'undefined') {
      setTimeout(() => alert(`Success: ${message}`), 100);
    }
  },
  error: (message: string) => {
    console.error('❌ Error:', message);
    // In a real implementation, this would trigger a toast notification
    if (typeof window !== 'undefined') {
      setTimeout(() => alert(`Error: ${message}`), 100);
    }
  },
  info: (message: string) => {
    console.log('ℹ️ Info:', message);
  },
};