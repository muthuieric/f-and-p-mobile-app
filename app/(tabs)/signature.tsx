import React, { useRef, useState } from 'react';
import { View, StyleSheet, Button, Text, Alert, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { SafeAreaView } from 'react-native-safe-area-context';

// IMPORTANT: Make sure this is the correct IP address of your computer.
const API_URL = "http://192.168.0.16:4000/api";

export default function SignatureCaptureScreen() {
  const { shipmentId, trackingNumber } = useLocalSearchParams();
  const router = useRouter();
  const ref = useRef<SignatureViewRef>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Called when the user clicks "Confirm"
  const handleOK = async (signature: string) => {
    setIsLoading(true);
    try {
      // The signature from the canvas is already a base64 string, but it includes a prefix.
      // We need to send just the data part.
      const base64Data = signature.replace('data:image/png;base64,', '');

      const response = await fetch(`${API_URL}/shipments/${shipmentId}/signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: `data:image/png;base64,${base64Data}`, // Re-add prefix for ImageKit
          trackingNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload signature.');
      }

      Alert.alert("Signature Saved!", `Proof of delivery for ${trackingNumber} has been uploaded.`);
      // Navigate back to the main dashboard after success
      router.replace('/(tabs)');

    } catch (error: any) {
      Alert.alert("Upload Error", error.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Called when the user clicks "Clear"
  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const handleConfirm = () => {
    if (ref.current) {
        ref.current.readSignature();
    }
  };

  // CSS to hide the default footer of the signature canvas
  const style = `.m-signature-pad--footer {display: none; margin: 0px;}`;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Capture Signature' }} />
      <View style={styles.header}>
        <Text style={styles.title}>Proof of Delivery</Text>
        <Text style={styles.subtitle}>Please have the receiver sign below for {trackingNumber}.</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Uploading Signature...</Text>
        </View>
      ) : (
        <>
          <View style={styles.signatureBox}>
            <SignatureScreen
              ref={ref}
              onOK={handleOK}
              descriptionText=""
              webStyle={style}
              backgroundColor="rgba(255, 255, 255, 1)"
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Clear" onPress={handleClear} color="#ef4444" />
            <Button title="Confirm Signature" onPress={handleConfirm} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    marginTop: 5,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    margin: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'gray',
  },
});

