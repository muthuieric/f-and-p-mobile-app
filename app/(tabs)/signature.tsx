import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import Button from "@/components/ui/Button";

// IMPORTANT: Make sure this is the correct IP address of your computer.
const SERVER_URL = "http://192.168.0.16:4000"; 
const API_URL = `${SERVER_URL}/api`;

export default function SignatureCaptureScreen() {
  const { shipmentId, trackingNumber } = useLocalSearchParams();
  const router = useRouter();
  const { getToken } = useAuth(); // <--- ADDED: Get the auth hook
  const ref = useRef<SignatureViewRef>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Called when the user clicks "Confirm" inside the canvas
  const handleOK = async (signature: string) => {
    setIsLoading(true);
    try {
      // 1. Get the User Token
      const token = await getToken();
      
      if (!token) {
        throw new Error("Authentication lost. Please login again.");
      }

      // 2. Prepare Base64 (Strip prefix if needed, but ImageKit usually handles it)
      // We'll send it exactly as ImageKit expects it.
      const base64Data = signature.replace('data:image/png;base64,', '');

      // 3. Send to Server WITH Authorization Header
      const response = await fetch(`${API_URL}/shipments/${shipmentId}/signature`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- CRITICAL FIX
        },
        body: JSON.stringify({
          signature: `data:image/png;base64,${base64Data}`, 
          trackingNumber,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload signature.');
      }

      Alert.alert(
          "Delivery Complete!", 
          `Proof of delivery for ${trackingNumber} recorded.`,
          [{ text: "Back to Dashboard", onPress: () => router.replace('/(tabs)') }]
      );

    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Upload Error", error.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const handleConfirm = () => {
    if (ref.current) {
        ref.current.readSignature();
    }
  };

  // Custom CSS for the WebView signature pad to match our theme
  const webStyle = `
    .m-signature-pad { 
        box-shadow: none; 
        border: none; 
        background-color: #f8fafc;
    } 
    .m-signature-pad--body {
        border: 2px dashed #cbd5e1;
        border-radius: 16px;
    }
    .m-signature-pad--footer {
        display: none; margin: 0px;
    }
    body,html { 
        background-color: #f8fafc; 
    }
  `;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Customer Signature</Text>
        <Text style={styles.subtitle}>Please sign below to confirm receipt.</Text>
        <View style={styles.tagContainer}>
            <Ionicons name="cube-outline" size={16} color="#2563eb" />
            <Text style={styles.trackingText}>{trackingNumber}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Uploading Proof of Delivery...</Text>
        </View>
      ) : (
        <>
          <View style={styles.signatureBox}>
            <SignatureScreen
              ref={ref}
              onOK={handleOK}
              webStyle={webStyle}
              backgroundColor="#f8fafc"
              descriptionText="Sign above"
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
                <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.confirmButtonText}>Confirm Delivery</Text>
            </TouchableOpacity>
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
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 12
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trackingText: {
    color: '#2563eb',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14
  },
  signatureBox: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden', // Ensures rounded corners work on the webview
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 16
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white'
  },
  clearButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '700'
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
});