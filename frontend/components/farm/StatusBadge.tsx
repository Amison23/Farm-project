import React from 'react';
import { View, Text } from 'react-native';
import { AnimalStatus } from '../../types/animal';

interface StatusBadgeProps {
  status: AnimalStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  let bgClass = 'bg-farm-surface-2 border-farm-border';
  let textClass = 'text-farm-muted';
  let label = status.toUpperCase();

  switch (status) {
    case 'active':
      bgClass = 'bg-farm-success-bg border border-farm-success/20';
      textClass = 'text-farm-success';
      label = 'ACTIVE';
      break;
    case 'sold':
      bgClass = 'bg-farm-surface-2 border border-farm-border';
      textClass = 'text-farm-muted';
      label = 'SOLD';
      break;
    case 'culled':
      bgClass = 'bg-farm-danger-bg border border-farm-danger/20';
      textClass = 'text-farm-danger';
      label = 'CULLED';
      break;
  }

  const paddingClass = size === 'md' ? 'px-3 py-1' : 'px-2 py-0.5';
  const textSizeClass = size === 'md' ? 'text-xs font-bold' : 'text-[10px] font-bold';

  return (
    <View className={`rounded-full ${bgClass} ${paddingClass} self-start items-center justify-center`}>
      <Text className={`${textClass} ${textSizeClass} uppercase tracking-wider`}>{label}</Text>
    </View>
  );
};
