import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, H2, Muted, Btn } from '../../components/ui';
import { AppHeader } from '../../components/AppHeader';
import { useCached } from '../../src/hooks/useCached';
import { EP, WEB } from '../../src/api/endpoints';
import { useAuth } from '../../src/auth/AuthContext';
import { useLocale } from '../../src/i18n/locale';
import { C, F } from '../../constants/gfp';

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { qs } = useLocale();
  const billing = useCached<any>('billing', EP.billing);

  const open = (url: string) =>
    router.push({ pathname: '/web', params: { url: url + qs, mode: 'page' } });

  const b = billing.data;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <AppHeader title="Account" />
      <ScrollView contentContainerStyle={st.body}>
        <Card>
          <H2>{user?.name || user?.email || 'Your account'}</H2>
          {!!user?.email && <Muted>{user.email}</Muted>}
          {!!b && (
            <Text style={st.plan}>
              {b.plan ?? '—'} · {b.status ?? '—'}
              {b.price_label ? ` · ${b.price_label}` : ''}
            </Text>
          )}
        </Card>

        <Card>
          <H2>Membership</H2>
          <Muted>
            {b?.status === 'trial' && b?.trial_ends_at
              ? `Trial ends ${String(b.trial_ends_at).slice(0, 10)}.`
              : 'Manage your Companion membership.'}
          </Muted>
          <Btn label="Manage membership" onPress={() => open(WEB.account)} style={{ marginTop: 12 }} />
          {!b?.has_access && (
            <Btn
              label="See plans"
              kind="mint"
              onPress={() => open(b?.checkout_url || WEB.companion)}
              style={{ marginTop: 8 }}
            />
          )}
        </Card>

        <Card>
          <H2>Supplements & orders</H2>
          <Muted>Shop supplements and track your orders.</Muted>
          <Btn label="Shop supplements" onPress={() => open(WEB.shop)} style={{ marginTop: 12 }} />
          <Btn label="My orders" kind="ghost" onPress={() => open(WEB.orders)} style={{ marginTop: 8 }} />
        </Card>

        <Card>
          <H2>Account</H2>
          <Btn label="Account settings" kind="ghost" onPress={() => open(WEB.account)} />
          <Btn label="Log out" kind="ghost" onPress={logout} style={{ marginTop: 8 }} />
        </Card>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  body: { padding: 14, gap: 12 },
  plan: { color: C.mint, fontFamily: F.bodySemi, fontSize: 13, marginTop: 10, textTransform: 'capitalize' },
});
