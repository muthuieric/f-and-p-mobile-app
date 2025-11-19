import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { MapPin, CheckCircle, Truck, Box, Clock } from 'lucide-react-native';
import { Shipment } from '@/types';

interface TaskItemProps {
  item: Shipment;
}

export const TaskItem = ({ item }: TaskItemProps) => {
  
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

  const formatTime = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    // Format: "10:30 AM"
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // LOGIC: 
  // If status is Delivered, use 'updatedAt' (which is when the delivery happened).
  // Otherwise, use 'createdAt' (when the task was assigned).
  const isDelivered = item.status === 'Delivered';
  const dateToDisplay = isDelivered ? item.updatedAt : item.createdAt;
  const timeString = formatTime(dateToDisplay);

  return (
    <Link href={{ pathname: "/(tabs)/[id]", params: { id: item.id } }} asChild>
      <TouchableOpacity style={styles.taskItem}>
        {/* Icon Box */}
        <View style={[styles.taskIconContainer, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          {getStatusIcon(item.status)}
        </View>

        {/* Details */}
        <View style={styles.taskDetails}>
          <View style={styles.headerRow}>
            <Text style={styles.taskTrackingNumber}>{item.trackingNumber}</Text>
            
            {/* TIME BADGE */}
            {timeString && (
                <View style={styles.timeContainer}>
                    <Clock size={12} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={styles.timeText}>
                        {isDelivered ? 'Delivered ' : 'Posted '}{timeString}
                    </Text>
                </View>
            )}
          </View>

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

const styles = StyleSheet.create({
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
  
  // Header Row (Tracking # + Time)
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  taskTrackingNumber: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  
  timeContainer: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: '#f1f5f9', 
      paddingHorizontal: 8, 
      paddingVertical: 4, 
      borderRadius: 6 
  },
  timeText: { fontSize: 11, color: '#475569', fontWeight: '600' },

  addressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  taskAddress: { fontSize: 13, color: '#64748b', marginLeft: 6, flex: 1 },
  receiverName: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  
  taskStatusContainer: { marginLeft: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  taskStatus: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});