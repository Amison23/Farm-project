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
import { useVetRecordDetail, deleteVetRecord } from '../../../../hooks/useVetRecords';

export default function VetRecordDetailScreen() {
  const router = useRouter();
  const { farmId, id } = useLocalSearchParams<{ farmId: string; id: string }>();

  const { record, isLoading, error } = useVetRecordDetail(farmId, id);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleBackSafe = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (farmId) {
      router.replace(`/(app)/${farmId}/vet` as any);
    }
  };

  const handleDelete = async () => {
    if (!farmId || !id) return;

    try {
      setIsDeleting(true);
      setDeleteError('');
      await deleteVetRecord(farmId, id);
      setShowDeleteModal(false);
      handleBackSafe();
    } catch (err: any) {
      console.error('[VetRecordDetail] Delete error:', err);
      setDeleteError(err.message || 'Failed to delete vet record.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-farm-bg justify-center items-center">
        <ActivityIndicator size="large" color="#3D7A3A" />
        <Text className="text-xs text-farm-muted mt-3">Loading treatment record...</Text>
      </SafeAreaView>
    );
  }

  if (error || !record) {
    return (
      <SafeAreaView className="flex-1 bg-farm-bg p-6 justify-center items-center">
        <Text className="text-3xl mb-3">⚠️</Text>
        <Text className="text-base font-bold text-farm-text mb-1">Record Not Found</Text>
        <Text className="text-xs text-farm-muted text-center mb-6">{error || 'This vet record does not exist.'}</Text>
        <TouchableOpacity
          onPress={handleBackSafe}
          className="bg-farm-surface border border-farm-border px-5 py-2.5 rounded-xl"
        >
          <Text className="text-xs font-bold text-farm-text">‹ Back to Vet Logs</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
            className="px-3 py-1.5 bg-farm-danger-bg border border-farm-danger/20 rounded-xl"
          >
            <Text className="text-xs font-bold text-farm-danger">Delete Record</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View className="bg-farm-surface border border-farm-border rounded-3xl p-5 mb-5 shadow-sm">
          <Text className="text-xs font-bold text-farm-muted uppercase tracking-widest font-mono mb-1">
            Vet Treatment Record
          </Text>
          <Text className="text-2xl font-bold text-farm-text mb-1">{record.product_name}</Text>
          <Text className="text-xs text-farm-primary font-semibold">
            Treated Animal: {record.animal?.sheep_id ? `Tag ${record.animal.sheep_id}` : record.animal_id}
          </Text>
        </View>

        {/* Treatment Details Card */}
        <View className="bg-farm-surface border border-farm-border rounded-3xl p-5 gap-4">
          <Text className="text-xs font-bold text-farm-muted uppercase tracking-widest font-mono">
            Treatment Details
          </Text>

          <View className="flex-row flex-wrap gap-4">
            <View className="w-[45%]">
              <Text className="text-xs text-farm-muted">Treatment Date</Text>
              <Text className="text-sm font-bold text-farm-text font-mono">{record.treatment_date}</Text>
            </View>

            <View className="w-[45%]">
              <Text className="text-xs text-farm-muted">Administration Route</Text>
              <Text className="text-sm font-bold text-farm-text uppercase">{record.route}</Text>
            </View>

            <View className="w-[45%]">
              <Text className="text-xs text-farm-muted">Withdrawal Period</Text>
              <Text className="text-sm font-bold text-farm-warning">
                {record.withdrawal_period_days} {record.withdrawal_period_days === 1 ? 'day' : 'days'}
              </Text>
            </View>

            <View className="w-[45%]">
              <Text className="text-xs text-farm-muted">Batch Number</Text>
              <Text className="text-sm font-bold text-farm-text font-mono">
                {record.batch_number || '—'}
              </Text>
            </View>

            <View className="w-[45%]">
              <Text className="text-xs text-farm-muted">Quantity / Dose</Text>
              <Text className="text-sm font-bold text-farm-text">
                {record.quantity_administered || '—'}
              </Text>
            </View>

            <View className="w-[45%]">
              <Text className="text-xs text-farm-muted">Veterinarian</Text>
              <Text className="text-sm font-bold text-farm-text">
                {record.veterinarian_name || '—'}
              </Text>
            </View>
          </View>

          {record.reason ? (
            <View className="pt-2 border-t border-farm-border/60">
              <Text className="text-xs text-farm-muted mb-1">Diagnosis / Reason</Text>
              <Text className="text-sm font-semibold text-farm-text">{record.reason}</Text>
            </View>
          ) : null}

          {record.notes ? (
            <View className="pt-2 border-t border-farm-border/60">
              <Text className="text-xs text-farm-muted mb-1">Notes & Outcome</Text>
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
            <Text className="text-lg font-bold text-farm-text mb-2">Delete Vet Record</Text>
            <Text className="text-xs text-farm-muted mb-4">
              Are you sure you want to delete this treatment record for <Text className="font-bold text-farm-text">{record.product_name}</Text>?
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
