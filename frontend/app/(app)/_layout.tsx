import { Stack } from 'expo-router';
import { FarmProvider } from '../../contexts/FarmContext';

export default function AppLayout() {
  return (
    <FarmProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </FarmProvider>
  );
}
