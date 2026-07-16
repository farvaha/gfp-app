import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Btn, Muted } from './ui';
import { C, F, R } from '../constants/gfp';

export interface PhotoEstimate {
  kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  items?: any;
  raw_text?: string;
  confidence?: any;
}

const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

/**
 * The AI estimate is a starting point, not gospel — the web app lets you correct
 * every macro before saving, so we do the same.
 */
export function PhotoMealSheet({
  visible,
  estimate,
  saving,
  onCancel,
  onSave,
}: {
  visible: boolean;
  estimate: PhotoEstimate | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (v: Required<Pick<PhotoEstimate, 'kcal' | 'protein_g' | 'carbs_g' | 'fat_g'>> & {
    meal_slot: string;
    raw_text?: string;
    items?: any;
  }) => void;
}) {
  const [kcal, setKcal] = useState('0');
  const [p, setP] = useState('0');
  const [cb, setCb] = useState('0');
  const [f, setF] = useState('0');
  const [slot, setSlot] = useState('Lunch');

  useEffect(() => {
    if (!estimate) return;
    setKcal(String(Math.round(estimate.kcal ?? 0)));
    setP(String(Math.round(estimate.protein_g ?? 0)));
    setCb(String(Math.round(estimate.carbs_g ?? 0)));
    setF(String(Math.round(estimate.fat_g ?? 0)));
  }, [estimate]);

  const num = (v: string) => {
    const n = parseInt(v, 10);
    return isFinite(n) && n >= 0 ? n : 0;
  };

  const detected =
    typeof estimate?.raw_text === 'string' && estimate.raw_text
      ? estimate.raw_text
      : Array.isArray(estimate?.items)
        ? estimate!.items.map((x: any) => (typeof x === 'string' ? x : x?.name)).filter(Boolean).join(', ')
        : '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.title}>Check the numbers</Text>
            <Muted>Preiva estimated this from your photo. Correct anything that looks off.</Muted>

            {!!detected && <Text style={s.detected}>{detected}</Text>}

            <View style={s.slotRow}>
              {SLOTS.map((x) => (
                <Text
                  key={x}
                  onPress={() => setSlot(x)}
                  style={[s.slot, slot === x && s.slotOn]}
                >
                  {x}
                </Text>
              ))}
            </View>

            <Field label="Calories" unit="kcal" value={kcal} onChange={setKcal} />
            <Field label="Protein" unit="g" value={p} onChange={setP} accent={C.mint} />
            <Field label="Carbs" unit="g" value={cb} onChange={setCb} />
            <Field label="Fat" unit="g" value={f} onChange={setF} />

            <Btn
              label={saving ? 'Saving…' : 'Save meal'}
              loading={saving}
              onPress={() =>
                onSave({
                  kcal: num(kcal),
                  protein_g: num(p),
                  carbs_g: num(cb),
                  fat_g: num(f),
                  meal_slot: slot,
                  raw_text: detected || undefined,
                  items: estimate?.items,
                })
              }
              style={{ marginTop: 14 }}
            />
            <Btn label="Cancel" kind="ghost" onPress={onCancel} style={{ marginTop: 8 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  unit,
  value,
  onChange,
  accent,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  accent?: string;
}) {
  return (
    <View style={s.field}>
      <Text style={[s.fieldLabel, accent ? { color: accent } : null]}>{label}</Text>
      <View style={s.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          style={s.input}
          selectTextOnFocus
          placeholderTextColor={C.muted}
        />
        <Text style={s.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: R.lg,
    borderTopRightRadius: R.lg,
    padding: 18,
    maxHeight: '88%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  title: { color: C.ink, fontFamily: F.heading, fontSize: 18, marginBottom: 4 },
  detected: {
    color: C.ink,
    fontFamily: F.body,
    fontSize: 12,
    marginTop: 10,
    backgroundColor: C.card2,
    padding: 10,
    borderRadius: R.sm,
  },
  slotRow: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 4 },
  slot: {
    color: C.muted,
    fontFamily: F.bodyMed,
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: R.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
    overflow: 'hidden',
  },
  slotOn: { color: '#fff', backgroundColor: C.orange, borderColor: C.orange },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  fieldLabel: { color: C.ink, fontFamily: F.bodySemi, fontSize: 13 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    color: C.ink,
    fontFamily: F.bodySemi,
    fontSize: 16,
    backgroundColor: C.card2,
    borderRadius: R.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 88,
    textAlign: 'right',
  },
  unit: { color: C.muted, fontFamily: F.body, fontSize: 12, width: 32 },
});
