import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAwareContainer } from '../../components/ui/KeyboardAwareContainer';
import { useFarm } from '../../contexts/FarmContext';

export default function CreateFarm() {
  const router = useRouter();
  const { createFarm } = useFarm();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setErrorMsg('Farm name is required.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const newFarm = await createFarm(name.trim(), location.trim());
      router.replace(`/(app)/${newFarm.id}` as any);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create farm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-farm-bg">
      <KeyboardAwareContainer
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 }}
        bottomOffset={20}
      >
        <View className="w-full max-w-md bg-farm-surface border border-farm-border rounded-3xl p-8 shadow-sm">
          {/* Back Button */}
          <TouchableOpacity
            className="mb-4"
            onPress={() => router.back()}
          >
            <Text className="text-xs font-semibold text-farm-primary">← Back to Farm List</Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-14 h-14 rounded-2xl bg-farm-primary-bg items-center justify-center mb-3">
              <Text className="text-3xl">🚜</Text>
            </View>
            <Text className="text-2xl font-bold text-farm-text">Create Farm</Text>
            <Text className="text-sm text-farm-muted mt-1">Set up a new farm workspace</Text>
          </View>

          {/* Error Banner */}
          {errorMsg ? (
            <View className="bg-farm-danger-bg border border-farm-danger/20 rounded-xl p-3 mb-4">
              <Text className="text-xs text-farm-danger font-medium text-center">{errorMsg}</Text>
            </View>
          ) : null}

          {/* Form Inputs */}
          <View className="gap-4">
            <View>
              <Text className="text-xs font-semibold text-farm-muted uppercase tracking-wider mb-1.5">
                Farm Name *
              </Text>
              <TextInput
                className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text"
                placeholder="e.g. Rift Valley Sheep Farm"
                placeholderTextColor="#A0A090"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View>
              <Text className="text-xs font-semibold text-farm-muted uppercase tracking-wider mb-1.5">
                Location / Region
              </Text>
              <TextInput
                className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text"
                placeholder="e.g. Naivasha, Kenya"
                placeholderTextColor="#A0A090"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className="bg-farm-primary rounded-xl py-3.5 items-center justify-center mt-2"
              activeOpacity={0.8}
              onPress={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-sm font-semibold text-farm-inverse">Create Farm Workspace</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
}
