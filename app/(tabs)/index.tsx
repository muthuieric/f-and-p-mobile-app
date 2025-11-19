import { 
  Text, 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  StatusBar, 
  ActivityIndicator, 
  TextInput,
  ScrollView
} from 'react-native';
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, MapPin, RefreshCw, Search, CheckCircle, Truck, Box } from 'lucide-react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';

// IMPORTANT: Update this to your computer's IP address
const SERVER_URL = "http://192.168.0.16:4000"; 
const API_URL = `${SERVER_URL}/api`;

type Task = {
id: string;
trackingNumber: string;
status: string;
destination: string;
receiverName?: string; 
};

// --- COMPONENT: TASK ITEM ---
const TaskItem = ({ item }: { item: Task }) => {
const isDelivered = item.status.toLowerCase() === 'delivered';

const getStatusColor = (status: string) => {
  switch(status.toLowerCase()) {
      case 'delivered': return '#10b981'; // Green
      case 'in transit': return '#2563eb'; // Blue
      case 'pending': return '#f59e0b'; // Orange
      default: return '#64748b'; // Slate
  }
};

const getStatusIcon = (status: string) => {
    switch(status.toLowerCase()) {
      case 'delivered': return <CheckCircle size={24} color="#10b981" />;
      case 'in transit': return <Truck size={24} color="#2563eb" />;
      default: return <Box size={24} color="#f59e0b" />;
    }
};

return (
  <Link href={{ pathname: "/(tabs)/[id]", params: { id: item.id } }} asChild>
    <TouchableOpacity style={styles.taskItem}>
      {/* Icon Box */}
      <View style={[styles.taskIconContainer, { backgroundColor: getStatusColor(item.status) + '15' }]}>
        {getStatusIcon(item.status)}
      </View>

      {/* Details */}
      <View style={styles.taskDetails}>
        <Text style={styles.taskTrackingNumber}>{item.trackingNumber}</Text>
        <View style={styles.addressContainer}>
          <MapPin size={14} color="#64748b" />
          <Text style={styles.taskAddress} numberOfLines={1}>
              {item.destination}
          </Text>
        </View>
        {item.receiverName && (
           <Text style={styles.receiverName}>To: {item.receiverName}</Text>
        )}
      </View>

      {/* Status Badge */}
      <View style={styles.taskStatusContainer}>
          <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
              <Text style={[styles.taskStatus, { color: getStatusColor(item.status) }]}>
                  {item.status}
              </Text>
          </View>
      </View>
    </TouchableOpacity>
  </Link>
);
};

// --- COMPONENT: FILTER CHIP ---
const FilterChip = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => (
  <TouchableOpacity 
      onPress={onPress} 
      style={[styles.filterChip, active && styles.filterChipActive]}
  >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
          {label}
      </Text>
  </TouchableOpacity>
);

export default function Dashboard() {
const [tasks, setTasks] = useState<Task[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [isRefreshing, setIsRefreshing] = useState(false);
const [error, setError] = useState<string | null>(null);
const [driverDbId, setDriverDbId] = useState<string | null>(null);
const [isInitialized, setIsInitialized] = useState(false);

// Filter States
const [searchQuery, setSearchQuery] = useState("");
const [statusFilter, setStatusFilter] = useState("All");

const { user } = useUser();
const { getToken } = useAuth();

const locationSubscription = useRef<Location.LocationSubscription | null>(null);
const socket = useRef<Socket | null>(null); 
const tasksRef = useRef<Task[]>([]); 
const isMounted = useRef(true); 

useEffect(() => {
  tasksRef.current = tasks;
}, [tasks]);

// --- SORTING & FILTERING LOGIC ---
const filteredTasks = useMemo(() => {
  // 1. Filter
  const filtered = tasks.filter(task => {
      const matchesStatus = 
          statusFilter === "All" || 
          task.status.toLowerCase() === statusFilter.toLowerCase();

      const q = searchQuery.toLowerCase();
      const matchesSearch = 
          task.trackingNumber.toLowerCase().includes(q) || 
          (task.destination && task.destination.toLowerCase().includes(q)) ||
          (task.receiverName && task.receiverName.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
  });

  // 2. Sort: Active tasks FIRST, Delivered tasks LAST
  return filtered.sort((a, b) => {
      const isADelivered = a.status.toLowerCase() === 'delivered';
      const isBDelivered = b.status.toLowerCase() === 'delivered';
      if (isADelivered === isBDelivered) return 0;
      return isADelivered ? 1 : -1; // Puts delivered at the bottom
  });

}, [tasks, statusFilter, searchQuery]);

// --- DATA FETCHING ---
const fetchTasks = useCallback(async (retryCount = 0, showLoading = true) => {
  if (!isInitialized && showLoading) setIsLoading(true);
  
  try {
    const token = await getToken();
    
    if (!token) {
      if (retryCount < 2) {
         setTimeout(() => {
           if (isMounted.current) fetchTasks(retryCount + 1, showLoading);
         }, 300); 
         return;
      }
      throw new Error("Authentication failed. Please login again.");
    }

    if (isMounted.current && retryCount === 0) setError(null);

    const response = await fetch(`${API_URL}/drivers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error(`Server status: ${response.status}`);
    
    const data = await response.json();
    const fetchedDriverId = response.headers.get('X-Driver-ID'); 
    
    if (isMounted.current) { 
      if (fetchedDriverId) setDriverDbId(fetchedDriverId); 
      const taskList = Array.isArray(data) ? data : (data.tasks || []);
      setTasks(taskList); 
      setIsInitialized(true); 
      setIsLoading(false);
    }
  } catch (err: any) {
    console.log(`[Dashboard] Fetch error:`, err.message);
    
    if (retryCount < 2) {
       setTimeout(() => {
          if (isMounted.current) fetchTasks(retryCount + 1, showLoading);
       }, 500);
       return;
    }

    if (isMounted.current) {
      if (!isInitialized) {
          setError(err.message.includes("Network") ? "Connecting..." : "Could not load tasks.");
          if (err.message.includes("Network")) setTimeout(() => fetchTasks(0, showLoading), 3000);
      }
      setIsLoading(false);
    }
  } 
}, [getToken, isInitialized]); 

// Auto-refresh on focus (Every time you look at the screen)
useFocusEffect(
  useCallback(() => {
      if (user) fetchTasks(0, !isInitialized); 
  }, [user, isInitialized, fetchTasks])
);

const onRefresh = async () => {
  setIsRefreshing(true);
  await fetchTasks(0, false);
  setIsRefreshing(false);
};

// --- SOCKET LOGIC ---
useEffect(() => {
  if (!driverDbId || !isInitialized) return; 
  if (socket.current || locationSubscription.current) return;

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

  const initializeSocket = async (dbId: string) => {
    try {
      const newSocket = io(SERVER_URL);
      socket.current = newSocket;
      newSocket.emit('joinDriverRoom', dbId);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
        (loc) => sendLocationToServer(loc, dbId) 
      );
      locationSubscription.current = sub;
    } catch (err) { console.error(err); }
  };
  initializeSocket(driverDbId);
  return () => {
    locationSubscription.current?.remove();
    socket.current?.disconnect();
  };
}, [driverDbId, isInitialized]); 

return (
  <SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" />
    
    {/* HEADER */}
    <View style={styles.header}>
      <View>
          <Text style={styles.title}>Hello, {user?.firstName || 'Driver'}</Text>
          <Text style={styles.subtitle}>
          {isLoading ? 'Syncing...' : `You have ${filteredTasks.length} tasks`}
          </Text>
      </View>
      <TouchableOpacity onPress={() => fetchTasks(0, true)} style={styles.refreshButton}>
          <RefreshCw size={20} color="#2563eb" />
      </TouchableOpacity>
    </View>

    {/* SEARCH & FILTER SECTION */}
    <View style={styles.filterContainer}>
      <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput 
              placeholder="Search tracking ID..." 
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
          />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <FilterChip label="All" active={statusFilter === "All"} onPress={() => setStatusFilter("All")} />
          <FilterChip label="To Pickup" active={statusFilter === "Pending"} onPress={() => setStatusFilter("Pending")} />
          <FilterChip label="In Progress" active={statusFilter === "In Transit"} onPress={() => setStatusFilter("In Transit")} />
          <FilterChip label="Delivered" active={statusFilter === "Delivered"} onPress={() => setStatusFilter("Delivered")} />
      </ScrollView>
    </View>

    {/* CONTENT */}
    {(isLoading && !isInitialized && !error) ? ( 
      <View style={styles.emptyContainer}>
           <ActivityIndicator size="large" color="#2563eb" />
           <Text style={[styles.emptyText, { marginTop: 20 }]}>Loading tasks...</Text>
      </View>
    ) : error ? (
      <View style={styles.emptyContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => fetchTasks(0, true)} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <FlatList
        data={filteredTasks}
        renderItem={({ item }) => <TaskItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        onRefresh={onRefresh}
        refreshing={isRefreshing}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Package size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No tasks found.</Text>
            <Text style={styles.subEmptyText}>Pull down to refresh</Text>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  refreshButton: { padding: 8, backgroundColor: '#eff6ff', borderRadius: 8 },
  
  // Filter Styles
  filterContainer: { backgroundColor: 'white', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f1f5f9',
      marginHorizontal: 24,
      paddingHorizontal: 12,
      height: 44,
      borderRadius: 12,
      marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0f172a', height: '100%' },
  chipsScroll: { paddingHorizontal: 24 },
  filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#f1f5f9',
      marginRight: 8,
      borderWidth: 1,
      borderColor: '#f1f5f9'
  },
  filterChipActive: {
      backgroundColor: '#eff6ff',
      borderColor: '#2563eb',
  },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  filterChipTextActive: { color: '#2563eb' },

  // List Styles
  listContainer: { padding: 16 },
  taskItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  taskIconContainer: { padding: 12, borderRadius: 12, marginRight: 16 },
  
  taskDetails: { flex: 1 },
  taskTrackingNumber: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  addressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  taskAddress: { fontSize: 13, color: '#64748b', marginLeft: 6, flex: 1 },
  receiverName: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  
  taskStatusContainer: { marginLeft: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  taskStatus: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12, fontWeight: '600' },
  subEmptyText: { fontSize: 14, color: '#cbd5e1', marginTop: 4 },
  errorText: { fontSize: 16, color: '#ef4444', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  retryButtonText: { color: 'white', fontWeight: '600' },
});