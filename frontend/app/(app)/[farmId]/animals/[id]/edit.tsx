import React, { useState, useEffect } from 'react';
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
import { useAnimalDetail, useAnimals, updateAnimal } from '../../../../../hooks/useAnimals';
import { SireDamPicker } from '../../../../../components/farm/SireDamPicker';
import { KeyboardAwareContainer } from '../../../../../components/ui/KeyboardAwareContainer';
import { AnimalSex, AnimalStatus, AnimalSpecies, AnimalWithParents } from '../../../../../types/animal';
import { getSpeciesConfig, SPECIES_CONFIGS } from '../../../../../utils/species';

export default function EditAnimalScreen() {
  const router = useRouter();
  const { farmId, id } = useLocalSearchParams<{ farmId: string; id: string }>();

  // Target animal ID being edited (initialized from route param id)
  const [targetAnimalId, setTargetAnimalId] = useState<string>(id || '');
  const { animal, isLoading: isLoadingAnimal } = useAnimalDetail(farmId, targetAnimalId);

  // All farm animals for animal selection picker modal
  const [showAnimalPicker, setShowAnimalPicker] = useState(false);
  const [animalSearch, setAnimalSearch] = useState('');
  const { animals: farmAnimals, isLoading: isLoadingFarmAnimals } = useAnimals(farmId, {
    search: animalSearch || undefined,
  });

  // Form state
  const [species, setSpecies] = useState<AnimalSpecies>('sheep');
  const [sheepId, setSheepId] = useState('');
  const [sex, setSex] = useState<AnimalSex>('female');
  const [breed, setBreed] = useState('Dorper');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [familyLine, setFamilyLine] = useState('');
  const [status, setStatus] = useState<AnimalStatus>('active');
  const [sireId, setSireId] = useState<string | null>(null);
  const [damId, setDamId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const speciesConfig = getSpeciesConfig(species);

  // Withdrawal override state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState('');

  // Update targetAnimalId if route id changes
  useEffect(() => {
    if (id && id !== targetAnimalId) {
      setTargetAnimalId(id);
    }
  }, [id]);

  // Populate form fields whenever selected animal details are loaded
  useEffect(() => {
    if (animal) {
      setSpecies(animal.species || 'sheep');
      setSheepId(animal.sheep_id || '');
      setSex(animal.sex);
      setBreed(animal.breed || 'Dorper');
      setDateOfBirth(animal.date_of_birth || '');
      setFamilyLine(animal.family_line || '');
      setStatus(animal.status);
      setSireId(animal.sire_id);
      setDamId(animal.dam_id);
      setNotes(animal.notes || '');
    }
  }, [animal]);

  // Select an animal from the picker modal
  const handleSelectAnimal = (selected: AnimalWithParents) => {
    setTargetAnimalId(selected.id);
    setSpecies(selected.species || 'sheep');
    setSheepId(selected.sheep_id || '');
    setSex(selected.sex);
    setBreed(selected.breed || 'Dorper');
    setDateOfBirth(selected.date_of_birth || '');
    setFamilyLine(selected.family_line || '');
    setStatus(selected.status);
    setSireId(selected.sire_id);
    setDamId(selected.dam_id);
    setNotes(selected.notes || '');
    setShowAnimalPicker(false);
    setErrorMsg('');
  };

  const performUpdate = async (withOverride = false) => {
    if (!farmId || !targetAnimalId) {
      setErrorMsg('Please select an animal record to edit.');
      return;
    }
    if (!breed.trim()) {
      setErrorMsg('Breed is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setOverrideError('');

      const payload: Record<string, any> = {
        species,
        sheep_id: sheepId.trim() || undefined,
        sex,
        breed: breed.trim(),
        date_of_birth: dateOfBirth.trim() || null,
        family_line: familyLine.trim() || null,
        status,
        sire_id: sireId,
        dam_id: damId,
        notes: notes.trim() || null,
      };

      if (withOverride) {
        if (!overrideReason.trim()) {
          setOverrideError('An explicit override reason is required.');
          setIsSubmitting(false);
          return;
        }
        payload.override = true;
        payload.override_reason = overrideReason.trim();
      }

      // Explicit UPDATE call to modify existing record — NEVER creates new animal
      await updateAnimal(farmId, targetAnimalId, payload as any);

      setShowOverrideModal(false);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/(app)/${farmId}/animals/${targetAnimalId}` as any);
      }
    } catch (err: any) {
      console.error('[EditAnimal] Update failed:', err);

      if (err.code === 'WITHDRAWAL_ACTIVE') {
        setShowOverrideModal(true);
        setErrorMsg(err.message || 'Animal is currently in active withdrawal.');
      } else {
        setErrorMsg(err.message || 'Failed to update animal record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (farmId && targetAnimalId) {
      router.replace(`/(app)/${farmId}/animals/${targetAnimalId}` as any);
    } else if (farmId) {
      router.replace(`/(app)/${farmId}/animals` as any);
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

              <Text className="text-lg font-bold text-farm-text">Edit Animal Record</Text>

              <View className="w-16" />
            </View>

            {/* Target Animal Selector Banner */}
            <View className="bg-farm-surface border border-farm-border rounded-2xl p-4 mb-4 flex-row items-center justify-between shadow-xs">
              <View className="flex-1 pr-2">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-farm-muted font-mono mb-0.5">
                  Selected Record
                </Text>
                <Text className="text-sm font-bold text-farm-text">
                  {animal
                    ? `Tag: ${animal.sheep_id} (${animal.breed})`
                    : targetAnimalId
                    ? `ID: ${targetAnimalId.slice(0, 8)}...`
                    : 'No animal selected'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowAnimalPicker(true)}
                className="px-3 py-1.5 bg-farm-primary-bg border border-farm-primary/30 rounded-xl hover:bg-farm-primary-bg/70"
              >
                <Text className="text-xs font-bold text-farm-primary">Select Animal ▾</Text>
              </TouchableOpacity>
            </View>

            {errorMsg ? (
              <View className="bg-farm-danger-bg border border-farm-danger/20 rounded-2xl p-4 mb-4">
                <Text className="text-xs font-bold text-farm-danger">{errorMsg}</Text>
              </View>
            ) : null}

            {isLoadingAnimal ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="large" color="#3D7A3A" />
                <Text className="text-xs text-farm-muted mt-3">Loading animal details...</Text>
              </View>
            ) : (
              /* Form Content */
              <View className="bg-farm-surface border border-farm-border rounded-3xl p-5 gap-4">
                {/* Animal Species Selection */}
                <View>
                  <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-2">
                    Animal Species / Type *
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                    {Object.values(SPECIES_CONFIGS).map((item) => {
                      const isSelected = species === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => setSpecies(item.id)}
                          className={`px-3 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                            isSelected
                              ? 'bg-farm-primary-bg border-farm-primary'
                              : 'bg-farm-bg border-farm-border'
                          }`}
                        >
                          <Text className="text-base">{item.emoji}</Text>
                          <Text
                            className={`text-xs font-bold ${
                              isSelected ? 'text-farm-primary' : 'text-farm-text'
                            }`}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Tag / Sheep ID */}
                <View>
                  <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                    Tag ID (Client Identifier)
                  </Text>
                  <TextInput
                    value={sheepId}
                    onChangeText={setSheepId}
                    placeholder="e.g. SH-001 or DOR-102"
                    placeholderTextColor="#6B6B60"
                    className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text font-bold"
                  />
                </View>

                {/* Sex Selection */}
                <View>
                  <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                    Sex *
                  </Text>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setSex('female')}
                      className={`flex-1 p-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                        sex === 'female'
                          ? 'bg-pink-50 border-pink-400'
                          : 'bg-farm-bg border-farm-border'
                      }`}
                    >
                      <Text className="text-base">♀</Text>
                      <Text
                        className={`text-xs font-bold ${
                          sex === 'female' ? 'text-pink-700' : 'text-farm-muted'
                        }`}
                      >
                        Female ({speciesConfig.femaleTerm})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSex('male')}
                      className={`flex-1 p-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                        sex === 'male'
                          ? 'bg-blue-50 border-blue-400'
                          : 'bg-farm-bg border-farm-border'
                      }`}
                    >
                      <Text className="text-base">♂</Text>
                      <Text
                        className={`text-xs font-bold ${
                          sex === 'male' ? 'text-blue-700' : 'text-farm-muted'
                        }`}
                      >
                        Male ({speciesConfig.maleTerm})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Breed */}
                <View>
                  <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                    Breed *
                  </Text>
                  <TextInput
                    value={breed}
                    onChangeText={setBreed}
                    placeholder="e.g. Dorper, Merino, Red Maasai"
                    placeholderTextColor="#6B6B60"
                    className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text"
                  />
                </View>

                {/* Date of Birth & Family Line */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                      Date of Birth (YYYY-MM-DD)
                    </Text>
                    <TextInput
                      value={dateOfBirth}
                      onChangeText={setDateOfBirth}
                      placeholder="e.g. 2024-05-12"
                      placeholderTextColor="#6B6B60"
                      className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text font-mono"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                      Family Line (FF)
                    </Text>
                    <TextInput
                      value={familyLine}
                      onChangeText={setFamilyLine}
                      placeholder="e.g. Lineage Alpha"
                      placeholderTextColor="#6B6B60"
                      className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text"
                    />
                  </View>
                </View>

                {/* Status */}
                <View>
                  <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                    Status
                  </Text>
                  <View className="flex-row gap-2">
                    {[
                      { label: 'Active', value: 'active' as AnimalStatus },
                      { label: 'Sold', value: 'sold' as AnimalStatus },
                      { label: 'Culled', value: 'culled' as AnimalStatus },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        onPress={() => setStatus(item.value)}
                        className={`flex-1 py-2.5 rounded-xl border items-center ${
                          status === item.value
                            ? 'bg-farm-primary border-farm-primary'
                            : 'bg-farm-bg border-farm-border'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            status === item.value ? 'text-farm-inverse' : 'text-farm-muted'
                          }`}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Sire & Dam Picker */}
                <View className="pt-2 border-t border-farm-border">
                  <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-2">
                    Pedigree Parents
                  </Text>
                  <SireDamPicker
                    farmId={farmId}
                    label={speciesConfig.sireTerm}
                    targetSex="male"
                    selectedId={sireId}
                    onSelect={(selectedSireId) => setSireId(selectedSireId)}
                    excludeAnimalId={targetAnimalId}
                  />
                  <SireDamPicker
                    farmId={farmId}
                    label={speciesConfig.damTerm}
                    targetSex="female"
                    selectedId={damId}
                    onSelect={(selectedDamId) => setDamId(selectedDamId)}
                    excludeAnimalId={targetAnimalId}
                  />
                </View>

                {/* Notes */}
                <View className="pt-2 border-t border-farm-border">
                  <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                    Notes & Traits
                  </Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    placeholder="Add health notes, physical traits..."
                    placeholderTextColor="#6B6B60"
                    className="bg-farm-bg border border-farm-border rounded-xl p-3 text-sm text-farm-text min-h-[80px]"
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={() => performUpdate(false)}
                  disabled={isSubmitting}
                  className="bg-farm-primary p-4 rounded-xl items-center mt-2 shadow-xs hover:opacity-90"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-sm font-bold text-farm-inverse">Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAwareContainer>

      {/* Animal Selection Picker Modal */}
      <Modal visible={showAnimalPicker} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-farm-bg rounded-t-3xl p-5 max-h-[80%] border-t border-farm-border">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-farm-text">Select Animal to Edit</Text>
              <TouchableOpacity
                onPress={() => setShowAnimalPicker(false)}
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

            {isLoadingFarmAnimals ? (
              <ActivityIndicator size="small" color="#3D7A3A" className="py-6" />
            ) : farmAnimals.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-xs text-farm-muted">No matching animals found in farm records.</Text>
              </View>
            ) : (
              <FlatList
                data={farmAnimals}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectAnimal(item)}
                    className={`p-3 rounded-xl border mb-2 flex-row items-center justify-between ${
                      item.id === targetAnimalId
                        ? 'border-farm-primary bg-farm-primary-bg'
                        : 'border-farm-border bg-farm-surface'
                    }`}
                  >
                    <View>
                      <Text className="text-sm font-bold text-farm-text">{item.sheep_id}</Text>
                      <Text className="text-xs text-farm-muted">
                        {item.breed} • {item.sex === 'male' ? '♂ Ram' : '♀ Ewe'}
                      </Text>
                    </View>
                    {item.id === targetAnimalId ? (
                      <Text className="text-xs font-bold text-farm-primary">Selected ✓</Text>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Withdrawal Override Modal */}
      <Modal visible={showOverrideModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-farm-bg rounded-t-3xl p-6 border-t border-farm-border">
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-2xl">⚠️</Text>
              <Text className="text-lg font-bold text-farm-text">Active Withdrawal Warning</Text>
            </View>

            <Text className="text-xs text-farm-muted mb-4">
              This animal is currently under an active medical withdrawal period. Changing status to "Sold" requires an explicit owner override reason, which will be logged to farm compliance notifications.
            </Text>

            <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
              Override Reason *
            </Text>
            <TextInput
              value={overrideReason}
              onChangeText={setOverrideReason}
              placeholder="Provide reason for override..."
              placeholderTextColor="#6B6B60"
              className="bg-farm-surface border border-farm-border rounded-xl p-3 text-sm text-farm-text mb-3"
            />

            {overrideError ? (
              <Text className="text-xs text-farm-danger font-bold mb-3">{overrideError}</Text>
            ) : null}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowOverrideModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-farm-surface border border-farm-border rounded-xl items-center"
              >
                <Text className="text-xs font-bold text-farm-text">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => performUpdate(true)}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-farm-warning rounded-xl items-center"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-xs font-bold text-farm-inverse">Confirm & Override</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
