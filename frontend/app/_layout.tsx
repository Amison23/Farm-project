import '../utils/keyboardPolyfill';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider } from '../contexts/AuthContext';
import '../global.css';

export default function RootLayout() {
  if (Platform.OS === 'web') {
    return (
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    );
  }

  return (
    <KeyboardProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </KeyboardProvider>
  );
}
