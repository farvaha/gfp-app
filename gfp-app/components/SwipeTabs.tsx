import React, { useMemo, useRef } from 'react';
import { PanResponder, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

// Order of the bottom tabs; swiping left moves forward, right moves back.
const ORDER = ['/', '/train', '/plan', '/history', '/account'];

/** Wrap a tab screen to enable horizontal swipe navigation between tabs.
 *  Vertical scrolling and taps keep working: the responder only claims
 *  clearly-horizontal drags, and child horizontal scrollers win first. */
export function SwipeTabs({ children, style }: { children: React.ReactNode; style?: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > 28 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderTerminationRequest: () => true,
        onPanResponderRelease: (_e, g) => {
          if (Math.abs(g.dx) < 56 || Math.abs(g.dx) < Math.abs(g.dy) * 1.5) return;
          const cur = ORDER.indexOf(pathRef.current);
          if (cur < 0) return;
          const next = g.dx < 0 ? cur + 1 : cur - 1;
          if (next < 0 || next >= ORDER.length) return;
          router.replace(ORDER[next] as any);
        },
      }),
    [router]
  );

  return (
    <View style={[{ flex: 1 }, style]} {...pan.panHandlers}>
      {children}
    </View>
  );
}
