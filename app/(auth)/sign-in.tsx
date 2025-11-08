import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [emailAddress, setEmailAddress] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Email/Password sign-in
  const onSignInPress = async () => {
    if (!isLoaded) return;
    
    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });
      await setActive({ session: completeSignIn.createdSessionId });
      // The RootLayout will automatically redirect
    } catch (err: any) {
      Alert.alert('Error', err.errors ? err.errors[0].longMessage : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>F & P Courier</Text>
        <Text style={styles.subtitle}>Driver Portal</Text>
        
        {/* Email/Password Form */}
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={emailAddress}
          onChangeText={setEmailAddress}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <View style={styles.buttonContainer}>
           {loading ? <ActivityIndicator color="#fff" /> : <Button title="Login" onPress={onSignInPress} color="#fff" />}
        </View>

        {/* All Google Auth UI has been removed */}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1a202c', textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#718096', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  buttonContainer: { 
    backgroundColor: '#2563eb', 
    borderRadius: 8, 
    paddingVertical: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: 48 
  },
});