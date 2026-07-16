import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { C, F, R } from '../constants/gfp';

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={s.h1}>{children}</Text>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <Text style={s.h2}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={s.muted}>{children}</Text>;
}

export function Btn({
  label,
  onPress,
  kind = 'primary',
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'mint';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg =
    kind === 'primary' ? C.orange : kind === 'mint' ? C.mint : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        {
          backgroundColor: bg,
          borderWidth: kind === 'ghost' ? 1 : 0,
          borderColor: C.line,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={kind === 'ghost' ? C.ink : '#0c0f12'} />
      ) : (
        <Text
          style={[
            s.btnLabel,
            { color: kind === 'ghost' ? C.ink : '#0c0f12' },
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function MacroBar({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={s.macroRow}>
        <Text style={s.macroLabel}>{label}</Text>
        <Text style={s.macroVal}>
          {Math.round(value)} / {Math.round(target)}
        </Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.chip,
        active && { backgroundColor: 'rgba(255,106,43,0.15)', borderColor: C.orange },
      ]}>
      <Text style={[s.chipLabel, active && { color: C.orangeLight }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.line,
    padding: 16,
    marginBottom: 14,
  },
  h1: { color: C.ink, fontFamily: F.headingX, fontSize: 26, marginBottom: 4 },
  h2: { color: C.ink, fontFamily: F.heading, fontSize: 17, marginBottom: 10 },
  muted: { color: C.muted, fontFamily: F.body, fontSize: 13, lineHeight: 19 },
  btn: {
    borderRadius: R.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: { fontFamily: F.bodySemi, fontSize: 15 },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  macroLabel: { color: C.ink, fontFamily: F.bodyMed, fontSize: 13 },
  macroVal: { color: C.muted, fontFamily: F.body, fontSize: 13 },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: C.card2,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4 },
  chip: {
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipLabel: { color: C.muted, fontFamily: F.bodyMed, fontSize: 13 },
});
