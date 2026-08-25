import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createAnimal } from '../../../../hooks/useAnimals';
import { ParentPicker } from '../../../../components/farm/ParentPicker';
import { KeyboardAwareContainer } from '../../../../components/ui/KeyboardAwareContainer';
import { AnimalSex, AnimalStatus, AnimalSpecies } from '../../../../types/animal';
import { getSexTerm, getSpeciesConfig, SPECIES_CONFIGS } from '../../../../utils/species';

export default function NewAnimalScreen() {
  const router = useRouter();
  const { farmId } = useLocalSearchParams<{ farmId: string }>();

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

  const handleSubmit = async () => {
    if (!farmId) return;
    if (!breed.trim()) {
      setErrorMsg('Breed is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      await createAnimal(farmId, {
        species,
        sheep_id: sheepId.trim() || undefined,
        sex,
        breed: breed.trim(),
        date_of_birth: dateOfBirth.trim() || undefined,
        family_line: familyLine.trim() || undefined,
        status,
        sire_id: sireId,
        dam_id: damId,
        notes: notes.trim() || undefined,
      });

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/(app)/${farmId}/animals` as any);
      }
    } catch (err: any) {
      console.error('[NewAnimal] Create failed:', err);
      setErrorMsg(err.message || 'Failed to create animal record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
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

              <Text className="text-lg font-bold text-farm-text">Add Animal Record</Text>

              <View className="w-16" />
            </View>

            {errorMsg ? (
              <View className="bg-farm-danger-bg border border-farm-danger/20 rounded-2xl p-4 mb-4">
                <Text className="text-xs font-bold text-farm-danger">{errorMsg}</Text>
              </View>
            ) : null}

            {/* Form Content */}
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
                        onPress={() => {
                          setSpecies(item.id);
                          if (item.id === 'cattle' && breed === 'Dorper') setBreed('Friesian');
                          if (item.id === 'goat' && breed === 'Dorper') setBreed('Boer');
                        }}
                        className={`px-3 py-2 rounded-xl border flex-row items-center gap-1.5 ${isSelected
                            ? 'bg-farm-primary-bg border-farm-primary'
                            : 'bg-farm-bg border-farm-border'
                          }`}
                      >
                        <Text className="text-base">{item.emoji}</Text>
                        <Text
                          className={`text-xs font-bold ${isSelected ? 'text-farm-primary' : 'text-farm-text'
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
                  Tag ID (Optional — Auto-generated if left blank)
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
                    className={`flex-1 p-3 rounded-xl border flex-row items-center justify-center gap-2 ${sex === 'female'
                        ? 'bg-pink-50 border-pink-400'
                        : 'bg-farm-bg border-farm-border'
                      }`}
                  >
                    <Text className="text-base">♀</Text>
                    <Text
                      className={`text-xs font-bold ${sex === 'female' ? 'text-pink-700' : 'text-farm-muted'
                        }`}
                    >
                      Female ({speciesConfig.femaleTerm})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSex('male')}
                    className={`flex-1 p-3 rounded-xl border flex-row items-center justify-center gap-2 ${sex === 'male'
                        ? 'bg-blue-50 border-blue-400'
                        : 'bg-farm-bg border-farm-border'
                      }`}
                  >
                    <Text className="text-base">♂</Text>
                    <Text
                      className={`text-xs font-bold ${sex === 'male' ? 'text-blue-700' : 'text-farm-muted'
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
                  Initial Status
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
                      className={`flex-1 py-2.5 rounded-xl border items-center ${status === item.value
                          ? 'bg-farm-primary border-farm-primary'
                          : 'bg-farm-bg border-farm-border'
                        }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${status === item.value ? 'text-farm-inverse' : 'text-farm-muted'
                          }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Pedigree Selection (Sire & Dam) */}
              <View className="pt-2 border-t border-farm-border">
                <Text className="text-xs font-bold text-farm-text uppercase tracking-widest font-mono mb-3">
                  Pedigree Lineage (Optional)
                </Text>

                {farmId ? (
                  <>
                    <ParentPicker
                      farmId={farmId}
                      species={species}
                      label={speciesConfig.sireTerm}
                      targetSex="male"
                      selectedId={sireId}
                      onSelect={(selectedSireId: string | null) => setSireId(selectedSireId)}
                    />

                    <ParentPicker
                      farmId={farmId}
                      species={species}
                      label={speciesConfig.damTerm}
                      targetSex="female"
                      selectedId={damId}
                      onSelect={(selectedDamId: string | null) => setDamId(selectedDamId)}
                    />
                  </>
                ) : null}
              </View>

              {/* Notes */}
              <View>
                <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
                  Notes / History
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  placeholder="Add any health notes, physical traits, or breeding history..."
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
                  <Text className="text-sm font-bold text-farm-inverse">Save Animal Record</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
}
