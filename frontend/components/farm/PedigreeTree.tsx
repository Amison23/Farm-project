import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LineageNode } from '../../types/animal';
import { getSexTerm, getSpeciesConfig } from '../../utils/species';

interface PedigreeTreeProps {
  lineage: LineageNode;
  onAnimalPress?: (animalId: string) => void;
}

interface PedigreeCardProps {
  node?: LineageNode | null;
  role: string;
  generation: 1 | 2 | 3;
  onPress?: (id: string) => void;
}

const PedigreeCard: React.FC<PedigreeCardProps> = ({ node, role, generation, onPress }) => {
  if (!node) {
    return (
      <View className="bg-farm-surface-2 border border-farm-border border-dashed rounded-xl p-2.5 items-center justify-center flex-1 my-1 min-h-[54px]">
        <Text className="text-[10px] font-bold text-farm-muted uppercase font-mono">{role}</Text>
        <Text className="text-xs text-farm-muted italic">Unknown</Text>
      </View>
    );
  }

  const isMale = node.sex === 'male';
  const badgeBg = isMale ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200';
  const badgeText = isMale ? 'text-blue-700' : 'text-pink-700';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={() => onPress && onPress(node.id)}
      className="bg-farm-surface border border-farm-border rounded-xl p-2.5 flex-1 my-1 shadow-xs min-h-[54px] justify-center"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] font-bold text-farm-muted uppercase font-mono">{role}</Text>
        <View className={`px-1.5 py-0.2 rounded ${badgeBg} border`}>
          <Text className={`text-[9px] font-bold ${badgeText}`}>
            {isMale ? '♂ SIRE' : '♀ DAM'}
          </Text>
        </View>
      </View>
      <Text className="text-xs font-bold text-farm-text mt-0.5" numberOfLines={1}>
        {node.sheep_id}
      </Text>
      <Text className="text-[10px] text-farm-muted" numberOfLines={1}>
        {node.breed}
      </Text>
    </TouchableOpacity>
  );
};

export const PedigreeTree: React.FC<PedigreeTreeProps> = ({ lineage, onAnimalPress }) => {
  return (
    <View className="bg-farm-surface border border-farm-border rounded-2xl p-4 my-2">
      <Text className="text-xs font-bold text-farm-muted uppercase tracking-widest font-mono mb-3">
        3-Generation Pedigree Chain
      </Text>

      <View className="gap-3">
        {/* Gen 1: Self */}
        <View className="bg-farm-primary-bg border border-farm-primary/30 rounded-xl p-3">
          <Text className="text-[10px] font-bold text-farm-primary uppercase font-mono">
            Subject Animal
          </Text>
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-lg">{getSpeciesConfig(lineage.species).emoji}</Text>
              <Text className="text-base font-bold text-farm-text">
                {lineage.sheep_id} ({getSexTerm(lineage.sex, lineage.species)})
              </Text>
            </View>
            <Text className="text-xs font-semibold text-farm-primary">{lineage.breed}</Text>
          </View>
          {lineage.family_line ? (
            <Text className="text-xs text-farm-muted mt-0.5">Line: {lineage.family_line}</Text>
          ) : null}
        </View>

        {/* Gen 2 & Gen 3 Diagram Grid */}
        <View className="flex-row gap-2">
          {/* Sire Branch (Parents + Paternal Grandparents) */}
          <View className="flex-1 bg-farm-surface-2/60 border border-farm-border rounded-xl p-2">
            <Text className="text-[10px] font-bold text-blue-700 uppercase font-mono mb-1 text-center">
              Paternal Line (Father)
            </Text>

            <PedigreeCard
              node={lineage.sire}
              role="Sire (Father)"
              generation={2}
              onPress={onAnimalPress}
            />

            <View className="mt-1 pt-1 border-t border-farm-border/60">
              <Text className="text-[9px] font-semibold text-farm-muted uppercase font-mono mb-1">
                Grandparents
              </Text>
              <PedigreeCard
                node={lineage.sire?.sire}
                role="Pat. Grandsire"
                generation={3}
                onPress={onAnimalPress}
              />
              <PedigreeCard
                node={lineage.sire?.dam}
                role="Pat. Granddam"
                generation={3}
                onPress={onAnimalPress}
              />
            </View>
          </View>

          {/* Dam Branch (Parents + Maternal Grandparents) */}
          <View className="flex-1 bg-farm-surface-2/60 border border-farm-border rounded-xl p-2">
            <Text className="text-[10px] font-bold text-pink-700 uppercase font-mono mb-1 text-center">
              Maternal Line (Mother)
            </Text>

            <PedigreeCard
              node={lineage.dam}
              role="Dam (Mother)"
              generation={2}
              onPress={onAnimalPress}
            />

            <View className="mt-1 pt-1 border-t border-farm-border/60">
              <Text className="text-[9px] font-semibold text-farm-muted uppercase font-mono mb-1">
                Grandparents
              </Text>
              <PedigreeCard
                node={lineage.dam?.sire}
                role="Mat. Grandsire"
                generation={3}
                onPress={onAnimalPress}
              />
              <PedigreeCard
                node={lineage.dam?.dam}
                role="Mat. Granddam"
                generation={3}
                onPress={onAnimalPress}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
