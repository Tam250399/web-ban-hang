import { useFonts } from 'expo-font'
import BarlowCondensed_700Bold from '@expo-google-fonts/barlow-condensed/700Bold/BarlowCondensed_700Bold.ttf'
import BarlowCondensed_800ExtraBold from '@expo-google-fonts/barlow-condensed/800ExtraBold/BarlowCondensed_800ExtraBold.ttf'
import Inter_400Regular from '@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'
import Inter_500Medium from '@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'
import Inter_600SemiBold from '@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'
import Inter_700Bold from '@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'
import IBMPlexMono_500Medium from '@expo-google-fonts/ibm-plex-mono/500Medium/IBMPlexMono_500Medium.ttf'
import IBMPlexMono_600SemiBold from '@expo-google-fonts/ibm-plex-mono/600SemiBold/IBMPlexMono_600SemiBold.ttf'
import IBMPlexMono_700Bold from '@expo-google-fonts/ibm-plex-mono/700Bold/IBMPlexMono_700Bold.ttf'
import SpaceGrotesk_500Medium from '@expo-google-fonts/space-grotesk/500Medium/SpaceGrotesk_500Medium.ttf'
import SpaceGrotesk_600SemiBold from '@expo-google-fonts/space-grotesk/600SemiBold/SpaceGrotesk_600SemiBold.ttf'
import SpaceGrotesk_700Bold from '@expo-google-fonts/space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf'
import IBMPlexSans_400Regular from '@expo-google-fonts/ibm-plex-sans/400Regular/IBMPlexSans_400Regular.ttf'
import IBMPlexSans_500Medium from '@expo-google-fonts/ibm-plex-sans/500Medium/IBMPlexSans_500Medium.ttf'
import IBMPlexSans_600SemiBold from '@expo-google-fonts/ibm-plex-sans/600SemiBold/IBMPlexSans_600SemiBold.ttf'
import IBMPlexSans_700Bold from '@expo-google-fonts/ibm-plex-sans/700Bold/IBMPlexSans_700Bold.ttf'

export const fonts = {
  displayBold: 'BarlowCondensed_700Bold',
  displayExtraBold: 'BarlowCondensed_800ExtraBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: 'IBMPlexMono_500Medium',
  monoSemiBold: 'IBMPlexMono_600SemiBold',
  monoBold: 'IBMPlexMono_700Bold',
  adminDisplay: 'SpaceGrotesk_600SemiBold',
  adminDisplayBold: 'SpaceGrotesk_700Bold',
  adminBody: 'IBMPlexSans_400Regular',
  adminBodyMedium: 'IBMPlexSans_500Medium',
  adminBodySemiBold: 'IBMPlexSans_600SemiBold',
  adminBodyBold: 'IBMPlexSans_700Bold',
}

export function useAppFonts() {
  return useFonts({
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    IBMPlexMono_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  })
}
