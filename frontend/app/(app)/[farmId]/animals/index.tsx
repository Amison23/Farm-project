import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAnimals } from '../../../../hooks/useAnimals';
import { AnimalCard } from '../../../../components/farm/AnimalCard';
import { AnimalStatus, AnimalSex, AnimalSpecies } from '../../../../types/animal';
import { SPECIES_CONFIGS } from '../../../../utils/species';

export default function AnimalsListScreen() {
  const router = useRouter();
  const { farmId } = useLocalSearchParams<{ farmId: string }>();

  const [search, setSearch] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<AnimalSpecies | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<AnimalStatus | undefined>(undefined);
  const [selectedSex, setSelectedSex] = useState<AnimalSex | undefined>(undefined);

  const { animals, meta, isLoading, error, refetch, setFilters } = useAnimals(farmId, {
    species: selectedSpecies,
    status: selectedStatus,
    sex: selectedSex,
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

  const handleSpeciesSelect = (species: AnimalSpecies | undefined) => {
    setSelectedSpecies(species);
    setFilters((prev) => ({
      ...prev,
      species,
      page: 1,
    }));
  };

  const handleStatusSelect = (status: AnimalStatus | undefined) => {
    setSelectedStatus(status);
    setFilters((prev) => ({
      ...prev,
      status,
      page: 1,
    }));
  };

  const handleSexSelect = (sex: AnimalSex | undefined) => {
    setSelectedSex(sex);
    setFilters((prev) => ({
      ...prev,
      sex,
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
              <Text className="text-xl font-bold text-farm-text">Animal Records</Text>
              <Text className="text-xs text-farm-muted">Total: {meta.total} animals</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(app)/[farmId]/animals/new', params: { farmId } })}
            className="bg-farm-primary px-4 py-2 rounded-xl flex-row items-center gap-1 shadow-sm hover:opacity-90"
          >
            <Text className="text-xs font-bold text-farm-inverse">+ Add Animal</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View className="mb-3">
          <TextInput
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Search by Tag ID (e.g. SH-001) or Family Line..."
            placeholderTextColor="#6B6B60"
            className="bg-farm-surface border border-farm-border rounded-2xl px-4 py-3 text-sm text-farm-text"
          />
        </View>

        {/* Filter Chips Bar */}
        <View className="mb-4">
          {/* Species filters */}
          <View className="mb-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
              <TouchableOpacity
                onPress={() => handleSpeciesSelect(undefined)}
                className={`px-3 py-1 rounded-full border ${
                  selectedSpecies === undefined
                    ? 'bg-farm-primary-bg border-farm-primary'
                    : 'bg-farm-surface border-farm-border'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedSpecies === undefined ? 'text-farm-primary font-bold' : 'text-farm-muted'
                  }`}
                >
                  All Species
                </Text>
              </TouchableOpacity>
              {Object.values(SPECIES_CONFIGS).map((item) => {
                const isSelected = selectedSpecies === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleSpeciesSelect(item.id)}
                    className={`px-3 py-1 rounded-full border flex-row items-center gap-1 ${
                      isSelected
                        ? 'bg-farm-primary-bg border-farm-primary'
                        : 'bg-farm-surface border-farm-border'
                    }`}
                  >
                    <Text className="text-xs">{item.emoji}</Text>
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-farm-primary font-bold' : 'text-farm-muted'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Status filters */}
          <View className="flex-row items-center gap-1.5 mb-2 flex-wrap">
            <Text className="text-[10px] font-bold uppercase font-mono text-farm-muted mr-1">Status:</Text>
            {[
              { label: 'All', value: undefined },
              { label: 'Active', value: 'active' as AnimalStatus },
              { label: 'Sold', value: 'sold' as AnimalStatus },
              { label: 'Culled', value: 'culled' as AnimalStatus },
            ].map((item) => {
              const isSelected = selectedStatus === item.value;
              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => handleStatusSelect(item.value)}
                  className={`px-3 py-1 rounded-full border ${
                    isSelected
                      ? 'bg-farm-primary-bg border-farm-primary'
                      : 'bg-farm-surface border-farm-border'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-farm-primary font-bold' : 'text-farm-muted'
                    }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sex filters */}
          <View className="flex-row items-center gap-1.5 flex-wrap">
            <Text className="text-[10px] font-bold uppercase font-mono text-farm-muted mr-1">Sex:</Text>
            {[
              { label: 'All', value: undefined },
              { label: '♀ Female', value: 'female' as AnimalSex },
              { label: '♂ Male', value: 'male' as AnimalSex },
            ].map((item) => {
              const isSelected = selectedSex === item.value;
              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => handleSexSelect(item.value)}
                  className={`px-3 py-1 rounded-full border ${
                    isSelected
                      ? 'bg-farm-primary-bg border-farm-primary'
                      : 'bg-farm-surface border-farm-border'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-farm-primary font-bold' : 'text-farm-muted'
                    }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Error state */}
        {error ? (
          <View className="bg-farm-danger-bg border border-farm-danger/20 rounded-2xl p-4 mb-4">
            <Text className="text-xs font-bold text-farm-danger">{error}</Text>
          </View>
        ) : null}

        {/* Animal List */}
        {isLoading && animals.length === 0 ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#3D7A3A" />
            <Text className="text-xs text-farm-muted mt-3">Loading herd records...</Text>
          </View>
        ) : animals.length === 0 ? (
          <View className="flex-1 justify-center items-center py-16 bg-farm-surface border border-farm-border rounded-3xl p-6 mb-6">
            <Text className="text-4xl mb-3">🐑</Text>
            <Text className="text-base font-bold text-farm-text text-center">No Animal Records Found</Text>
            <Text className="text-xs text-farm-muted text-center mt-1 mb-4">
              {search || selectedStatus || selectedSex
                ? 'No animals match your search or filters.'
                : 'Start building your farm inventory by adding your first animal record.'}
            </Text>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(app)/[farmId]/animals/new', params: { farmId } })}
              className="bg-farm-primary px-5 py-2.5 rounded-xl shadow-xs"
            >
              <Text className="text-xs font-bold text-farm-inverse">+ Add First Animal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={animals}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={['#3D7A3A']} />
            }
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <AnimalCard
                animal={item}
                onPress={() => router.push(`/(app)/${farmId}/animals/${item.id}` as any)}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
