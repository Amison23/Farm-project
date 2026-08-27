import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { useFarm } from '../../../contexts/FarmContext';
import { api } from '../../../services/api';
import { FarmMember } from '../../../types/farm';

export default function ActiveFarmDashboard() {
  const router = useRouter();
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const { user, signOut } = useAuth();
  const { activeFarm, selectFarm, farms } = useFarm();

  const [members, setMembers] = useState<FarmMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (farmId && activeFarm?.id !== farmId) {
      selectFarm(farmId);
    }
  }, [farmId]);

  useEffect(() => {
    if (!farmId) return;

    const fetchMembers = async () => {
      try {
        setIsLoadingMembers(true);
        setErrorMsg('');
        const res = await api.get(`/farms/${farmId}/members`);
        setMembers(res.data.data || []);
      } catch (err: any) {
        console.error('[Dashboard] Fetch members error:', err);
        setErrorMsg(err.message || 'Access denied or failed to load farm data.');
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [farmId]);

  const currentRole = farms.find(f => f.id === farmId)?.role || 'member';

  return (
    <SafeAreaView className="flex-1 bg-farm-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Navigation / Header Bar */}
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity
              className="px-3 py-1.5 bg-farm-surface border border-farm-border rounded-xl flex-row items-center gap-1 hover:bg-farm-surface-2"
              onPress={() => router.push('/(app)/farmSelect')}
            >
              <Text className="text-xs font-semibold text-farm-primary">⇄ Switch Farm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-3 py-1.5 bg-farm-surface border border-farm-border rounded-xl hover:bg-farm-danger-bg/30"
              onPress={signOut}
            >
              <Text className="text-xs font-semibold text-farm-danger">Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Farm Active Banner */}
          <View className="bg-farm-surface border border-farm-border rounded-3xl p-6 mb-6 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-bold text-farm-muted uppercase tracking-widest font-mono">
                Active Workspace
              </Text>
              <View className={`px-2.5 py-0.5 rounded-full ${currentRole === 'owner' ? 'bg-farm-primary-bg' : 'bg-farm-surface-2'}`}>
                <Text className={`text-xs font-bold ${currentRole === 'owner' ? 'text-farm-primary' : 'text-farm-muted'}`}>
                  {currentRole.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text className="text-2xl sm:text-3xl font-bold text-farm-text">{activeFarm?.name || 'Farm Workspace'}</Text>
            <Text className="text-sm text-farm-muted mt-0.5">{activeFarm?.location || 'No location set'}</Text>

            <View className="mt-4 pt-4 border-t border-farm-border flex-row items-center justify-between">
              <Text className="text-xs text-farm-muted">Farm ID:</Text>
              <Text className="text-xs font-mono font-medium text-farm-text">{farmId}</Text>
            </View>
          </View>

          {/* Access Error Banner */}
          {errorMsg ? (
            <View className="bg-farm-danger-bg border border-farm-danger/20 rounded-2xl p-4 mb-6">
              <Text className="text-sm font-bold text-farm-danger">Multi-Tenancy Guard</Text>
              <Text className="text-xs text-farm-danger mt-1">{errorMsg}</Text>
            </View>
          ) : null}

          {/* Quick Modules Grid */}
          <Text className="text-xs font-bold uppercase tracking-wider text-farm-muted font-mono mb-3">
            Farm Operations
          </Text>

          <View className="flex-row flex-wrap justify-between gap-3 mb-6">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/(app)/${farmId}/animals` as any)}
              className="w-[48%] md:w-[23.5%] bg-farm-surface border border-farm-border rounded-2xl p-4 shadow-xs hover:border-farm-primary/50"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-2xl">🐑</Text>
                <View className="px-2 py-0.5 bg-farm-primary-bg rounded-full border border-farm-primary/30">
                  <Text className="text-[10px] font-bold text-farm-primary font-mono">ACTIVE</Text>
                </View>
              </View>
              <Text className="text-sm font-bold text-farm-text">Animals</Text>
              <Text className="text-xs text-farm-muted mt-0.5">Herd & 3-Gen Pedigree</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/(app)/${farmId}/vet` as any)}
              className="w-[48%] md:w-[23.5%] bg-farm-surface border border-farm-border rounded-2xl p-4 shadow-xs hover:border-farm-primary/50"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-2xl">🩺</Text>
                <View className="px-2 py-0.5 bg-farm-warning-bg rounded-full border border-farm-warning/30">
                  <Text className="text-[10px] font-bold text-farm-warning font-mono">ACTIVE</Text>
                </View>
              </View>
              <Text className="text-sm font-bold text-farm-text">Vet Records</Text>
              <Text className="text-xs text-farm-muted mt-0.5">Treatments & Withdrawal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/(app)/${farmId}/feed` as any)}
              className="w-[48%] md:w-[23.5%] bg-farm-surface border border-farm-border rounded-2xl p-4 shadow-xs hover:border-farm-primary/50"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-2xl">🌾</Text>
                <View className="px-2 py-0.5 bg-farm-primary-bg rounded-full border border-farm-primary/30">
                  <Text className="text-[10px] font-bold text-farm-primary font-mono">ACTIVE</Text>
                </View>
              </View>
              <Text className="text-sm font-bold text-farm-text">Feed Records</Text>
              <Text className="text-xs text-farm-muted mt-0.5">Forage & Supplements</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/(app)/${farmId}/import` as any)}
              className="w-[48%] md:w-[23.5%] bg-farm-surface border border-farm-border rounded-2xl p-4 shadow-xs hover:border-farm-primary/50"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-2xl">📥</Text>
                <View className="px-2 py-0.5 bg-farm-primary-bg rounded-full border border-farm-primary/30">
                  <Text className="text-[10px] font-bold text-farm-primary font-mono">ACTIVE</Text>
                </View>
              </View>
              <Text className="text-sm font-bold text-farm-text">CSV Import</Text>
              <Text className="text-xs text-farm-muted mt-0.5">Bulk Inventory Upload</Text>
            </TouchableOpacity>
          </View>

          {/* Farm Members List */}
          <Text className="text-xs font-bold uppercase tracking-wider text-farm-muted font-mono mb-3">
            Farm Members & Access
          </Text>

          {isLoadingMembers ? (
            <ActivityIndicator size="small" color="#3D7A3A" />
          ) : (
            <View className="bg-farm-surface border border-farm-border rounded-2xl p-4 gap-3">
              {members.map((member) => (
                <View key={member.id} className="flex-row items-center justify-between py-2 border-b border-farm-border/50 last:border-b-0">
                  <View>
                    <Text className="text-sm font-bold text-farm-text">
                      {member.profile?.full_name || 'Member'}
                    </Text>
                    <Text className="text-xs text-farm-muted">
                      Joined: {new Date(member.invited_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className={`px-2.5 py-0.5 rounded-full ${member.role === 'owner' ? 'bg-farm-primary-bg' : 'bg-farm-surface-2'}`}>
                    <Text className={`text-xs font-semibold ${member.role === 'owner' ? 'text-farm-primary' : 'text-farm-muted'}`}>
                      {member.role.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
