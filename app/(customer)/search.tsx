import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Filter, MapPin } from 'lucide-react-native';

export default function CustomerSearch() {
  const [sortBy, setSortBy] = useState('recommended');
  const [filterBy, setFilterBy] = useState('all');

  const sortOptions = [
    { key: 'recommended', label: 'Tavsiye Edilen' },
    { key: 'rating', label: 'En Çok Puan Alan' },
    { key: 'distance', label: 'En Yakın' },
  ];

  const filterOptions = [
    { key: 'all', label: 'Herkes' },
    { key: 'men', label: 'Erkek' },
    { key: 'women', label: 'Kadın' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yakındaki İşletmeler</Text>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <MapPin size={48} color="#6b7280" />
          <Text style={styles.mapText}>Harita yüklenecek</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Sıralama</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  sortBy === option.key && styles.filterChipActive
                ]}
                onPress={() => setSortBy(option.key)}
              >
                <Text style={[
                  styles.filterChipText,
                  sortBy === option.key && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Tip</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  filterBy === option.key && styles.filterChipActive
                ]}
                onPress={() => setFilterBy(option.key)}
              >
                <Text style={[
                  styles.filterChipText,
                  filterBy === option.key && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Yakındaki İşletmeler</Text>
        <View style={styles.resultsPlaceholder}>
          <Text style={styles.resultsText}>İşletmeler listelenecek</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginTop: 8,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  filterScroll: {
    paddingLeft: 24,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  resultsPlaceholder: {
    padding: 40,
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
});