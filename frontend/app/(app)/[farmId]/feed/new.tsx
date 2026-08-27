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
import { useAnimals, createAnimal } from '../../../../hooks/useAnimals';
import { createFeedRecord } from '../../../../hooks/useFeedRecords';
import { KeyboardAwareContainer } from '../../../../components/ui/KeyboardAwareContainer';
import { getSpeciesConfig, getSexTerm } from '../../../../utils/species';
import { AnimalWithParents } from '../../../../types/animal';

export default function NewFeedRecordScreen() {
  const router = useRouter();
  const { farmId, animalId: paramAnimalId } = useLocalSearchParams<{ farmId: string; animalId?: string }>();

  const [animalId, setAnimalId] = useState<string>(paramAnimalId || '');
  const [animalSearch, setAnimalSearch] = useState('');
  const [showAnimalModal, setShowAnimalModal] = useState(false);

  const { animals, isLoading: isLoadingAnimals } = useAnimals(farmId, { search: animalSearch || undefined });
  const selectedAnimal = animals.find((a) => a.id === animalId);

  const [feedDate, setFeedDate] = useState(new Date().toISOString().split('T')[0]);
  const [base, setBase] = useState('Lucerne');
  const [nutrientSupplement, setNutrientSupplement] = useState('');
  const [quantityPerHead, setQuantityPerHead] = useState('');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!farmId) return;
    if (!animalId) {
      setErrorMsg('Please select an animal.');
      return;
    }
    if (!base.trim()) {
      setErrorMsg('Base forage material is required.');
      return;
    }
    if (!feedDate.trim()) {
      setErrorMsg('Feed date is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      await createFeedRecord(farmId, {
        animal_id: animalId,
        feed_date: feedDate.trim(),
        base: base.trim(),
        nutrient_supplement: nutrientSupplement.trim() || undefined,
        quantity_per_head: quantityPerHead.trim() || undefined,
        outcome: outcome.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (router.canGoBack()) {
        router.back();
      } else if (farmId) {
        router.replace(`/(app)/${farmId}/feed` as any);
      }
    } catch (err: any) {
      console.error('[NewFeedRecord] Create failed:', err);
      setErrorMsg(err.message || 'Failed to log feed record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (farmId) {
      router.replace(`/(app)/${farmId}/feed` as any);
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

              <Text className="text-lg font-bold text-farm-text">Log Feed Record</Text>

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
                  Target Animal *
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAnimalModal(true)}
                  className="bg-farm-bg border border-farm-border rounded-xl p-3 flex-row items-center justify-between"
                >
                  <Text className={`text-sm ${animalId ? 'font-bold text-farm-text' : 'text-farm-muted'}`}>
                    {animalId
                      ? selectedAnimal
                        ? `${getSpeciesConfig(selectedAnimal.species).emoji} Tag: ${selectedAnimal.sheep_id} (${selectedAnimal.breed})`
                        : `Selected Animal (${animalId.slice(0, 8)})`
                      : 'Select animal...'}
                  </Text>
                  <Text className="text-xs font-semibold text-farm-primary">Select ▾</Text>
                </TouchableOpacity>
              </View>

              {/* Feed Date */}
              <View>
                <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                  Feed Date (YYYY-MM-DD) *
                </Text>
                <TextInput
                  value={feedDate}
                  onChangeText={setFeedDate}
                  placeholder="e.g. 2026-08-25"
                  placeholderTextColor="#6B6B60"
                  className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text font-mono"
                />
              </View>

              {/* Base Forage Material */}
              <View>
                <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                  Base Forage / Main Feed *
                </Text>
                <TextInput
                  value={base}
                  onChangeText={setBase}
                  placeholder="e.g. Lucerne, Rhodes Grass Hay, Napier, Silage"
                  placeholderTextColor="#6B6B60"
                  className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text font-bold"
                />
              </View>

              {/* Nutrient Supplement & Quantity */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                    Nutrient Supplement
                  </Text>
                  <TextInput
                    value={nutrientSupplement}
                    onChangeText={setNutrientSupplement}
                    placeholder="e.g. Mineral Block, Salt"
                    placeholderTextColor="#6B6B60"
                    className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                    Qty / Head
                  </Text>
                  <TextInput
                    value={quantityPerHead}
                    onChangeText={setQuantityPerHead}
                    placeholder="e.g. 2.5 kg or 500g"
                    placeholderTextColor="#6B6B60"
                    className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text"
                  />
                </View>
              </View>

              {/* Outcome */}
              <View>
                <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                  Observed Outcome / Intake
                </Text>
                <TextInput
                  value={outcome}
                  onChangeText={setOutcome}
                  placeholder="e.g. Good intake, 100% consumed, weight gain..."
                  placeholderTextColor="#6B6B60"
                  className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text"
                />
              </View>

              {/* Notes */}
              <View>
                <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                  Additional Notes
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  placeholder="Additional feeding observations or digestion notes..."
                  placeholderTextColor="#6B6B60"
                  className="bg-farm-bg border border-farm-border rounded-xl p-3 text-sm text-farm-text min-h-[80px]"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className="bg-farm-primary p-4 rounded-xl items-center mt-2 shadow-xs hover:opacity-90"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-sm font-bold text-farm-inverse">Save Feed Record</Text>
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
              <Text className="text-lg font-bold text-farm-text">Select Animal</Text>
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
            ) : animals.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-xs text-farm-muted">No matching animals found.</Text>
              </View>
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
                    className={`p-3 rounded-xl border mb-2 flex-row items-center justify-between ${
                      item.id === animalId ? 'border-farm-primary bg-farm-primary-bg' : 'border-farm-border bg-farm-surface'
                    }`}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg">{getSpeciesConfig(item.species).emoji}</Text>
                      <View>
                        <Text className="text-sm font-bold text-farm-text">{item.sheep_id}</Text>
                        <Text className="text-xs text-farm-muted">
                          {item.breed} • {getSexTerm(item.sex, item.species)}
                        </Text>
                      </View>
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
