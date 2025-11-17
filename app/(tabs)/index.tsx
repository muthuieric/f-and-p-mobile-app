import { Text, View, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Button, Alert } from 'react-native';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, MapPin } from 'lucide-react-native';
import { Link } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';

// IMPORTANT: Use the correct, working IP you found
const SERVER_URL = "http://192.168.0.16:4000"; 
const API_URL = `${SERVER_URL}/api`;

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
  const [driverDbId, setDriverDbId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false); // Controls single execution

  const { user } = useUser();
  const { signOut, getToken } = useAuth();
  
  // Refs for persistent connections and state safety
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const socket = useRef<Socket | null>(null); 
  const tasksRef = useRef<Task[]>([]); 
  const isMounted = useRef(true); 

  // Effect 1: Always keep the tasksRef up-to-date with the latest tasks state
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);


  // 2. Data Fetching Logic (Triggers on User Load)
  const fetchTasks = useCallback(async () => {
    // Only set loading true if it's the very first time
    if (!isInitialized) setIsLoading(true);
    setError(null);
    
    const token = await getToken(); 
    if (!token) {
      if (isMounted.current) {
        setError("Authentication token not found. Please sign in again.");
        setIsLoading(false);
      }
      return;
    }

    try {
      const response = await fetch(`${API_URL}/drivers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: `HTTP Status ${response.status} Error.` }));
        throw new Error(errorBody.error || `Server rejected request. Status: ${response.status}.`);
      }
      
      const data = await response.json();
      const fetchedDriverId = response.headers.get('X-Driver-ID'); 
      
      if (isMounted.current) { 
        if (fetchedDriverId) {
            setDriverDbId(fetchedDriverId); 
        }
        setTasks(data.tasks || data); 
      }
      
    } catch (err: any) {
      if (isMounted.current) {
        if (err.message.includes("Network")) {
          setError(`Network Connection Failed. Confirm server is running at ${SERVER_URL}.`);
        } else {
          setError(err.message);
        }
        console.error("Failed to fetch tasks securely:", err);
      }
    } finally {
      if (isMounted.current) {
         setIsLoading(false);
         // Mark initialization as complete ONLY AFTER data is received
         setIsInitialized(true); 
      }
    }
  }, [getToken, isInitialized]); 

  // Effect runs on user login, and manages mount status
  useEffect(() => {
    // We want to run fetchTasks only once when the user object becomes available
    if (user && !isInitialized) { 
        fetchTasks();
    }
    
    // Cleanup runs on component unmount
    return () => {
        isMounted.current = false; // Prevents state updates after cleanup
    };
  }, [user, isInitialized, fetchTasks]); // isInitialized is critical here

  // 3. Socket/Location Initialization 
  // FIX: This useEffect now only depends on the two flags that confirm successful setup
  useEffect(() => {
    if (!driverDbId || !isInitialized) return; 

    // Ensure we only connect and watch once per successful initialization cycle
    if (socket.current || locationSubscription.current) return;

    // --- Stable function defined inside the effect closure ---
    const sendLocationToServer = (location: Location.LocationObject, dbId: string) => {
        const activeShipment = tasksRef.current.find(t => t.status === 'In Transit'); 
        
        if (socket.current && dbId) {
            socket.current.emit('driverLocationUpdate', {
                driverId: dbId,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                trackingNumber: activeShipment ? activeShipment.trackingNumber : null 
            });
        }
    };
    // --------------------------------------------------------

    const initializeSocketAndLocation = async (dbId: string) => {
      try {
        // 1. Connect to the Socket.IO server 
        const newSocket = io(SERVER_URL);
        newSocket.on('connect', () => {
          console.log('Socket.IO connected!');
          newSocket?.emit('joinDriverRoom', dbId);
        });
        socket.current = newSocket;
        
        // 2. Get location permission and start tracking... 
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required.');
          return;
        }

        const subscription = await Location.watchPositionAsync(
          { 
            accuracy: Location.Accuracy.High, 
            timeInterval: 10000, 
            distanceInterval: 10
          },
          (location) => { sendLocationToServer(location, dbId); } 
        );
        locationSubscription.current = subscription;
        
      } catch (err: any) {
        Alert.alert("Socket/Location Error", err.message);
        console.error("Socket/Location Error:", err);
      }
    };

    initializeSocketAndLocation(driverDbId);

    // Cleanup logic runs only when driverDbId changes (i.e., sign out)
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      if (socket.current) {
         socket.current.disconnect();
         socket.current = null;
      }
      console.log('Full cleanup: Location tracking & Socket.IO disconnected.');
    };
  }, [driverDbId, isInitialized]); 

  // The rendering logic remains the same
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {user?.firstName || 'Driver'}</Text>
        <Text style={styles.subtitle}>
          {isLoading ? 'Loading tasks...' : `You have ${tasks.length} tasks assigned.`}
        </Text>
      </View>

      {/* FIX: Loader now relies on isInitialized to know when the background work is truly done */}
      {isLoading && !isInitialized ? ( 
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