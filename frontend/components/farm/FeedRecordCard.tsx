import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FeedRecordWithAnimal } from '../../types/feed';
import { getSpeciesConfig, getSexTerm } from '../../utils/species';

interface FeedRecordCardProps {
  record: FeedRecordWithAnimal;
  onPress: () => void;
}

export const FeedRecordCard: React.FC<FeedRecordCardProps> = ({ record, onPress }) => {
  const speciesConfig = getSpeciesConfig(record.animal?.species);
  const sexLabel = record.animal ? getSexTerm(record.animal.sex, record.animal.species) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-farm-surface border border-farm-border rounded-2xl p-4 mb-3 shadow-xs hover:border-farm-primary/40 transition-all"
    >
      {/* Header Bar */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl">🌾</Text>
          <Text className="text-base font-bold text-farm-text">{record.base}</Text>
        </View>

        <View className="px-2.5 py-1 bg-farm-primary-bg rounded-full border border-farm-primary/30">
          <Text className="text-[10px] font-bold text-farm-primary font-mono">{record.feed_date}</Text>
        </View>
      </View>

      {/* Target Animal Info */}
      {record.animal ? (
        <View className="flex-row items-center gap-2 mb-2 bg-farm-surface-2/60 px-3 py-1.5 rounded-xl border border-farm-border/60">
          <Text className="text-sm">{speciesConfig.emoji}</Text>
          <Text className="text-xs font-bold text-farm-text">Tag: {record.animal.sheep_id}</Text>
          <Text className="text-[11px] text-farm-muted">({record.animal.breed} • {sexLabel})</Text>
        </View>
      ) : (
        <View className="mb-2">
          <Text className="text-xs text-farm-muted font-mono">Animal ID: {record.animal_id.slice(0, 8)}...</Text>
        </View>
      )}

      {/* Feed Details Summary */}
      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 mt-1">
        {record.nutrient_supplement ? (
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-farm-muted">Supplement:</Text>
            <Text className="text-xs font-semibold text-farm-text">{record.nutrient_supplement}</Text>
          </View>
        ) : null}

        {record.quantity_per_head ? (
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-farm-muted">Qty / Head:</Text>
            <Text className="text-xs font-semibold text-farm-text">{record.quantity_per_head}</Text>
          </View>
        ) : null}
      </View>

      {/* Outcome / Notes Footer */}
      {record.outcome ? (
        <View className="pt-2 mt-2 border-t border-farm-border/60 flex-row items-center justify-between">
          <Text className="text-xs text-farm-muted">
            Outcome: <Text className="font-semibold text-farm-text">{record.outcome}</Text>
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};
