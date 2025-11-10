import { Text, View, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Button, Alert } from 'react-native';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, MapPin } from 'lucide-react-native';
import { Link } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';

// IMPORTANT: Make sure this is your correct IP or ngrok URL
// Note: This must be the SAME URL as your API server
const SERVER_URL = "http://192.168.0.16:4000";
const API_URL = `${SERVER_URL}/api`;

type Task = {
  id: string;
  trackingNumber: string;
  status: string;
  destination: string;
};

// Reusable component for each item in the task list
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
  const [driverDbId, setDriverDbId] = useState<string | null>(null);

  const { user } = useUser();
  const { signOut } = useAuth();
  
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const socket = useRef<Socket | null>(null); // Ref to hold the socket connection

  // Fetches the list of tasks from the server
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/shipments`);
      if (!response.ok) {
        throw new Error('Failed to connect to the server. Is it running?');
      }
      const data = await response.json();
      setTasks(data);
    } catch (err: any) {
      console.error("Failed to fetch tasks:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to send the location data to our backend API via Socket.IO
  const sendLocationToServer = (location: Location.LocationObject, dbId: string) => {
    // Find an active shipment to notify the customer
    const activeShipment = tasks.find(t => t.status === 'In Transit');
    
    // ALWAYS broadcast the location to the admin map
    if (socket.current && dbId) {
      socket.current.emit('driverLocationUpdate', {
        driverId: dbId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        trackingNumber: activeShipment ? activeShipment.trackingNumber : null // Send tracking# only if active
      });
    }
  };

  // This useEffect runs once when the user logs in
  useEffect(() => {
    if (!user) return; // Wait for Clerk user to be loaded
    const driverEmail = user.primaryEmailAddress?.emailAddress;
    if (!driverEmail) return;

    let subscription: Location.LocationSubscription | null = null;

    const initializeDriver = async () => {
      try {
        // 1. Fetch the driver's database profile using their email
        const response = await fetch(`${API_URL}/drivers/by-email/${driverEmail}`);
        if (!response.ok) {
          throw new Error('Driver profile not found. Have you created it in the Admin Dashboard?');
        }
        const driverProfile = await response.json();
        const dbId = driverProfile.id;
        setDriverDbId(dbId);

        // 2. Connect to the Socket.IO server
        socket.current = io(SERVER_URL);
        socket.current.on('connect', () => {
          console.log('Socket.IO connected!');
          socket.current?.emit('joinDriverRoom', dbId);
        });

        // 3. Get location permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required.');
          return;
        }

        // 4. Start watching the location
        subscription = await Location.watchPositionAsync(
          { 
            accuracy: Location.Accuracy.High, 
            timeInterval: 10000, // Send update every 10 seconds
            distanceInterval: 10 // Or every 10 meters
          },
          (location) => {
            console.log('Mobile App: New location:', location.coords.latitude, location.coords.longitude);
            sendLocationToServer(location, dbId); // Use the correct database ID
          }
        );
        locationSubscription.current = subscription;

      } catch (err: any) {
        Alert.alert("Driver Error", err.message);
        setError(err.message);
      }
    };

    initializeDriver();

    // Cleanup function: This runs when the component is unmounted (e.g., driver signs out)
    return () => {
      if (subscription) subscription.remove();
      if (socket.current) socket.current.disconnect();
      console.log('Location tracking & Socket.IO disconnected.');
    };
  }, [user]); // Re-run this effect if the user changes

  // This useEffect fetches the tasks on initial load.
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
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