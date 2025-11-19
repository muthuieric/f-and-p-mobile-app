import * as SecureStore from 'expo-secure-store';

// This helper object is used by ClerkProvider to securely store JWTs
export const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      // Set the token with a secure option if available (Platform.OS === 'ios')
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      // Handle error if SecureStore fails
      console.error("Failed to save token to SecureStore:", err);
      return;
    }
  },
};