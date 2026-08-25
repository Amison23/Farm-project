import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AnimalWithParents } from '../../types/animal';
import { StatusBadge } from './StatusBadge';
import { getSpeciesConfig, getSexTerm } from '../../utils/species';

interface AnimalCardProps {
  animal: AnimalWithParents;
  onPress: () => void;
}

export const AnimalCard: React.FC<AnimalCardProps> = ({ animal, onPress }) => {
  const speciesConfig = getSpeciesConfig(animal.species);
  const sexLabel = getSexTerm(animal.sex, animal.species);
  const sexColor = animal.sex === 'male' ? 'text-blue-600 font-bold' : 'text-pink-600 font-bold';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-farm-surface border border-farm-border rounded-2xl p-4 mb-3 shadow-xs hover:border-farm-primary/40 transition-all"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl">{speciesConfig.emoji}</Text>
          <Text className="text-lg font-bold text-farm-text">{animal.sheep_id}</Text>
          <Text className={`text-xs ${sexColor}`}>({sexLabel})</Text>
        </View>

        <StatusBadge status={animal.status} />
      </View>

      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 mb-3">
        <View className="flex-row items-center gap-1">
          <Text className="text-xs text-farm-muted">Breed:</Text>
          <Text className="text-xs font-semibold text-farm-text">{animal.breed}</Text>
        </View>

        {animal.family_line ? (
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-farm-muted">Line:</Text>
            <Text className="text-xs font-semibold text-farm-text">{animal.family_line}</Text>
          </View>
        ) : null}

        {animal.birth_year ? (
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-farm-muted">Birth Year:</Text>
            <Text className="text-xs font-semibold text-farm-text">{animal.birth_year}</Text>
          </View>
        ) : animal.date_of_birth ? (
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-farm-muted">DOB:</Text>
            <Text className="text-xs font-semibold text-farm-text">{animal.date_of_birth}</Text>
          </View>
        ) : null}
      </View>

      {/* Sire / Dam lineage summary pill */}
      <View className="pt-2 border-t border-farm-border/60 flex-row items-center justify-between">
        <Text className="text-xs text-farm-muted">
          Sire: <Text className="font-medium text-farm-text">{animal.sire?.sheep_id || '—'}</Text>
        </Text>
        <Text className="text-xs text-farm-muted">
          Dam: <Text className="font-medium text-farm-text">{animal.dam?.sheep_id || '—'}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};
