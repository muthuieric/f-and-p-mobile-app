import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, MapPin, User, Phone, CheckCircle, Truck, QrCode } from 'lucide-react-native';

const API_URL = "http://192.168.0.16:4000/api";

type Task = {
  id: string;
  trackingNumber: string;
  type: string; // We'll determine this on the client for now
  destination: string;
  status: string;
  sender: string;
  receiverName: string;
  receiverPhone: string | null;
};

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | null }) => (
  <View style={styles.detailRow}>
    <Icon color="#475569" size={20} style={styles.icon} />
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  </View>
);

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchTask = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/shipments/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch task details.');
        }
        const data = await response.json();
        // For now, we'll hardcode the 'type' for the UI. In a real app, this would come from the API.
        setTask({ ...data, type: data.status === 'Pending' ? 'Pickup' : 'Delivery' });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  if (isLoading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator style={{ marginTop: 50 }} size="large" /></SafeAreaView>;
  }

  if (error || !task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}><Text style={{color: 'red'}}>{error || 'Task not found.'}</Text></View>
      </SafeAreaView>
    );
  }
  
  const isPickup = task.type === 'Pickup';

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `Task: ${task.trackingNumber}` }} />
      
      <View style={styles.content}>
        <DetailRow icon={Package} label="Tracking Number" value={task.trackingNumber} />
        <DetailRow icon={isPickup ? Truck : CheckCircle} label="Task Type" value={task.type} />
        <DetailRow icon={MapPin} label="Address / Destination" value={task.destination} />
        <DetailRow icon={User} label="Contact Name" value={task.receiverName} />
        <DetailRow icon={Phone} label="Contact Phone" value={task.receiverPhone} />

        <Link 
          href={{
            pathname: "/(tabs)/scanner",
            params: { shipmentId: task.id, trackingNumber: task.trackingNumber, currentStatus: task.status }
          }} 
          asChild
        >
          <TouchableOpacity style={styles.scanButton}>
            <QrCode size={20} color="white" />
            <Text style={styles.scanButtonText}>{isPickup ? "Scan for Pickup" : "Scan for Delivery"}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  icon: { marginRight: 15 },
  detailLabel: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 30,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  }
});

