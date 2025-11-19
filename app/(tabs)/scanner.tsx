import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, Text, View, Alert, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from "@/components/ui/Button";

import { useShipmentApi } from '@/hooks/useShipmentApi';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use Hook
  const { updateStatus } = useShipmentApi();
  
  const { shipmentId, trackingNumber, currentStatus } = useLocalSearchParams<{ shipmentId: string, trackingNumber: string, currentStatus: string }>();
  const router = useRouter();

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <View style={styles.iconCircle}>
            <Ionicons name="camera" size={40} color="#2563eb" />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            We need permission to access your camera to scan tracking barcodes.
          </Text>
          <Button onPress={requestPermission} title="Grant Permission" />
        </View>
      </SafeAreaView>
    );
  }
  
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    if (data !== trackingNumber) {
      Alert.alert(
        'Wrong Package', 
        `Expected: ${trackingNumber}\nScanned: ${data}`,
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
      return;
    }

    setIsLoading(true);

    // Logic moved to frontend state determination, api update stays generic
    let nextStatus = '';
    if (currentStatus === 'Pending') nextStatus = 'In Transit';
    else if (currentStatus === 'In Transit') nextStatus = 'Delivered';
    else {
      Alert.alert('Status Info', `This package is already ${currentStatus}.`);
      setIsLoading(false);
      router.back();
      return;
    }

    try {
      // Clean API Call
      await updateStatus(shipmentId, nextStatus);

      if (nextStatus === 'Delivered') {
        router.replace({ 
            pathname: '/(tabs)/signature', 
            params: { shipmentId, trackingNumber } 
        });
      } else {
        Alert.alert(
            'Success', 
            `Package ${trackingNumber} picked up!`,
            [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unknown error occurred.');
      setScanned(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Scan ${trackingNumber}`, headerBackTitle: 'Back' }} />
      
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr", "code128"] }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
        </View>
        <Text style={styles.instructionText}>Align code within frame</Text>
      </View>

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
  container: { flex: 1, backgroundColor: 'black' },
  permissionContainer: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 20 },
  permissionContent: { alignItems: 'center', padding: 24, backgroundColor: 'white', borderRadius: 16 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  permissionTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  permissionText: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 250, height: 250, position: 'relative' },
  instructionText: { color: 'white', marginTop: 20, fontSize: 16, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#2563eb' },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#2563eb' },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#2563eb' },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#2563eb' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', marginTop: 16, fontSize: 18, fontWeight: '600' }
});