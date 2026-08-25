import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFeedRecords } from '../../../../hooks/useFeedRecords';
import { FeedRecordCard } from '../../../../components/farm/FeedRecordCard';

export default function FeedRecordsListScreen() {
  const router = useRouter();
  const { farmId } = useLocalSearchParams<{ farmId: string }>();

  const [search, setSearch] = useState('');

  const { records, meta, isLoading, error, refetch, setFilters } = useFeedRecords(farmId, {
    search: search.trim() || undefined,
  });

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setFilters((prev) => ({
      ...prev,
      search: text.trim() || undefined,
      page: 1,
    }));
  };

  const handleBackSafe = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (farmId) {
      router.replace(`/(app)/${farmId}` as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-farm-bg">
      <View className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1">
        {/* Header Bar */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={handleBackSafe}
              className="px-3 py-1.5 bg-farm-surface border border-farm-border rounded-xl hover:bg-farm-surface-2"
            >
              <Text className="text-xs font-bold text-farm-text">‹ Dashboard</Text>
            </TouchableOpacity>

            <View>
              <Text className="text-xl font-bold text-farm-text">Feed & Nutrition</Text>
              <Text className="text-xs text-farm-muted">Total: {meta.total} records</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push(`/(app)/${farmId}/feed/new` as any)}
            className="bg-farm-primary px-4 py-2.5 rounded-xl shadow-xs hover:opacity-90 flex-row items-center gap-1.5"
          >
            <Text className="text-sm">🌾</Text>
            <Text className="text-xs font-bold text-farm-inverse">+ Log Feed</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <TextInput
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Search by base forage (Lucerne, Hay), supplement, or notes..."
            placeholderTextColor="#6B6B60"
            className="bg-farm-surface border border-farm-border rounded-2xl px-4 py-3 text-sm text-farm-text"
          />
        </View>

        {/* Error Banner */}
        {error ? (
          <View className="bg-farm-danger-bg border border-farm-danger/20 rounded-2xl p-4 mb-4">
            <Text className="text-xs font-bold text-farm-danger">{error}</Text>
          </View>
        ) : null}

        {/* List Content */}
        {isLoading && records.length === 0 ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#3D7A3A" />
            <Text className="text-xs text-farm-muted mt-3">Loading feed records...</Text>
          </View>
        ) : (
          <FlatList
            data={records}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={['#3D7A3A']} />
            }
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            ListEmptyComponent={
              !isLoading ? (
                <View className="flex-1 justify-center items-center py-12 bg-farm-surface border border-farm-border rounded-3xl p-8">
                  <Text className="text-4xl mb-3">🌾</Text>
                  <Text className="text-base font-bold text-farm-text mb-1">No Feed Records Found</Text>
                  <Text className="text-xs text-farm-muted text-center mb-6 max-w-sm">
                    {search
                      ? 'No feed logs match your search term.'
                      : 'Start tracking forage bases, supplements, and nutrition per head for your farm.'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push(`/(app)/${farmId}/feed/new` as any)}
                    className="bg-farm-primary px-5 py-3 rounded-xl shadow-xs"
                  >
                    <Text className="text-xs font-bold text-farm-inverse">+ Log First Feed Record</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <FeedRecordCard
                record={item}
                onPress={() => router.push(`/(app)/${farmId}/feed/${item.id}` as any)}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
