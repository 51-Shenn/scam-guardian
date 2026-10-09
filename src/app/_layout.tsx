import '@/global.css';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { HedvigLettersSerif_400Regular } from '@expo-google-fonts/hedvig-letters-serif';
import { HedvigLettersSans_400Regular } from '@expo-google-fonts/hedvig-letters-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [loaded, error] = useFonts({ HedvigLettersSerif: HedvigLettersSerif_400Regular, HedvigLettersSans: HedvigLettersSans_400Regular });
  useEffect(() => { if (loaded || error) SplashScreen.hideAsync(); }, [loaded, error]);
  if (!loaded && !error) return null;
  return <SafeAreaProvider><SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7FC' }}>
    <StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F4F7FC' } }} />
  </SafeAreaView></SafeAreaProvider>;
}
