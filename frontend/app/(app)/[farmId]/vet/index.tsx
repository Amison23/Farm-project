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
import { useVetRecords, useWithdrawalStatus } from '../../../../hooks/useVetRecords';
import { VetRecordCard } from '../../../../components/farm/VetRecordCard';
import { WithdrawalBadge } from '../../../../components/farm/WithdrawalBadge';

export default function VetRecordsScreen() {
  const router = useRouter();
  const { farmId } = useLocalSearchParams<{ farmId: string }>();

  const [activeTab, setActiveTab] = useState<'records' | 'withdrawals'>('records');
  const [search, setSearch] = useState('');

  const { records, meta, isLoading: isLoadingRecords, error: recordsError, refetch: refetchRecords, setFilters } =
    useVetRecords(farmId, { search: search.trim() || undefined });

  const { activeWithdrawals, isLoading: isLoadingWithdrawals, refetch: refetchWithdrawals } =
    useWithdrawalStatus(farmId);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setFilters((prev) => ({
      ...prev,
      search: text.trim() || undefined,
      page: 1,
    }));
  };

  return (
    <SafeAreaView className="flex-1 bg-farm-bg">
      <View className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else if (farmId) {
                  router.replace({ pathname: '/(app)/[farmId]', params: { farmId } });
                }
              }}
              className="px-2.5 py-1.5 bg-farm-surface border border-farm-border rounded-xl hover:bg-farm-surface-2"
            >
              <Text className="text-xs font-bold text-farm-text">‹ Back</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold text-farm-text">Vet & Treatment Logs</Text>
              <Text className="text-xs text-farm-muted">Total: {meta.total} treatments</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(app)/[farmId]/vet/new', params: { farmId } })}
            className="bg-farm-primary px-4 py-2 rounded-xl flex-row items-center gap-1 shadow-sm hover:opacity-90"
          >
            <Text className="text-xs font-bold text-farm-inverse">+ Log Treatment</Text>
          </TouchableOpacity>
        </View>

        {/* Segmented Tab Switcher */}
        <View className="flex-row bg-farm-surface-2 p-1 rounded-2xl mb-4 border border-farm-border">
          <TouchableOpacity
            onPress={() => setActiveTab('records')}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeTab === 'records' ? 'bg-farm-surface shadow-xs' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'records' ? 'text-farm-text' : 'text-farm-muted'
              }`}
            >
              Treatment History ({meta.total})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('withdrawals')}
            className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5 ${
              activeTab === 'withdrawals' ? 'bg-farm-surface shadow-xs' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'withdrawals' ? 'text-farm-warning' : 'text-farm-muted'
              }`}
            >
              Active Withdrawal Watchlist ({activeWithdrawals.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'records' ? (
          <>
            {/* Search Input */}
            <View className="mb-4">
              <TextInput
                value={search}
                onChangeText={handleSearchChange}
                placeholder="Search treatments by product name or notes..."
                placeholderTextColor="#6B6B60"
                className="bg-farm-surface border border-farm-border rounded-2xl px-4 py-3 text-sm text-farm-text"
              />
            </View>

            {/* Error state */}
            {recordsError ? (
              <View className="bg-farm-danger-bg border border-farm-danger/20 rounded-2xl p-4 mb-4">
                <Text className="text-xs font-bold text-farm-danger">{recordsError}</Text>
              </View>
            ) : null}

            {/* Records List */}
            {isLoadingRecords && records.length === 0 ? (
              <View className="flex-1 justify-center items-center py-12">
                <ActivityIndicator size="large" color="#3D7A3A" />
                <Text className="text-xs text-farm-muted mt-3">Loading treatment logs...</Text>
              </View>
            ) : records.length === 0 ? (
              <View className="flex-1 justify-center items-center py-16 bg-farm-surface border border-farm-border rounded-3xl p-6 mb-6">
                <Text className="text-4xl mb-3">🩺</Text>
                <Text className="text-base font-bold text-farm-text text-center">No Treatment Logs Found</Text>
                <Text className="text-xs text-farm-muted text-center mt-1 mb-4">
                  {search
                    ? 'No treatment records match your search query.'
                    : 'Maintain health compliance by logging vaccinations and treatments.'}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/(app)/[farmId]/vet/new', params: { farmId } })}
                  className="bg-farm-primary px-5 py-2.5 rounded-xl shadow-xs"
                >
                  <Text className="text-xs font-bold text-farm-inverse">+ Log First Treatment</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={records}
                keyExtractor={(item) => item.id}
                refreshControl={
                  <RefreshControl refreshing={isLoadingRecords} onRefresh={refetchRecords} colors={['#3D7A3A']} />
                }
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <VetRecordCard
                    record={item}
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/[farmId]/vet/[id]',
                        params: { farmId, id: item.id },
                      })
                    }
                  />
                )}
              />
            )}
          </>
        ) : (
          <>
            {/* Active Withdrawal Watchlist */}
            {isLoadingWithdrawals ? (
              <View className="flex-1 justify-center items-center py-12">
                <ActivityIndicator size="large" color="#D97706" />
                <Text className="text-xs text-farm-muted mt-3">Checking active withdrawal periods...</Text>
              </View>
            ) : activeWithdrawals.length === 0 ? (
              <View className="flex-1 justify-center items-center py-16 bg-farm-surface border border-farm-border rounded-3xl p-6 mb-6">
                <Text className="text-4xl mb-3">✅</Text>
                <Text className="text-base font-bold text-farm-text text-center">Zero Active Withdrawals</Text>
                <Text className="text-xs text-farm-muted text-center mt-1">
                  All animals in this farm are currently clear of active drug withdrawal restrictions.
                </Text>
              </View>
            ) : (
              <FlatList
                data={activeWithdrawals}
                keyExtractor={(item) => item.vet_record_id}
                refreshControl={
                  <RefreshControl refreshing={isLoadingWithdrawals} onRefresh={refetchWithdrawals} colors={['#D97706']} />
                }
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push(`/(app)/${farmId}/animals/${item.animal_id}` as any)}
                    className="bg-farm-surface border border-farm-warning/40 rounded-2xl p-4 mb-3 shadow-xs"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-base font-bold text-farm-text">
                        {item.animal?.sheep_id ? `Tag: ${item.animal.sheep_id}` : `Animal ID: ${item.animal_id.slice(0, 8)}`}
                      </Text>
                      <WithdrawalBadge withdrawalEndDate={item.withdrawal_end_date} size="sm" />
                    </View>

                    <Text className="text-xs text-farm-muted">
                      Breed: <Text className="font-semibold text-farm-text">{item.animal?.breed || '—'}</Text>
                    </Text>
                    <Text className="text-[11px] text-farm-warning font-medium mt-1">
                      ⚠️ Status change to "Sold" is currently restricted on backend.
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
