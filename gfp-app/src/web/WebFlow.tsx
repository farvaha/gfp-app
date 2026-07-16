import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { C } from '../../constants/gfp';

// Injected into every page: harvests the WordPress REST nonce (exposed on the
// Companion page as window.GFP_COMPANION.nonce or wpApiSettings.nonce) and posts
// it back to native. Also reports when the user reaches a logged-in state.
const BRIDGE = `
(function () {
  function grab() {
    try {
      var n = (window.GFP_COMPANION && window.GFP_COMPANION.nonce)
           || (window.wpApiSettings && window.wpApiSettings.nonce) || null;
      var loggedIn = /Log ?out|Logout/i.test(document.body.innerText || '');
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'gfp-auth', nonce: n, loggedIn: loggedIn, url: location.href
      }));
    } catch (e) {}
  }
  grab();
  // Re-check shortly after load in case nonce is set late by app JS.
  setTimeout(grab, 800);
  setTimeout(grab, 2000);
  true;
})();
`;

type Props = {
  uri: string;
  // Fired whenever we detect a logged-in page + (maybe) a nonce.
  onAuth?: (payload: { nonce: string | null; loggedIn: boolean; url: string }) => void;
  // Fired on every navigation so parents can react to reaching e.g. /companion/.
  onNavigate?: (nav: WebViewNavigation) => void;
  style?: any;
};

export default function WebFlow({ uri, onAuth, onNavigate, style }: Props) {
  const [loading, setLoading] = useState(true);

  const onMessage = useCallback((e: any) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data && data.type === 'gfp-auth') {
        onAuth?.({ nonce: data.nonce ?? null, loggedIn: !!data.loggedIn, url: data.url });
      }
    } catch {}
  }, [onAuth]);

  return (
    <View style={[styles.fill, style]}>
      <WebView
        source={{ uri }}
        originWhitelist={['https://getfitplans.com', 'https://*.getfitplans.com']}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        injectedJavaScript={BRIDGE}
        onMessage={onMessage}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(nav: WebViewNavigation) => onNavigate?.(nav)}
        pullToRefreshEnabled
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        style={styles.web}
      />
      {loading && (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator color={C.orange} size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
  web: { flex: 1, backgroundColor: C.bg },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },
});
