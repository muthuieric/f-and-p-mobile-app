import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Text, View, ActivityIndicator } from 'react-native';
import { tokenCache } from '../lib/tokenCache';

// Get your Publishable Key from the .env file
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Custom Token Cache using expo-secure-store
const secureStoreTokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Component to handle automatic routing based on auth state
function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAppGroup = segments[0] === '(tabs)';

    if (isSignedIn && !inAppGroup) {
      router.replace('/(tabs)');
    } else if (!isSignedIn && inAppGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [isLoaded, isSignedIn, segments, router]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  if (!CLERK_PUBLISHABLE_KEY) {
     return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: 'red' }}>
          Clerk Key Missing
        </Text>
        <Text style={{ textAlign: 'center' }}>
          Please create a .env file and add your EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.
        </Text>
      </View>
    )
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={secureStoreTokenCache}
    >
      <InitialLayout />
    </ClerkProvider>
  );
}