import { Stack } from 'expo-router';

export default function FarmLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="animals/index" />
      <Stack.Screen name="animals/new" />
      <Stack.Screen name="animals/[id]/index" />
      <Stack.Screen name="animals/[id]/edit" />
      <Stack.Screen name="vet/index" />
      <Stack.Screen name="vet/new" />
      <Stack.Screen name="vet/[id]" />
      <Stack.Screen name="feed/index" />
      <Stack.Screen name="feed/new" />
      <Stack.Screen name="feed/[id]" />
    </Stack>
  );
}
