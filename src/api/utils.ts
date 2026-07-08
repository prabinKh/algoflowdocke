export const handleApiError = (error: unknown) => {
  console.error("API Error:", error);
  // You can add more sophisticated error handling here, 
  // like showing a toast or redirecting to login if it's a 401
};
