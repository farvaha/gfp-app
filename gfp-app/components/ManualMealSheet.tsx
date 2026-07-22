import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Btn, Muted } from './ui';
import { C, F, R } from '../constants/gfp';

const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

// Native 'log a meal in words' sheet. The sheet is wrapped in a
// KeyboardAvoidingView and pushed up by the keyboard height, so the text you
// are typing is always visible above the keyboard instead of hidden behind it.
export function ManualMealSheet({
  visible,
  saving,
  onCancel,
  onSave,
}: {
  visible: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: (v: { raw_text: string; meal_slot: string }) => void;
}) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [slot, setSlot] = useState('Lunch');

  useEffect(() => {
    if (visible) {
      setText('');
      setSlot('Lunch');
    }
  }, [visible]);

  const canSave = text.trim().length > 1 && !saving;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={s.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[s.sheet, { paddingBottom: 18 + insets.bottom }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.title}>Log a meal</Text>
            <Muted>Describe what you ate - Preiva estimates the calories and macros.</Muted>

            <View style={s.slotRow}>
              {SLOTS.map((x) => (
                <Pressable key={x} onPress={() => setSlot(x)} style={[s.slot, slot === x && s.slotOn]}>
                  <Text style={[s.slotTxt, slot === x && s.slotTxtOn]}>{x}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="e.g. 2 eggs, 2 toast with butter, black coffee"
              placeholderTextColor={C.muted}
              multiline
              style={s.input}
              autoFocus
            />

            <Btn
              label={saving ? 'Saving...' : 'Save meal'}
              loading={saving}
              disabled={!canSave}
              onPress={() => onSave({ raw_text: text.trim(), meal_slot: slot.toLowerCase() })}
              style={{ marginTop: 14 }}
            />
            <Btn label="Cancel" kind="ghost" onPress={onCancel} style={{ marginTop: 8 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  slotRow: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 6, flexWrap: 'wrap' },
  slot: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: R.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  slotTxt: { color: C.muted, fontFamily: F.bodyMed, fontSize: 12 },
  slotOn: { backgroundColor: C.orange, borderColor: C.orange },
  slotTxtOn: { color: '#fff' },
  input: {
    color: C.ink,
    fontFamily: F.bodyMed,
    fontSize: 15,
    backgroundColor: C.card2,
    borderRadius: R.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
    minHeight: 92,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: C.line,
  },
});
