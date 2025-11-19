import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import React, { useState, useCallback } from 'react';
import { useLocalSearchParams, Stack, Link, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, MapPin, User, Phone, CheckCircle, Truck, QrCode, ChevronLeft } from 'lucide-react-native';

import { useShipmentApi } from '@/hooks/useShipmentApi';
import { Shipment } from '@/types';

const DetailRow = ({ icon: Icon, label, value, isLast }: { icon: React.ElementType, label: string, value: string | null, isLast?: boolean }) => (
  <View style={[styles.detailRow, isLast && styles.lastDetailRow]}>
    <View style={styles.iconContainer}>
      <Icon color="#2563eb" size={24} />
    </View>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  </View>
);

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  // Use Hook
  const { getShipmentDetails } = useShipmentApi();

  const [task, setTask] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
        if (!id) return;

        const fetchTask = async () => {
            if (!task) setIsLoading(true); 
            setError(null);
            try {
                const data = await getShipmentDetails(id);
                // Infer Type for UI (Pending = Pickup)
                const type = data.status === 'Pending' ? 'Pickup' : 'Delivery';
                setTask({ ...data, type });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTask();
    }, [id])
  );

  if (isLoading && !task) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (error || !task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Task not found.'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const isPickup = task.status === 'Pending';
  const isDelivered = task.status === 'Delivered';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipment Details</Text>
        <View style={{ width: 40 }} /> 
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={styles.statusCard}>
            <View>
                <Text style={styles.statusLabel}>Current Status</Text>
                <Text style={[styles.statusValue, { color: isDelivered ? '#10b981' : '#2563eb' }]}>
                    {task.status}
                </Text>
            </View>
            <View style={[styles.statusIcon, { backgroundColor: isDelivered ? '#dcfce7' : '#eff6ff' }]}>
                {isDelivered ? <CheckCircle size={28} color="#10b981" /> : <Truck size={28} color="#2563eb" />}
            </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
            <DetailRow icon={Package} label="Tracking Number" value={task.trackingNumber} />
            <DetailRow icon={isPickup ? Truck : CheckCircle} label="Task Type" value={task.type || "Delivery"} />
            <DetailRow icon={MapPin} label="Address / Destination" value={task.destination} />
            <DetailRow icon={User} label="Contact Name" value={task.receiverName || "Unknown"} />
            <DetailRow icon={Phone} label="Contact Phone" value={task.receiverPhone || "N/A"} isLast />
        </View>
      </ScrollView>

      {!isDelivered && (
          <View style={styles.footer}>
            <Link 
              href={{
                pathname: "/(tabs)/scanner",
                params: { shipmentId: task.id, trackingNumber: task.trackingNumber, currentStatus: task.status }
              }} 
              asChild
            >
              <TouchableOpacity style={styles.scanButton}>
                <QrCode size={24} color="white" style={{ marginRight: 10 }} />
                <Text style={styles.scanButtonText}>
                    {isPickup ? "Scan for Pickup" : "Scan for Delivery"}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  statusCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: "#64748b", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  statusLabel: { fontSize: 13, color: '#64748b', marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' },
  statusValue: { fontSize: 20, fontWeight: '800' },
  statusIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: 'white', borderRadius: 16, paddingVertical: 10, shadowColor: "#64748b", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  lastDetailRow: { borderBottomWidth: 0 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' },
  detailValue: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  scanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', paddingVertical: 18, borderRadius: 14, shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  scanButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, color: '#ef4444', marginBottom: 20, textAlign: 'center' },
  backButton: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#f1f5f9', borderRadius: 8 },
  backButtonText: { color: '#475569', fontWeight: '600' }
});