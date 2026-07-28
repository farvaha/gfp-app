import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, F, R } from '../constants/gfp';
import { useLocale } from '../src/i18n/locale';

const KEY = 'gfp_personal_notes_v1';

type Note = { id: string; text: string; updated: number };

// Personal notes - a private scratchpad stored on the device only.
// Nothing here is sent to any server.
export default function NotesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { t } = useLocale();

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const list = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list)) setNotes(list);
      })
      .catch(() => {});
  }, []);

  const persist = useCallback(async (list: Note[]) => {
    setNotes(list);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(list));
    } catch {}
  }, []);

  function saveDraft() {
    const text = draft.trim();
    if (!text) return;
    if (editingId) {
      persist(notes.map((n) => (n.id === editingId ? { ...n, text, updated: Date.now() } : n)));
      setEditingId(null);
    } else {
      persist([{ id: String(Date.now()), text, updated: Date.now() }, ...notes]);
    }
    setDraft('');
  }

  function startEdit(n: Note) {
    setEditingId(n.id);
    setDraft(n.text);
  }

  function remove(id: string) {
    Alert.alert('Delete note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (editingId === id) {
            setEditingId(null);
            setDraft('');
          }
          persist(notes.filter((n) => n.id !== id));
        },
      },
    ]);
  }

  function when(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
      ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <SafeAreaView style={st.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={st.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={st.back}>{'\u2190'} {t('common.back')}</Text>
          </Pressable>
          <Text style={st.title}>{t('notes.title')}</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
          <Text style={st.hint}>{t('notes.hint')}</Text>
          {notes.length === 0 && (
            <Text style={st.empty}>{t('notes.empty')}</Text>
          )}
          {notes.map((n) => (
            <View key={n.id} style={st.note}>
              <Text style={st.noteText}>{n.text}</Text>
              <View style={st.noteRow}>
                <Text style={st.noteMeta}>{when(n.updated)}</Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Pressable onPress={() => startEdit(n)} hitSlop={8}>
                    <Text style={st.noteBtn}>{t('common.edit')}</Text>
                  </Pressable>
                  <Pressable onPress={() => remove(n.id)} hitSlop={8}>
                    <Text style={[st.noteBtn, { color: C.orange }]}>{t('common.delete')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={st.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={editingId ? t('common.edit') + '\u2026' : t('notes.write')}
            placeholderTextColor={C.muted}
            multiline
            style={st.input}
          />
          <Pressable
            onPress={saveDraft}
            style={({ pressed }) => [st.save, (pressed || !draft.trim()) && { opacity: 0.7 }]}
          >
            <Text style={st.saveTxt}>{editingId ? t('common.update') : t('common.save')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line,
  },
  back: { color: C.muted, fontFamily: F.bodyMed, fontSize: 14 },
  title: { color: C.ink, fontFamily: F.headingX, fontSize: 17 },
  body: { padding: 16, paddingBottom: 24, gap: 10 },
  hint: { color: C.muted, fontFamily: F.body, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  empty: { color: C.muted, fontFamily: F.body, fontSize: 13, marginTop: 12, textAlign: 'center' },
  note: {
    backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.line,
    padding: 12,
  },
  noteText: { color: C.ink, fontFamily: F.body, fontSize: 14, lineHeight: 20 },
  noteRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8,
  },
  noteMeta: { color: C.muted, fontFamily: F.body, fontSize: 11 },
  noteBtn: { color: C.mint, fontFamily: F.bodyMed, fontSize: 12 },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line,
    backgroundColor: C.bg,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    backgroundColor: C.card2, borderRadius: R.sm, color: C.ink,
    fontFamily: F.bodyMed, fontSize: 14, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: C.line,
  },
  save: {
    backgroundColor: C.orange, borderRadius: R.sm, paddingHorizontal: 18, paddingVertical: 12,
  },
  saveTxt: { color: '#fff', fontFamily: F.bodySemi, fontSize: 14 },
});
