import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAwareContainer } from '../../components/ui/KeyboardAwareContainer';
import { useAuth } from '../../contexts/AuthContext';

// DEV_AUTO_LOGIN_REMOVABLE: Pre-filled credentials for development mode
const DEV_OWNER_EMAIL = 'owner@farm.com';
const DEV_OWNER_PASSWORD = 'Password123!';

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useAuth();

  // Pre-filled with owner@farm.com for development convenience
  const [email, setEmail] = useState(DEV_OWNER_EMAIL);
  const [password, setPassword] = useState(DEV_OWNER_PASSWORD);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignInWith = async (targetEmail: string, targetPass: string) => {
    if (!targetEmail || !targetPass) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await signIn(targetEmail.trim(), targetPass);
      router.replace('/(app)/farmSelect');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = () => handleSignInWith(email, password);

  return (
    <SafeAreaView className="flex-1 bg-farm-bg">
      <KeyboardAwareContainer
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 }}
        bottomOffset={20}
      >
        <View className="w-full max-w-md bg-farm-surface border border-farm-border rounded-3xl p-8 shadow-sm">
          {/* Header Logo */}
          <View className="items-center mb-6">
            <View className="w-14 h-14 rounded-2xl bg-farm-primary-bg items-center justify-center mb-3">
              <Text className="text-3xl">🌿</Text>
            </View>
            <Text className="text-2xl font-bold text-farm-text">Welcome Back</Text>
            <Text className="text-sm text-farm-muted mt-1">Sign in to your AgriTrack account</Text>
          </View>

          {/* DEV_AUTO_LOGIN_REMOVABLE: 1-Tap Quick Login Button */}
          <TouchableOpacity
            onPress={() => handleSignInWith(DEV_OWNER_EMAIL, DEV_OWNER_PASSWORD)}
            disabled={isSubmitting}
            className="mb-4 bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-base">⚡</Text>
              <View>
                <Text className="text-xs font-bold text-amber-900">Dev Quick Sign In</Text>
                <Text className="text-[11px] text-amber-700">{DEV_OWNER_EMAIL}</Text>
              </View>
            </View>
            <Text className="text-xs font-bold text-amber-800">1-Tap Login ›</Text>
          </TouchableOpacity>

          {/* Error message banner */}
          {errorMsg ? (
            <View className="bg-farm-danger-bg border border-farm-danger/20 rounded-xl p-3 mb-4">
              <Text className="text-xs text-farm-danger font-medium text-center">{errorMsg}</Text>
            </View>
          ) : null}

          {/* Inputs */}
          <View className="gap-4">
            <View>
              <Text className="text-xs font-semibold text-farm-muted uppercase tracking-wider mb-1.5">
                Email Address
              </Text>
              <TextInput
                className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text"
                placeholder="e.g. farmer@example.com"
                placeholderTextColor="#A0A090"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text className="text-xs font-semibold text-farm-muted uppercase tracking-wider mb-1.5">
                Password
              </Text>
              <TextInput
                className="bg-farm-bg border border-farm-border rounded-xl px-4 py-3 text-sm text-farm-text"
                placeholder="Enter your password"
                placeholderTextColor="#A0A090"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className="bg-farm-primary rounded-xl py-3.5 items-center justify-center mt-2"
              activeOpacity={0.8}
              onPress={handleSignIn}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-sm font-semibold text-farm-inverse">Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Footer Link */}
            <View className="flex-row items-center justify-center gap-1 mt-4">
              <Text className="text-xs text-farm-muted">Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signUp')}>
                <Text className="text-xs font-semibold text-farm-primary">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
}
