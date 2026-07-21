import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Api } from '../src/api/client';
import { C, F, R } from '../constants/gfp';

type Msg = { id: string; role: 'user' | 'preiva'; text: string };
const HISTORY_KEY = 'cache:preiva_history';

export default function Preiva() {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const list = useRef<FlatList<Msg>>(null);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY)
      .then((v) => v && setMsgs(JSON.parse(v)))
      .catch(() => {});
  }, []);

  const persist = (m: Msg[]) => {
    setMsgs(m);
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(m.slice(-60))).catch(() => {});
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    const next: Msg[] = [...msgs, { id: `u${Date.now()}`, role: 'user', text }];
    persist(next);
    setBusy(true);
    try {
      const res = await Api.chat({ question: text });
      const reply = (res && (res.reply || res.answer || res.text)) || "…";
      persist([...next, { id: `p${Date.now()}`, role: 'preiva', text: reply }]);
    } catch (e: any) {
      persist([
        ...next,
        {
          id: `e${Date.now()}`,
          role: 'preiva',
          text: e?.message || "Couldn't reach Preiva. Try again.",
        },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => list.current?.scrollToEnd({ animated: true }), 60);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.backBar}>
        <Ionicons name="chevron-back" size={22} color={C.ink} onPress={() => router.back()} />
        <Text style={s.backTitle}>Preiva</Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={s.head}>
        <Text style={s.title}>Preiva</Text>
        <Text style={s.sub}>Your AI coach</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <FlatList
          ref={list}
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={s.list}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={s.empty}>
              Ask about your plan, food swaps, training form — anything.
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={[
                s.bubble,
                item.role === 'user' ? s.bubbleUser : s.bubblePreiva,
              ]}>
              <Text style={[s.bubbleText, item.role === 'user' && { color: '#0c0f12' }]}>
                {item.text}
              </Text>
            </View>
          )}
        />
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder={busy ? 'Preiva is thinking…' : 'Message Preiva'}
            placeholderTextColor={C.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            editable={!busy}
            multiline
          />
          <Pressable style={[s.send, busy && { opacity: 0.5 }]} onPress={send}>
            <Text style={s.sendLabel}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  backBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  backTitle: { color: C.ink, fontFamily: F.heading, fontSize: 15 },
  head: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  title: { color: C.ink, fontFamily: F.headingX, fontSize: 22 },
  sub: { color: C.muted, fontFamily: F.body, fontSize: 12 },
  list: { padding: 16, paddingBottom: 8 },
  empty: {
    color: C.muted,
    fontFamily: F.body,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 40,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: R.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: C.orange,
    borderBottomRightRadius: 4,
  },
  bubblePreiva: {
    alignSelf: 'flex-start',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: C.ink, fontFamily: F.body, fontSize: 14, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: C.line,
    backgroundColor: C.card,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: C.card2,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.line,
    color: C.ink,
    fontFamily: F.body,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendLabel: { color: '#0c0f12', fontSize: 20, fontFamily: F.bodySemi },
});
