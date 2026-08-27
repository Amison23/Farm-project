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
import { useFeedRecordDetail, deleteFeedRecord } from '../../../../hooks/useFeedRecords';
import { getSpeciesConfig, getSexTerm } from '../../../../utils/species';

export default function FeedRecordDetailScreen() {
  const router = useRouter();
  const { farmId, id } = useLocalSearchParams<{ farmId: string; id: string }>();

  const { record, isLoading, error } = useFeedRecordDetail(farmId, id);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleBackSafe = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (farmId) {
      router.replace(`/(app)/${farmId}/feed` as any);
    }
  };

  const handleDelete = async () => {
    if (!farmId || !id) return;

    try {
      setIsDeleting(true);
      setDeleteError('');
      await deleteFeedRecord(farmId, id);
      setShowDeleteModal(false);
      handleBackSafe();
    } catch (err: any) {
      console.error('[FeedDetail] Delete failed:', err);
      setDeleteError(err.message || 'Failed to delete feed record.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-farm-bg justify-center items-center">
        <ActivityIndicator size="large" color="#3D7A3A" />
        <Text className="text-xs text-farm-muted mt-3">Loading feed record details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !record) {
    return (
      <SafeAreaView className="flex-1 bg-farm-bg p-6 justify-center items-center">
        <Text className="text-3xl mb-3">⚠️</Text>
        <Text className="text-base font-bold text-farm-text mb-1">Feed Record Not Found</Text>
        <Text className="text-xs text-farm-muted text-center mb-6">{error || 'This feed record does not exist.'}</Text>
        <TouchableOpacity
          onPress={handleBackSafe}
          className="bg-farm-surface border border-farm-border px-4 py-2.5 rounded-xl"
        >
          <Text className="text-xs font-bold text-farm-text">‹ Back to Feed Records</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const speciesConfig = getSpeciesConfig(record.animal?.species);

  return (
    <SafeAreaView className="flex-1 bg-farm-bg">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={handleBackSafe}
              className="px-3 py-1.5 bg-farm-surface border border-farm-border rounded-xl hover:bg-farm-surface-2"
            >
              <Text className="text-xs font-bold text-farm-text">‹ Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDeleteModal(true)}
              className="px-3 py-1.5 bg-farm-danger-bg border border-farm-danger/20 rounded-xl hover:bg-farm-danger-bg/70"
            >
              <Text className="text-xs font-bold text-farm-danger">Delete Record</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Card */}
          <View className="bg-farm-surface border border-farm-border rounded-3xl p-5 mb-5 shadow-sm">
            <Text className="text-xs font-bold text-farm-muted uppercase tracking-widest font-mono mb-1">
              Feed & Nutrition Log
            </Text>
            <Text className="text-2xl font-bold text-farm-text mb-1">{record.base}</Text>
            <Text className="text-xs text-farm-primary font-semibold">
              Date: {record.feed_date}
            </Text>
          </View>

          {/* Feed Details Card */}
          <View className="bg-farm-surface border border-farm-border rounded-3xl p-5 gap-4 shadow-sm">
            <Text className="text-xs font-bold text-farm-muted uppercase tracking-widest font-mono">
              Nutrition Details
            </Text>

            {/* Target Animal Card */}
            {record.animal ? (
              <TouchableOpacity
                onPress={() => router.push(`/(app)/${farmId}/animals/${record.animal_id}` as any)}
                className="bg-farm-surface-2/70 border border-farm-border rounded-2xl p-4 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl">{speciesConfig.emoji}</Text>
                  <View>
                    <Text className="text-xs text-farm-muted font-mono">Target Animal</Text>
                    <Text className="text-sm font-bold text-farm-text">
                      Tag: {record.animal.sheep_id} ({record.animal.breed})
                    </Text>
                  </View>
                </View>

                <Text className="text-xs font-bold text-farm-primary">View Animal ›</Text>
              </TouchableOpacity>
            ) : null}

            <View className="flex-row flex-wrap gap-4 pt-2 border-t border-farm-border/60">
              <View className="w-[45%]">
                <Text className="text-xs text-farm-muted">Base Forage Material</Text>
                <Text className="text-sm font-bold text-farm-text">{record.base}</Text>
              </View>

              <View className="w-[45%]">
                <Text className="text-xs text-farm-muted">Nutrient Supplement</Text>
                <Text className="text-sm font-bold text-farm-text">
                  {record.nutrient_supplement || 'None'}
                </Text>
              </View>

              <View className="w-[45%]">
                <Text className="text-xs text-farm-muted">Quantity per Head</Text>
                <Text className="text-sm font-bold text-farm-text">
                  {record.quantity_per_head || 'Not recorded'}
                </Text>
              </View>

              <View className="w-[45%]">
                <Text className="text-xs text-farm-muted">Feed Date</Text>
                <Text className="text-sm font-bold text-farm-text">{record.feed_date}</Text>
              </View>
            </View>

            {record.outcome ? (
              <View className="pt-2 border-t border-farm-border/60">
                <Text className="text-xs text-farm-muted mb-1">Observed Outcome / Intake</Text>
                <Text className="text-sm font-semibold text-farm-text">{record.outcome}</Text>
              </View>
            ) : null}

            {record.notes ? (
              <View className="pt-2 border-t border-farm-border/60">
                <Text className="text-xs text-farm-muted mb-1">Additional Notes</Text>
                <Text className="text-sm text-farm-text leading-relaxed">{record.notes}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-farm-bg border border-farm-border rounded-3xl p-6 w-full max-w-sm shadow-lg">
            <Text className="text-lg font-bold text-farm-text mb-2">Delete Feed Record</Text>
            <Text className="text-xs text-farm-muted mb-4">
              Are you sure you want to delete this feed log for <Text className="font-bold text-farm-text">{record.base}</Text>?
            </Text>

            {deleteError ? (
              <View className="bg-farm-danger-bg border border-farm-danger/20 rounded-xl p-3 mb-4">
                <Text className="text-xs text-farm-danger font-bold">{deleteError}</Text>
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
                  <Text className="text-xs font-bold text-farm-inverse">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
