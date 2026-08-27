import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace('/(auth)/signIn');
    } else {
      router.replace('/(app)/farmSelect');
    }
  }, [session, isLoading]);

  return (
    <SafeAreaView className="flex-1 bg-farm-bg items-center justify-center">
      <View className="items-center gap-3">
        <ActivityIndicator size="large" color="#3D7A3A" />
        <Text className="text-sm font-semibold text-farm-muted">Loading AgriTrack...</Text>
      </View>
    </SafeAreaView>
  );
}
