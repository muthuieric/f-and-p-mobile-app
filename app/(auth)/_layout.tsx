import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null; // Or a custom loading screen
  }

  if (isSignedIn) {
    return <Redirect href={'/(tabs)'} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}