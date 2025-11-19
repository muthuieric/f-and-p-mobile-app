import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

interface FilterChipProps {
    label: string;
    active: boolean;
    onPress: () => void;
}

export const FilterChip = ({ label, active, onPress }: FilterChipProps) => (
  <TouchableOpacity 
      onPress={onPress} 
      style={[styles.filterChip, active && styles.filterChipActive]}
  >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
          {label}
      </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
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
});