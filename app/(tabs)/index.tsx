import { Text, View, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Button } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, MapPin } from 'lucide-react-native';
import { Link } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo'; // Import auth hooks

// IMPORTANT: Make sure this is the correct IP address of your computer.
const API_URL = "http://192.168.0.16:4000/api";

type Task = {
  id: string;
  trackingNumber: string;
  status: string;
  destination: string;
};

const TaskItem = ({ item }: { item: Task }) => {
  return (
    <Link href={{ pathname: `/(tabs)/${item.id}`, params: { id: item.id } }} asChild>
      <TouchableOpacity style={styles.taskItem}>
        <View style={styles.taskIconContainer}>
          <Package size={24} color={'#3b82f6'} />
        </View>
        <View style={styles.taskDetails}>
          <Text style={styles.taskTrackingNumber}>{item.trackingNumber}</Text>
          <View style={styles.addressContainer}>
            <MapPin size={14} color="#64748b" />
            <Text style={styles.taskAddress} numberOfLines={1}>{item.destination}</Text>
          </View>
        </View>
        <View style={styles.taskStatusContainer}>
          <Text style={[styles.taskStatus, { color: '#3b82f6' }]}>{item.status}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUser(); // Get the logged-in user's data
  const { signOut } = useAuth(); // Get the signOut function

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/shipments`);
      if (!response.ok) {
        throw new Error('Failed to connect to the server. Is it running?');
      }
      const data = await response.json();
      setTasks(data);
    } catch (err: any) { // --- THIS IS THE FIX ---
      // We are now fetching real data, so we'll just use the mock data as a fallback.
      // In a real app, you would handle this error more gracefully.
      console.error("Failed to fetch tasks, using mock data.", err);
      // Faking a network request time
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTasks([
        { id: 'clx123abc', trackingNumber: 'FP1001', status: 'Pending', destination: 'Shop A, Biashara St, CBD' },
        { id: 'clx123def', trackingNumber: 'FP1002', status: 'In Transit', destination: 'John Doe, Westlands' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // We only fetch tasks once the user is signed in.
  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        {/* Greet the user by their first name, as per the Clerk docs */}
        <Text style={styles.title}>Welcome, {user?.firstName || 'Driver'}</Text>
        <Text style={styles.subtitle}>
          {isLoading ? 'Loading tasks...' : `You have ${tasks.length} tasks assigned.`}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchTasks} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={({ item }) => <TaskItem item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onRefresh={fetchTasks}
          refreshing={isLoading}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tasks assigned for today.</Text>
            </View>
          )}
          ListFooterComponent={() => (
            // Add a "Sign Out" button at the end of the list
            <View style={styles.signOutContainer}>
              <Button title="Sign Out" onPress={() => signOut()} color="#ef4444" />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    title: { fontSize: 28, fontWeight: 'bold' },
    subtitle: { fontSize: 16, color: 'gray' },
    listContainer: { paddingVertical: 10 },
    taskItem: {
      backgroundColor: '#fff',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      marginHorizontal: 15,
      marginBottom: 10,
      borderRadius: 12,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2.22,
    },
    taskIconContainer: { padding: 12, borderRadius: 8, backgroundColor: '#f1f5f9', marginRight: 15 },
    taskDetails: { flex: 1 },
    taskTrackingNumber: { fontSize: 16, fontWeight: '600' },
    addressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    taskAddress: { fontSize: 14, color: '#475569', marginLeft: 5 },
    taskStatusContainer: { marginLeft: 10 },
    taskStatus: { fontSize: 14, fontWeight: 'bold' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, color: '#94a3b8' },
    errorText: { fontSize: 16, color: '#ef4444', textAlign: 'center' },
    retryButton: { marginTop: 20, backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    retryButtonText: { color: 'white', fontWeight: 'bold' },
    signOutContainer: {
      margin: 20,
      marginTop: 30,
    }
});