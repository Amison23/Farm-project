import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAnimalDetail, useAnimalLineage, deleteAnimal } from '../../../../../hooks/useAnimals';
import { useAnimalFeedHistory } from '../../../../../hooks/useFeedRecords';
import { StatusBadge } from '../../../../../components/farm/StatusBadge';
import { PedigreeTree } from '../../../../../components/farm/PedigreeTree';
import { FeedRecordCard } from '../../../../../components/farm/FeedRecordCard';
import { getSexTerm, getSpeciesConfig } from '../../../../../utils/species';

export default function AnimalDetailScreen() {
  const router = useRouter();
  const { farmId, id } = useLocalSearchParams<{ farmId: string; id: string }>();

  const { animal, isLoading: isLoadingAnimal, error: animalError, refetch: refetchAnimal } = useAnimalDetail(farmId, id);
  const { lineage, isLoading: isLoadingLineage, refetch: refetchLineage } = useAnimalLineage(farmId, id);
  const { history: feedHistory, isLoading: isLoadingFeed } = useAnimalFeedHistory(farmId, id);

  const [activeTab, setActiveTab] = useState<'overview' | 'pedigree' | 'feed'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleBackSafe = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (farmId) {
      router.replace(`/(app)/${farmId}/animals` as any);
    }
  };

  const handleDelete = async () => {
    if (!farmId || !id) return;

    try {
      setIsDeleting(true);
      setDeleteError('');
      await deleteAnimal(farmId, id);
      setShowDeleteModal(false);
      handleBackSafe();
    } catch (err: any) {
      console.error('[AnimalDetail] Delete error:', err);
      setDeleteError(err.message || 'Failed to delete animal record.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingAnimal) {
    return (
      <SafeAreaView className="flex-1 bg-farm-bg justify-center items-center">
        <ActivityIndicator size="large" color="#3D7A3A" />
        <Text className="text-xs text-farm-muted mt-3">Loading animal record...</Text>
      </SafeAreaView>
    );
  }

  if (animalError || !animal) {
    return (
      <SafeAreaView className="flex-1 bg-farm-bg p-6 justify-center items-center">
        <Text className="text-3xl mb-3">⚠️</Text>
        <Text className="text-base font-bold text-farm-text mb-1">Animal Not Found</Text>
        <Text className="text-xs text-farm-muted text-center mb-6">{animalError || 'This animal record does not exist or has an unlinked ID.'}</Text>
        
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleBackSafe}
            className="bg-farm-surface border border-farm-border px-4 py-2.5 rounded-xl"
          >
            <Text className="text-xs font-bold text-farm-text">‹ Back to Animals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(app)/[farmId]/animals/[id]/edit', params: { farmId, id } })}
            className="bg-farm-primary px-4 py-2.5 rounded-xl"
          >
            <Text className="text-xs font-bold text-farm-inverse">✏️ Edit / Fix Record</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-farm-bg">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Header Bar */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={handleBackSafe}
              className="px-3 py-1.5 bg-farm-surface border border-farm-border rounded-xl hover:bg-farm-surface-2"
            >
              <Text className="text-xs font-bold text-farm-text">‹ Back</Text>
            </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(app)/[farmId]/animals/[id]/edit', params: { farmId, id } })}
              className="px-3 py-1.5 bg-farm-surface border border-farm-border rounded-xl"
            >
              <Text className="text-xs font-bold text-farm-primary">✏️ Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDeleteModal(true)}
              className="px-3 py-1.5 bg-farm-danger-bg border border-farm-danger/20 rounded-xl"
            >
              <Text className="text-xs font-bold text-farm-danger">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card */}
        <View className="bg-farm-surface border border-farm-border rounded-3xl p-5 mb-5 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl">{getSpeciesConfig(animal.species).emoji}</Text>
              <Text className="text-2xl font-bold text-farm-text">{animal.sheep_id}</Text>
              <Text className={`text-sm font-bold ${animal.sex === 'male' ? 'text-blue-600' : 'text-pink-600'}`}>
                ({getSexTerm(animal.sex, animal.species)})
              </Text>
            </View>
            <StatusBadge status={animal.status} size="md" />
          </View>

          <Text className="text-sm font-semibold text-farm-primary mb-1">
            {getSpeciesConfig(animal.species).label} • {animal.breed}
          </Text>
          {animal.family_line ? (
            <Text className="text-xs text-farm-muted font-mono">Lineage Group: {animal.family_line}</Text>
          ) : null}
        </View>

        {/* Segmented Tab Switcher */}
        <View className="flex-row bg-farm-surface-2 p-1 rounded-2xl mb-4 border border-farm-border">
          <TouchableOpacity
            onPress={() => setActiveTab('overview')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'overview' ? 'bg-farm-surface shadow-xs' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'overview' ? 'text-farm-text' : 'text-farm-muted'
              }`}
            >
              Overview & Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('pedigree')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'pedigree' ? 'bg-farm-surface shadow-xs' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'pedigree' ? 'text-farm-text' : 'text-farm-muted'
              }`}
            >
              Pedigree 🌳
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('feed')}
            className={`flex-1 py-2 rounded-xl items-center ${
              activeTab === 'feed' ? 'bg-farm-surface shadow-xs' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'feed' ? 'text-farm-text' : 'text-farm-muted'
              }`}
            >
              Feed Log 🌾
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <View className="gap-4">
            {/* Characteristics Grid */}
            <View className="bg-farm-surface border border-farm-border rounded-3xl p-5">
              <Text className="text-xs font-bold text-farm-muted uppercase tracking-widest font-mono mb-3">
                Key Metrics
              </Text>

              <View className="flex-row flex-wrap gap-4">
                <View className="w-[45%]">
                  <Text className="text-xs text-farm-muted">Species / Type</Text>
                  <Text className="text-sm font-bold text-farm-text">
                    {getSpeciesConfig(animal.species).emoji} {getSpeciesConfig(animal.species).label}
                  </Text>
                </View>

                <View className="w-[45%]">
                  <Text className="text-xs text-farm-muted">Sex Term</Text>
                  <Text className="text-sm font-bold text-farm-text">
                    {getSexTerm(animal.sex, animal.species)}
                  </Text>
                </View>

                <View className="w-[45%]">
                  <Text className="text-xs text-farm-muted">Breed</Text>
                  <Text className="text-sm font-bold text-farm-text">{animal.breed}</Text>
                </View>

                <View className="w-[45%]">
                  <Text className="text-xs text-farm-muted">Birth Year</Text>
                  <Text className="text-sm font-bold text-farm-text">
                    {animal.birth_year ? animal.birth_year : 'Not specified'}
                  </Text>
                </View>

                <View className="w-[45%]">
                  <Text className="text-xs text-farm-muted">Date of Birth</Text>
                  <Text className="text-sm font-bold text-farm-text">
                    {animal.date_of_birth ? animal.date_of_birth : 'Not recorded'}
                  </Text>
                </View>

                <View className="w-[45%]">
                  <Text className="text-xs text-farm-muted">
                    {getSpeciesConfig(animal.species).sireTerm}
                  </Text>
                  <Text className="text-sm font-bold text-farm-text">
                    {animal.sire ? `${animal.sire.sheep_id}` : '—'}
                  </Text>
                </View>

                <View className="w-[45%]">
                  <Text className="text-xs text-farm-muted">
                    {getSpeciesConfig(animal.species).damTerm}
                  </Text>
                  <Text className="text-sm font-bold text-farm-text">
                    {animal.dam ? `${animal.dam.sheep_id}` : '—'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Notes Card */}
            {animal.notes ? (
              <View className="bg-farm-surface border border-farm-border rounded-3xl p-5">
                <Text className="text-xs font-bold text-farm-muted uppercase tracking-widest font-mono mb-2">
                  History & Notes
                </Text>
                <Text className="text-sm text-farm-text leading-relaxed">{animal.notes}</Text>
              </View>
            ) : null}
          </View>
        ) : activeTab === 'pedigree' ? (
          <View>
            {isLoadingLineage ? (
              <ActivityIndicator size="small" color="#3D7A3A" className="py-8" />
            ) : lineage ? (
              <PedigreeTree
                lineage={lineage}
                onAnimalPress={(targetId) => {
                  if (targetId !== id) {
                    router.push(`/(app)/${farmId}/animals/${targetId}` as any);
                  }
                }}
              />
            ) : (
              <View className="bg-farm-surface border border-farm-border rounded-3xl p-6 items-center">
                <Text className="text-xs text-farm-muted">No lineage records found for this animal.</Text>
              </View>
            )}
          </View>
        ) : (
          <View className="gap-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-bold text-farm-muted uppercase tracking-widest font-mono">
                Nutrition & Forage History
              </Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(app)/[farmId]/feed/new', params: { farmId, animalId: id } })}
                className="px-3 py-1.5 bg-farm-primary rounded-xl"
              >
                <Text className="text-xs font-bold text-farm-inverse">+ Log Feed</Text>
              </TouchableOpacity>
            </View>

            {isLoadingFeed ? (
              <ActivityIndicator size="small" color="#3D7A3A" className="py-8" />
            ) : feedHistory.length === 0 ? (
              <View className="bg-farm-surface border border-farm-border rounded-3xl p-8 items-center">
                <Text className="text-3xl mb-2">🌾</Text>
                <Text className="text-sm font-bold text-farm-text mb-1">No Feed Logs Found</Text>
                <Text className="text-xs text-farm-muted text-center mb-4">
                  No feed or nutrition logs have been recorded for this animal yet.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/(app)/[farmId]/feed/new', params: { farmId, animalId: id } })}
                  className="bg-farm-primary px-4 py-2 rounded-xl"
                >
                  <Text className="text-xs font-bold text-farm-inverse">+ Log First Feed</Text>
                </TouchableOpacity>
              </View>
            ) : (
              feedHistory.map((item) => (
                <FeedRecordCard
                  key={item.id}
                  record={item}
                  onPress={() => router.push(`/(app)/${farmId}/feed/${item.id}` as any)}
                />
              ))
            )}
          </View>
        )}
      </View>
    </ScrollView>

      {/* Delete Confirmation Modal (Requested by user) */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-farm-bg border border-farm-border rounded-3xl p-6 w-full max-w-sm shadow-lg">
            <Text className="text-lg font-bold text-farm-text mb-2">Delete Animal Record</Text>
            <Text className="text-xs text-farm-muted mb-4">
              Are you sure you want to delete <Text className="font-bold text-farm-text">{animal.sheep_id}</Text>? This action cannot be undone. Descendants will have sire/dam reset to unknown.
            </Text>

            {deleteError ? (
              <View className="bg-farm-danger-bg border border-farm-danger/20 rounded-xl p-3 mb-4">
                <Text className="text-xs text-farm-danger">{deleteError}</Text>
              </View>
            ) : null}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-farm-surface border border-farm-border rounded-xl items-center"
              >
                <Text className="text-xs font-bold text-farm-text">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-farm-danger rounded-xl items-center"
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-xs font-bold text-farm-inverse">Delete Record</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
