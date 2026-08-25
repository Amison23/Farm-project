import React from 'react';
import { View, Text } from 'react-native';

interface WithdrawalBadgeProps {
  withdrawalEndDate: string;
  size?: 'sm' | 'md';
}

export const WithdrawalBadge: React.FC<WithdrawalBadgeProps> = ({ withdrawalEndDate, size = 'sm' }) => {
  const textSize = size === 'md' ? 'text-xs' : 'text-[10px]';
  const padding = size === 'md' ? 'px-3 py-1' : 'px-2 py-0.5';

  return (
    <View className={`bg-farm-warning-bg border border-farm-warning/30 rounded-full ${padding} flex-row items-center gap-1 self-start`}>
      <Text className="text-xs">⏳</Text>
      <Text className={`font-bold text-farm-warning ${textSize}`}>
        Withdrawal until {withdrawalEndDate}
      </Text>
    </View>
  );
};
