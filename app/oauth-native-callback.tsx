import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';

// This file exists purely to catch the "oauth-native-callback" route
// so that Expo Router doesn't try to match it to the /[id] dynamic route.
// Once this screen mounts, the RootLayout logic will detect the signed-in user
// and redirect them to the Dashboard automatically.

export default function OAuthNativeCallback() {
  // We can simply show a loading spinner or immediately redirect
  // The RootLayout useEffect will usually handle the redirect to /(tabs)
  // faster than this component can render, but having a Redirect here is a safety net.
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}