import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import React, { useState, useCallback } from 'react'; // Import useCallback
import { useLocalSearchParams, Stack, Link, useRouter, useFocusEffect } from 'expo-router'; // Import useFocusEffect
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, MapPin, User, Phone, CheckCircle, Truck, QrCode, ChevronLeft } from 'lucide-react-native';

// IMPORTANT: Update this to your computer's IP address
const SERVER_URL = "http://192.168.0.16:4000"; 
const API_URL = `${SERVER_URL}/api`;

type Task = {
  id: string;
  trackingNumber: string;
  type: string; 
  destination: string;
  status: string;
  sender: string;
  receiverName: string;
  receiverPhone: string | null;
};

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
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // REPLACED useEffect with useFocusEffect
  // This runs every time the screen comes into focus (e.g., returning from Scanner)
  useFocusEffect(
    useCallback(() => {
        if (!id) return;

        const fetchTask = async () => {
            // Only show loader if we don't have data yet to avoid flashing
            if (!task) setIsLoading(true); 
            setError(null);
            try {
                const response = await fetch(`${API_URL}/shipments/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch task details.');
                }
                const data = await response.json();
                setTask({ ...data, type: data.status === 'Pending' ? 'Pickup' : 'Delivery' });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTask();
    }, [id]) // Dependencies
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
  
  // Determine mode based on FRESH status
  const isPickup = task.status === 'Pending';
  const isDelivered = task.status === 'Delivered';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
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
            <DetailRow icon={isPickup ? Truck : CheckCircle} label="Task Type" value={task.type} />
            <DetailRow icon={MapPin} label="Address / Destination" value={task.destination} />
            <DetailRow icon={User} label="Contact Name" value={task.receiverName} />
            <DetailRow icon={Phone} label="Contact Phone" value={task.receiverPhone} isLast />
        </View>

      </ScrollView>

      {/* Bottom Action Button */}
      {!isDelivered && (
          <View style={styles.footer}>
            <Link 
              href={{
                pathname: "/(tabs)/scanner",
                // Pass the fresh status so the scanner knows what to do next
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
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },

  scrollContent: { padding: 20, paddingBottom: 100 },

  // Status Card
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statusLabel: { fontSize: 13, color: '#64748b', marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' },
  statusValue: { fontSize: 20, fontWeight: '800' },
  statusIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },

  // Info Card
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 10,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastDetailRow: { borderBottomWidth: 0 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' },
  detailValue: { fontSize: 16, fontWeight: '600', color: '#0f172a' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    paddingBottom: 30, // Extra padding for iPhone home indicator
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 18,
    borderRadius: 14,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  scanButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  // Error State
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, color: '#ef4444', marginBottom: 20, textAlign: 'center' },
  backButton: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#f1f5f9', borderRadius: 8 },
  backButtonText: { color: '#475569', fontWeight: '600' }
});