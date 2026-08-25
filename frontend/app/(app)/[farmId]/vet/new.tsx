import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createVetRecord } from '../../../../hooks/useVetRecords';
import { useAnimals } from '../../../../hooks/useAnimals';
import { KeyboardAwareContainer } from '../../../../components/ui/KeyboardAwareContainer';
import { TreatmentRoute } from '../../../../types/vet';

export default function NewVetRecordScreen() {
  const router = useRouter();
  const { farmId, animalId: initialAnimalId } = useLocalSearchParams<{ farmId: string; animalId?: string }>();

  const todayStr = new Date().toISOString().split('T')[0];

  const [animalId, setAnimalId] = useState<string>(initialAnimalId || '');
  const [treatmentDate, setTreatmentDate] = useState(todayStr);
  const [productName, setProductName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [quantityAdministered, setQuantityAdministered] = useState('');
  const [route, setRoute] = useState<TreatmentRoute | null>(null);
  const [reason, setReason] = useState('');
  const [administeredBy, setAdministeredBy] = useState('');
  const [withdrawalDays, setWithdrawalDays] = useState('0');
  const [veterinarianName, setVeterinarianName] = useState('');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Animal Picker modal state
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [animalSearch, setAnimalSearch] = useState('');
  const { animals, isLoading: isLoadingAnimals } = useAnimals(farmId, { search: animalSearch || undefined });

  const selectedAnimal = animals.find((a) => a.id === animalId);

  const handleSubmit = async () => {
    if (!farmId) return;

    if (!animalId) {
      setErrorMsg('Please select an animal for this treatment record.');
      return;
    }
    if (!productName.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }
    // Mandatory warning if treatment route is omitted (User request)
    if (!route) {
      setErrorMsg('⚠️ Mandatory: Please select an administration route (Oral, Injection, Topical, or Other).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const days = withdrawalDays.trim() ? parseInt(withdrawalDays.trim(), 10) : 0;

      await createVetRecord(farmId, {
        animal_id: animalId,
        treatment_date: treatmentDate.trim() || todayStr,
        product_name: productName.trim(),
        batch_number: batchNumber.trim() || undefined,
        quantity_administered: quantityAdministered.trim() || undefined,
        route,
        reason: reason.trim() || undefined,
        administered_by: administeredBy.trim() || undefined,
        withdrawal_period_days: isNaN(days) ? 0 : days,
        veterinarian_name: veterinarianName.trim() || undefined,
        outcome: outcome.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (router.canGoBack()) {
        router.back();
      } else if (farmId) {
        router.replace(`/(app)/${farmId}/vet` as any);
      }
    } catch (err: any) {
      console.error('[NewVetRecord] Create failed:', err);
      setErrorMsg(err.message || 'Failed to log treatment record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (farmId) {
      router.replace(`/(app)/${farmId}/vet` as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-farm-bg">
      <KeyboardAwareContainer className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <TouchableOpacity
                onPress={handleCancel}
                className="px-3 py-1.5 bg-farm-surface border border-farm-border rounded-xl hover:bg-farm-surface-2"
              >
                <Text className="text-xs font-bold text-farm-text">‹ Cancel</Text>
              </TouchableOpacity>

              <Text className="text-lg font-bold text-farm-text">Log Treatment Record</Text>

              <View className="w-16" />
            </View>

            {errorMsg ? (
              <View className="bg-farm-danger-bg border border-farm-danger/20 rounded-2xl p-4 mb-4">
                <Text className="text-xs font-bold text-farm-danger">{errorMsg}</Text>
              </View>
            ) : null}

            {/* Form Card */}
            <View className="bg-farm-surface border border-farm-border rounded-3xl p-5 gap-4">
            {/* Animal Picker */}
            <View>
              <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                Treated Animal *
              </Text>
              <TouchableOpacity
                onPress={() => setShowAnimalModal(true)}
                className="bg-farm-bg border border-farm-border rounded-xl p-3 flex-row items-center justify-between"
              >
                <Text className={`text-sm ${animalId ? 'font-bold text-farm-text' : 'text-farm-muted'}`}>
                  {animalId
                    ? selectedAnimal
                      ? `Tag: ${selectedAnimal.sheep_id} (${selectedAnimal.breed})`
                      : `Selected Animal (${animalId.slice(0, 8)})`
                    : 'Select animal...'}
                </Text>
                <Text className="text-xs font-semibold text-farm-primary">Select ▾</Text>
              </TouchableOpacity>
            </View>

            {/* Treatment Date */}
            <View>
              <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                Treatment Date (YYYY-MM-DD) *
              </Text>
              <TextInput
                value={treatmentDate}
                onChangeText={setTreatmentDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#6B6B60"
                className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text font-mono"
              />
            </View>

            {/* Product Name */}
            <View>
              <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                Product / Medication Name *
              </Text>
              <TextInput
                value={productName}
                onChangeText={setProductName}
                placeholder="e.g. Ivermectin, Oxytetracycline, Albendazole"
                placeholderTextColor="#6B6B60"
                className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text font-bold"
              />
            </View>

            {/* Administration Route (Explicit validation check) */}
            <View>
              <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                Administration Route *
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { label: 'Oral 💊', value: 'oral' as TreatmentRoute },
                  { label: 'Injection 💉', value: 'injection' as TreatmentRoute },
                  { label: 'Topical 🧴', value: 'topical' as TreatmentRoute },
                  { label: 'Other 📋', value: 'other' as TreatmentRoute },
                ].map((item) => {
                  const isSelected = route === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => setRoute(item.value)}
                      className={`flex-1 min-w-[45%] py-2.5 rounded-xl border items-center ${
                        isSelected
                          ? 'bg-farm-primary border-farm-primary'
                          : 'bg-farm-bg border-farm-border'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-farm-inverse font-bold' : 'text-farm-muted'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Withdrawal Period (Days) */}
            <View className="bg-farm-warning-bg/40 border border-farm-warning/30 rounded-2xl p-4">
              <Text className="text-xs font-bold text-farm-warning uppercase tracking-wider mb-1">
                Withdrawal Period (Days)
              </Text>
              <Text className="text-[11px] text-farm-muted mb-2">
                Number of days animal products (meat/milk) cannot be sold following treatment.
              </Text>
              <TextInput
                value={withdrawalDays}
                onChangeText={setWithdrawalDays}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#6B6B60"
                className="bg-farm-surface border border-farm-border rounded-xl px-4 py-3 text-base text-farm-text font-bold font-mono"
              />
            </View>

            {/* Batch Number & Quantity */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                  Batch Number
                </Text>
                <TextInput
                  value={batchNumber}
                  onChangeText={setBatchNumber}
                  placeholder="e.g. BATCH-2024-X"
                  placeholderTextColor="#6B6B60"
                  className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text font-mono"
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                  Dose / Quantity
                </Text>
                <TextInput
                  value={quantityAdministered}
                  onChangeText={setQuantityAdministered}
                  placeholder="e.g. 5ml"
                  placeholderTextColor="#6B6B60"
                  className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text"
                />
              </View>
            </View>

            {/* Reason & Veterinarian */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                  Diagnosis / Reason
                </Text>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="e.g. Deworming, Foot rot"
                  placeholderTextColor="#6B6B60"
                  className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text"
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                  Veterinarian Name
                </Text>
                <TextInput
                  value={veterinarianName}
                  onChangeText={setVeterinarianName}
                  placeholder="Dr. Smith"
                  placeholderTextColor="#6B6B60"
                  className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text"
                />
              </View>
            </View>

            {/* Notes */}
            <View>
              <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                Treatment Notes & Outcome
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder="Additional observations or post-treatment condition..."
                placeholderTextColor="#6B6B60"
                className="bg-farm-bg border border-farm-border rounded-xl p-3 text-sm text-farm-text min-h-[80px]"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="bg-farm-primary p-4 rounded-xl items-center mt-2 shadow-xs"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-sm font-bold text-farm-inverse">Save Treatment Record</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </KeyboardAwareContainer>

      {/* Animal Selection Modal */}
      <Modal visible={showAnimalModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-farm-bg rounded-t-3xl p-5 max-h-[80%] border-t border-farm-border">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-farm-text">Select Treated Animal</Text>
              <TouchableOpacity
                onPress={() => setShowAnimalModal(false)}
                className="px-3 py-1 bg-farm-surface border border-farm-border rounded-lg"
              >
                <Text className="text-xs font-semibold text-farm-muted">Close</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={animalSearch}
              onChangeText={setAnimalSearch}
              placeholder="Search by Tag ID or Breed..."
              placeholderTextColor="#6B6B60"
              className="bg-farm-surface border border-farm-border rounded-xl px-4 py-2.5 text-sm text-farm-text mb-3"
            />

            {isLoadingAnimals ? (
              <ActivityIndicator size="small" color="#3D7A3A" className="py-6" />
            ) : (
              <FlatList
                data={animals}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setAnimalId(item.id);
                      setShowAnimalModal(false);
                    }}
                    className={`bg-farm-surface border rounded-xl p-3 mb-2 flex-row items-center justify-between ${
                      item.id === animalId ? 'border-farm-primary bg-farm-primary-bg' : 'border-farm-border'
                    }`}
                  >
                    <View>
                      <Text className="text-sm font-bold text-farm-text">{item.sheep_id}</Text>
                      <Text className="text-xs text-farm-muted">
                        {item.breed} • {item.sex === 'male' ? '♂ Ram' : '♀ Ewe'}
                      </Text>
                    </View>
                    {item.id === animalId ? (
                      <Text className="text-xs font-bold text-farm-primary">Selected ✓</Text>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
