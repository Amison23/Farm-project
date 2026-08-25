import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { AnimalWithParents, AnimalSex, AnimalSpecies } from '../../types/animal';
import { useAnimals } from '../../hooks/useAnimals';
import { getSexTerm, getSpeciesConfig } from '../../utils/species';

export interface ParentPickerProps {
  farmId: string;
  label: string;
  targetSex: AnimalSex;
  species?: AnimalSpecies;
  selectedId: string | null;
  onSelect: (animalId: string | null, sheepId?: string | null) => void;
  excludeAnimalId?: string;
}

export const ParentPicker: React.FC<ParentPickerProps> = ({
  farmId,
  label,
  targetSex,
  species,
  selectedId,
  onSelect,
  excludeAnimalId,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const speciesConfig = getSpeciesConfig(species);

  const { animals, isLoading } = useAnimals(farmId, {
    species,
    sex: targetSex,
    search: search.trim() || undefined,
    limit: 50,
  });

  const availableAnimals = animals.filter((a) => a.id !== excludeAnimalId);
  const selectedAnimal = availableAnimals.find((a) => a.id === selectedId);
  const targetSexTerm = getSexTerm(targetSex, species);

  return (
    <View className="mb-4">
      <Text className="text-xs font-bold text-farm-muted uppercase tracking-wider mb-1">
        {label}
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        className="bg-farm-surface border border-farm-border rounded-xl px-4 py-3 flex-row items-center justify-between"
      >
        <Text className={`text-sm ${selectedId ? 'font-bold text-farm-text' : 'text-farm-muted'}`}>
          {selectedId
            ? selectedAnimal
              ? `${selectedAnimal.sheep_id} (${selectedAnimal.breed})`
              : `ID: ${selectedId}`
            : `Select ${label}...`}
        </Text>
        <Text className="text-xs font-semibold text-farm-primary">Change ▾</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-farm-bg rounded-t-3xl p-5 max-h-[80%] border-t border-farm-border">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-farm-text">Select {label}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="px-3 py-1 bg-farm-surface border border-farm-border rounded-lg"
              >
                <Text className="text-xs font-semibold text-farm-muted">Close</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={`Search ${targetSexTerm} candidates by Tag ID or Breed...`}
              placeholderTextColor="#6B6B60"
              className="bg-farm-surface border border-farm-border rounded-xl px-4 py-2.5 text-sm text-farm-text mb-3"
            />

            {/* Option to Clear Selection */}
            <TouchableOpacity
              onPress={() => {
                onSelect(null, null);
                setModalVisible(false);
              }}
              className="bg-farm-surface-2 border border-farm-border rounded-xl p-3 mb-3 items-center"
            >
              <Text className="text-xs font-semibold text-farm-danger">No {label} (Unknown / None)</Text>
            </TouchableOpacity>

            {isLoading ? (
              <ActivityIndicator size="small" color="#3D7A3A" className="py-6" />
            ) : availableAnimals.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-sm font-medium text-farm-muted">
                  No matching {targetSexTerm} candidates found for {speciesConfig.label} on this farm.
                </Text>
              </View>
            ) : (
              <FlatList
                data={availableAnimals}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = item.id === selectedId;
                  const candidateSexTerm = getSexTerm(item.sex, item.species || species);
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        onSelect(item.id, item.sheep_id);
                        setModalVisible(false);
                      }}
                      className={`bg-farm-surface border rounded-xl p-3 mb-2 flex-row items-center justify-between ${
                        isSelected ? 'border-farm-primary bg-farm-primary-bg' : 'border-farm-border'
                      }`}
                    >
                      <View>
                        <Text className="text-sm font-bold text-farm-text">{item.sheep_id}</Text>
                        <Text className="text-xs text-farm-muted">
                          {item.breed} • {candidateSexTerm} candidate
                        </Text>
                      </View>
                      {isSelected ? (
                        <Text className="text-xs font-bold text-farm-primary">Selected ✓</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

