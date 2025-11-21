import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { tokenCache } from "@/utils/cache"; // <--- IMPORTING YOUR UTILS CACHE

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
  );
}

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inAuthGroup = segments[0] === "(auth)";

    console.log("Auth State Changed:", { isSignedIn, inTabsGroup });

    if (isSignedIn && !inTabsGroup) {
      // User is signed in, send to dashboard
      router.replace("/(tabs)");
    } else if (!isSignedIn) {
      // User is NOT signed in
      // If they are inside the tabs (dashboard), kick them out to sign-in
      if (inTabsGroup) {
        router.replace("/(auth)/sign-in");
      } 
      // If they are nowhere (root), send them to sign-in
      else if (!inAuthGroup) {
        router.replace("/(auth)/sign-in");
      }
    }
  }, [isSignedIn, isLoaded, segments]);

  // 1. Show spinner while Clerk loads
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // 2. CRITICAL FIX: Block Dashboard rendering if not authenticated
  // This prevents the "Network Request Failed" error by ensuring 
  // we never try to fetch data before we have a user.
  const inTabsGroup = segments[0] === "(tabs)";
  if (!isSignedIn && inTabsGroup) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
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
      tokenCache={tokenCache} // Use the imported cache
    >
      <ClerkLoaded>
        <SafeAreaProvider>
          <InitialLayout />
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}