import React, { useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { C, F } from '../constants/gfp';

/**
 * Full wp-admin, inside the locked owner app. This is the "everything else"
 * escape hatch - any control not yet native lives here. You log into
 * WordPress inside this view once; the session persists on this device.
 */
export default function WpAdmin() {
  const router = useRouter();
  const ref = useRef<WebView>(null);
  const [canBack, setCanBack] = useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canBack && ref.current) {
        ref.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canBack]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <View style={st.bar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={st.close}>{'\u2190'} App</Text>
        </Pressable>
        <Text style={st.title}>wp-admin</Text>
        <Pressable onPress={() => ref.current?.reload()} hitSlop={12}>
          <Text style={st.close}>Reload</Text>
        </Pressable>
      </View>
      <WebView
        ref={ref}
        source={{ uri: 'https://getfitplans.com/wp-admin/' }}
        onNavigationStateChange={(nav) => setCanBack(nav.canGoBack)}
        sharedCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        style={{ backgroundColor: C.bg }}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line,
  },
  close: { color: C.mint, fontFamily: F.bodyMed, fontSize: 13 },
  title: { color: C.ink, fontFamily: F.headingX, fontSize: 15 },
});
