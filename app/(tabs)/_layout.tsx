import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { ActivityIndicator, View } from 'react-native';

// This layout controls the main, protected part of the app.
export default function TabsLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Wait until Clerk has loaded its auth state
  if (!isLoaded) {
    // Show a loading spinner while we check for a saved session
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If the user is not signed in, redirect them to the sign-in screen.
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  
  // If the user is signed in, show the main app screens.
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="[id]" options={{ title: 'Task Details' }} />
      <Stack.Screen name="scanner" options={{ title: 'Scan Package' }} />
      <Stack.Screen name="signature" options={{ title: 'Capture Signature' }} />
    </Stack>
  );
}