import { 
  Text, View, StyleSheet, FlatList, TouchableOpacity, StatusBar, 
  ActivityIndicator, TextInput, ScrollView 
} from 'react-native';
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, Search, Package, Calendar } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';

// Custom Hooks & Components
import { useShipmentApi } from '@/hooks/useShipmentApi';
import { Config } from '@/constants/Config';
import { Shipment } from '@/types';
import { TaskItem } from '@/components/TaskItem';
import { FilterChip } from '@/components/FilterChip';

export default function Dashboard() {
  const { getDriverTasks } = useShipmentApi(); 
  const { user } = useUser();

  const [tasks, setTasks] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverDbId, setDriverDbId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<"Today" | "Week" | "All">("Today"); // Added Date Filter

  // Socket Refs
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const socket = useRef<Socket | null>(null); 
  const tasksRef = useRef<Shipment[]>([]); 

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // --- 1. SORTING & FILTERING ---
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const filtered = tasks.filter(task => {
        // 1. Status Filter
        const matchesStatus = statusFilter === "All" || task.status.toLowerCase() === statusFilter.toLowerCase();
        
        // 2. Search Filter
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
            task.trackingNumber.toLowerCase().includes(q) || 
            (task.destination && task.destination.toLowerCase().includes(q)) ||
            (task.receiverName && task.receiverName.toLowerCase().includes(q));

        // 3. Date Filter
        let matchesDate = true;
        const dateToCheckStr = task.status === 'Delivered' ? task.deliveredAt : task.createdAt;
        
        if (dateToCheckStr && dateFilter !== "All") {
            const dateToCheck = new Date(dateToCheckStr);
            if (dateFilter === "Today") {
                matchesDate = dateToCheck >= startOfToday;
            } else if (dateFilter === "Week") {
                matchesDate = dateToCheck >= startOfWeek;
            }
        }

        return matchesStatus && matchesSearch && matchesDate;
    });

    return filtered.sort((a, b) => {
        const isADelivered = a.status.toLowerCase() === 'delivered';
        const isBDelivered = b.status.toLowerCase() === 'delivered';
        if (isADelivered === isBDelivered) return 0;
        return isADelivered ? 1 : -1; 
    });
  }, [tasks, statusFilter, searchQuery, dateFilter]);

  // --- 2. DATA FETCHING ---
  const fetchTasks = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError(null);
    
    try {
      const { tasks: fetchedTasks, driverId } = await getDriverTasks();
      setTasks(fetchedTasks || []);
      if (driverId) setDriverDbId(driverId);
    } catch (err: any) {
      console.log(`[Dashboard] Fetch error:`, err.message);
      setError(err.message || "Could not load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [getDriverTasks]); 

  // Auto-refresh on focus
  useFocusEffect(
    useCallback(() => {
        if (user) fetchTasks(tasks.length === 0); 
    }, [user, fetchTasks])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchTasks(false);
    setIsRefreshing(false);
  };

  // --- 3. SOCKET LOGIC ---
  useEffect(() => {
    if (!driverDbId) return; 
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
        const newSocket = io(Config.SERVER_URL);
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
  }, [driverDbId]); 

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
            <Text style={styles.title}>Hello, {user?.firstName || 'Driver'}</Text>
            <Text style={styles.subtitle}>
            {isLoading ? 'Syncing...' : `You have ${filteredTasks.length} tasks for ${dateFilter === 'Today' ? 'today' : dateFilter === 'Week' ? 'this week' : 'all time'}`}
            </Text>
        </View>
        <TouchableOpacity onPress={() => fetchTasks(true)} style={styles.refreshButton}>
            <RefreshCw size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

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

        {/* Horizontal Scroll for multiple filter rows */}
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.chipsScroll}
            contentContainerStyle={{ paddingRight: 40 }}
        >
       
            {/* Status Filters */}
            {["All", "Pending", "In Transit", "Delivered"].map(filter => (
                 <FilterChip 
                    key={filter}
                    label={filter === "Pending" ? "To Pickup" : filter === "In Transit" ? "In Progress" : filter} 
                    active={statusFilter === filter} 
                    onPress={() => setStatusFilter(filter)} 
                 />
            ))}

              {/* Date Filters */}
              <View style={{ flexDirection: 'row', marginRight: 16, paddingRight: 16, borderRightWidth: 1, borderRightColor: '#e2e8f0' }}>
                <FilterChip label="Today" active={dateFilter === "Today"} onPress={() => setDateFilter("Today")} />
                <FilterChip label="Week" active={dateFilter === "Week"} onPress={() => setDateFilter("Week")} />
                <FilterChip label="All Time" active={dateFilter === "All"} onPress={() => setDateFilter("All")} />
            </View>

        </ScrollView>
      </View>

      {isLoading && !isRefreshing ? ( 
        <View style={styles.emptyContainer}>
             <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchTasks(true)} style={styles.retryButton}>
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
              <Text style={styles.emptyText}>No tasks found for {dateFilter.toLowerCase()}.</Text>
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
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10,
    backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  refreshButton: { padding: 8, backgroundColor: '#eff6ff', borderRadius: 8 },
  filterContainer: { backgroundColor: 'white', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchBar: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9',
      marginHorizontal: 24, paddingHorizontal: 12, height: 44, borderRadius: 12, marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0f172a', height: '100%' },
  chipsScroll: { paddingHorizontal: 24 },
  listContainer: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12, fontWeight: '600' },
  errorText: { fontSize: 16, color: '#ef4444', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  retryButtonText: { color: 'white', fontWeight: '600' },
});