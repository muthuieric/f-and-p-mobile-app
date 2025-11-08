import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, View, Alert, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

// IMPORTANT: Make sure this is the correct IP address of your computer.
const API_URL = "http://192.168.0.16:4000/api";

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { shipmentId, trackingNumber, currentStatus } = useLocalSearchParams();
  const router = useRouter();

  if (!permission) { return <View />; }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }
  
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setIsLoading(true);

    if (data !== trackingNumber) {
      Alert.alert('Scan Error', `Incorrect package scanned. Expected ${trackingNumber}, but scanned ${data}.`);
      setIsLoading(false);
      setScanned(false);
      return;
    }

    let nextStatus = '';
    if (currentStatus === 'Pending') {
      nextStatus = 'In Transit';
    } else if (currentStatus === 'In Transit') {
      nextStatus = 'Delivered';
    } else {
      Alert.alert('Status Info', `This package is already marked as "${currentStatus}".`);
      setIsLoading(false);
      router.back();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update shipment status on the server.');
      }

      if (nextStatus === 'Delivered') {
        // --- THIS IS THE FIX ---
        // We now pass both the shipmentId and the trackingNumber to the signature screen.
        router.replace({ pathname: '/(tabs)/signature', params: { shipmentId, trackingNumber } });
      } else {
        Alert.alert('Scan Successful', `Shipment ${trackingNumber} is now marked as "${nextStatus}".`);
        router.back();
      }

    } catch (error: any) {
      Alert.alert('API Error', error.message || 'An unknown error occurred.');
      setScanned(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Scanning for ${trackingNumber}` }} />
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "code128"],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Updating Status...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', marginTop: 10, fontSize: 16 }
});

