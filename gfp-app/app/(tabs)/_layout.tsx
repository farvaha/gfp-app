import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R } from '../../constants/gfp';

const BAR_HEIGHT = 60;

/** Raised round center button — "Build or update my plan". */
function CenterButton({ focused }: { focused: boolean }) {
  return (
    <View style={styles.centerWrap} pointerEvents="none">
      <View style={[styles.centerBtn, focused && styles.centerBtnActive]}>
        <Ionicons name="sparkles" size={26} color="#fff" />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.orange,
        tabBarInactiveTintColor: C.muted,
        // The bar was overlapping the Android nav bar because it used a fixed
        // height and ignored the bottom safe-area inset. Pad by the inset and
        // grow the bar to match, so no tab sits under the system nav.
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: F.bodyMed, fontSize: 10 },
        tabBarItemStyle: { paddingVertical: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Train',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <CenterButton focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerWrap: { alignItems: 'center', justifyContent: 'center', width: 60, height: 60 },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: R.pill,
    backgroundColor: C.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    borderWidth: 4,
    borderColor: C.bg,
    shadowColor: C.orange,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  centerBtnActive: { backgroundColor: C.orangeLight },
});
