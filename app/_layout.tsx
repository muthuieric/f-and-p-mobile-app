import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "../global.css"; 
import { tokenCache } from '@/utils/cache';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

const secureStoreTokenCache = {
  async getToken(key: string) {
    try {
      const token = await SecureStore.getItemAsync(key);
      console.log(`[Cache] Get Token for ${key}: ${token ? 'Found' : 'Missing'}`);
      return token;
    } catch (err) {
      console.log(`[Cache] Get Token Error:`, err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
      console.log(`[Cache] Token Saved for ${key}`);
    } catch (err) {
      console.log(`[Cache] Save Token Error:`, err);
      return;
    }
  },
};

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inTabsGroup = segments[0] === '(tabs)';

    console.log("Auth State Changed:", { isSignedIn, inTabsGroup });

    if (isSignedIn && !inTabsGroup) {
      // User is signed in, send to dashboard
      router.replace('/(tabs)');
    } else if (!isSignedIn && inTabsGroup) {
      // User is not signed in but trying to access tabs, send to login
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, isLoaded]);

  // Show spinner while Clerk loads specifically in the Root
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={secureStoreTokenCache}
    >
      <SafeAreaProvider>
        <InitialLayout />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}