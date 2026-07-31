import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { useLocale } from '../src/i18n/locale';
import { Card, H2, Muted, Btn } from './ui';
import { Api } from '../src/api/client';
import { C, F, R } from '../constants/gfp';

/** Daily supplement log — add what you took today; history shows it per day. */
export function SupplementLog() {
  const { t } = useLocale();
  const [items, setItems] = useState<any[] | null>(null);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r: any = await Api.supplements();
      setItems(Array.isArray(r?.items) ? r.items : []);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    try {
      await Api.addSupplement({ name: n, dose: dose.trim() || undefined });
      setName('');
      setDose('');
      await load();
    } catch {
      // keep silently; next load shows state
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    try {
      await Api.deleteSupplement(id);
      await load();
    } catch {}
  }

  return (
    <Card>
      <H2>{t('supp.title')}</H2>
      <Muted>{t('supp.hint')}</Muted>
      <View style={st.row}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('supp.name')}
          placeholderTextColor={C.muted}
          style={[st.input, { flex: 1.4 }]}
        />
        <TextInput
          value={dose}
          onChangeText={setDose}
          placeholder={t('supp.dose')}
          placeholderTextColor={C.muted}
          style={[st.input, { flex: 1 }]}
        />
      </View>
      <Btn label={t('supp.add')} onPress={add} loading={busy} style={{ marginTop: 8 }} />
      {!!items && items.length === 0 && <Muted style={{ marginTop: 8 }}>{t('supp.empty')}</Muted>}
      {(items ?? []).map((it: any) => (
        <View key={String(it.id)} style={st.itemRow}>
          <Text style={st.itemTxt}>
            • {String(it.name || '')}
            {it.dose ? ` — ${it.dose}` : ''}
          </Text>
          <TouchableOpacity onPress={() => remove(Number(it.id))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={st.remove}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </Card>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: {
    backgroundColor: C.card2,
    borderRadius: R.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.ink,
    fontFamily: F.body,
    fontSize: 13,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  itemTxt: { flex: 1, color: C.ink, fontFamily: F.body, fontSize: 13, lineHeight: 20 },
  remove: { color: C.danger, fontFamily: F.bodySemi, fontSize: 14, marginLeft: 10 },
});
