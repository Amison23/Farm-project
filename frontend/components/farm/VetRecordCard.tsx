import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { VetRecordWithAnimal } from '../../types/vet';

interface VetRecordCardProps {
  record: VetRecordWithAnimal;
  onPress: () => void;
}

export const VetRecordCard: React.FC<VetRecordCardProps> = ({ record, onPress }) => {
  const routePills: Record<string, { label: string; color: string }> = {
    oral: { label: 'Oral', color: 'bg-green-100 text-green-800' },
    injection: { label: 'Injection', color: 'bg-purple-100 text-purple-800' },
    topical: { label: 'Topical', color: 'bg-blue-100 text-blue-800' },
    other: { label: 'Other', color: 'bg-gray-100 text-gray-800' },
  };

  const routeInfo = routePills[record.route] || routePills.other;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-farm-surface border border-farm-border rounded-2xl p-4 mb-3 shadow-xs hover:border-farm-primary/40"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold text-farm-text">
            {record.animal?.sheep_id ? `Tag: ${record.animal.sheep_id}` : `Animal ID: ${record.animal_id.slice(0, 8)}...`}
          </Text>
        </View>

        <View className={`px-2.5 py-0.5 rounded-full border border-farm-border ${routeInfo.color}`}>
          <Text className="text-[10px] font-bold uppercase tracking-wider">{routeInfo.label}</Text>
        </View>
      </View>

      <Text className="text-sm font-bold text-farm-primary mb-1">{record.product_name}</Text>

      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 mb-2">
        <View className="flex-row items-center gap-1">
          <Text className="text-xs text-farm-muted">Date:</Text>
          <Text className="text-xs font-semibold text-farm-text">{record.treatment_date}</Text>
        </View>

        {record.batch_number ? (
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-farm-muted">Batch:</Text>
            <Text className="text-xs font-mono font-medium text-farm-text">{record.batch_number}</Text>
          </View>
        ) : null}

        <View className="flex-row items-center gap-1">
          <Text className="text-xs text-farm-muted">Withdrawal:</Text>
          <Text className="text-xs font-semibold text-farm-warning">
            {record.withdrawal_period_days} {record.withdrawal_period_days === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </View>

      {record.veterinarian_name ? (
        <View className="pt-2 border-t border-farm-border/60 flex-row items-center justify-between">
          <Text className="text-xs text-farm-muted">
            Vet: <Text className="font-medium text-farm-text">{record.veterinarian_name}</Text>
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};
