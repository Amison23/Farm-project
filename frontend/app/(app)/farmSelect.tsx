import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useFarm } from '../../contexts/FarmContext';

export default function FarmSelect() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { farms, isLoadingFarms, selectFarm } = useFarm();

  const handleSelectFarm = (farmId: string) => {
    selectFarm(farmId);
    router.replace(`/(app)/${farmId}` as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-farm-bg">
      <View className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1">
        {/* Header Bar */}
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className="text-xs font-medium text-farm-muted">Logged in as</Text>
            <Text className="text-lg font-bold text-farm-text">{user?.full_name || 'Farmer'}</Text>
          </View>
          <TouchableOpacity
            className="px-3 py-1.5 bg-farm-surface border border-farm-border rounded-xl hover:bg-farm-danger-bg/30"
            onPress={signOut}
          >
            <Text className="text-xs font-semibold text-farm-danger">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Main Title */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-farm-text">Select Farm</Text>
          <Text className="text-sm text-farm-muted mt-1">
            Choose a farm workspace to manage or create a new one.
          </Text>
        </View>

        {/* Farm List */}
        {isLoadingFarms ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color="#3D7A3A" />
          </View>
        ) : (
          <ScrollView className="flex-1" contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            {farms.map((farm) => (
              <TouchableOpacity
                key={farm.id}
                className="bg-farm-surface border border-farm-border rounded-2xl p-5 flex-row items-center justify-between shadow-sm hover:border-farm-primary/50"
                activeOpacity={0.7}
                onPress={() => handleSelectFarm(farm.id)}
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-xl bg-farm-primary-bg items-center justify-center">
                    <Text className="text-2xl">🚜</Text>
                  </View>
                  <View>
                    <Text className="text-base font-bold text-farm-text">{farm.name}</Text>
                    <Text className="text-xs text-farm-muted mt-0.5">
                      {farm.location || 'No location set'}
                    </Text>
                  </View>
                </View>

                {/* Role badge */}
                <View className={`px-2.5 py-1 rounded-full ${farm.role === 'owner' ? 'bg-farm-primary-bg' : 'bg-farm-surface-2'}`}>
                  <Text className={`text-xs font-semibold ${farm.role === 'owner' ? 'text-farm-primary' : 'text-farm-muted'}`}>
                    {farm.role ? farm.role.toUpperCase() : 'MEMBER'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Empty state */}
            {farms.length === 0 && (
              <View className="bg-farm-surface border border-farm-border border-dashed rounded-2xl p-8 items-center my-4">
                <Text className="text-4xl mb-3">🌾</Text>
                <Text className="text-base font-bold text-farm-text">No Farms Yet</Text>
                <Text className="text-xs text-farm-muted text-center mt-1 mb-4">
                  You don't belong to any farm workspaces yet. Create your first farm to get started.
                </Text>
              </View>
            )}

            {/* Create New Farm button */}
            <TouchableOpacity
              className="bg-farm-primary rounded-2xl py-4 items-center justify-center flex-row gap-2 mt-2 hover:opacity-90 shadow-sm"
              activeOpacity={0.8}
              onPress={() => router.push('/(app)/createFarm')}
            >
              <Text className="text-lg font-semibold text-farm-inverse">+</Text>
              <Text className="text-sm font-semibold text-farm-inverse">Create New Farm</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
