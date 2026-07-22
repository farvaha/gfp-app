import React, { useEffect, useState } from 'react';
import { Image, Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, H2, Muted, Btn } from '../../components/ui';
import { AppHeader } from '../../components/AppHeader';
import { useCached } from '../../src/hooks/useCached';
import { EP, WEB } from '../../src/api/endpoints';
import { useAuth } from '../../src/auth/AuthContext';
import { useLocale } from '../../src/i18n/locale';
import { C, F, R } from '../../constants/gfp';

// Account is fully native - nothing here renders inside an in-app WebView.
// Identity, membership, trial and pricing all come from the REST API and are
// drawn with native components. The three things the backend has no REST route
// for (card payment, the supplement shop, order history) hand off to the system
// browser instead of being embedded; an embedded checkout is exactly what made
// the app feel like a wrapped web page.

const STATUS_LABEL: Record<string, string> = {
  none: 'No membership',
  trial: 'Free trial',
  active: 'Active',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<string, string> = {
  trial: C.mint,
  active: C.mint,
  expired: C.orange,
  cancelled: C.orange,
};

function prettyDate(value?: string | null) {
  if (!value) return '';
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function initialsFor(name?: string, email?: string) {
  const source = (name || email || '').trim();
  if (!source) return '?';
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const first = parts[0] ? parts[0][0] : '';
  const second = parts[1] ? parts[1][0] : '';
  return (first + second).toUpperCase() || '?';
}

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const { withLang } = useLocale();
  const billing = useCached<any>('billing', EP.billing);

  // Opens in the system browser, never in an in-app WebView.
  const openExternal = async (url?: string | null) => {
    if (!url) return;
    try {
      await Linking.openURL(withLang(String(url)));
    } catch {
      // Never crash the screen because a browser could not be opened.
    }
  };

  const b = billing.data;
  const status = String(b?.status || '');
  const statusLabel = STATUS_LABEL[status] || (status || 'Unknown');
  const statusColor = STATUS_COLOR[status] || C.muted;
  const hasAccess = !!b?.has_access;
  const trialEnds = prettyDate(b?.trial_ends_at);
  const paidUntil = prettyDate(b?.paid_until);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <AppHeader title="Account" />
      <ScrollView
        contentContainerStyle={st.body}
        refreshControl={
          <RefreshControl refreshing={billing.refreshing} onRefresh={billing.refresh} tintColor={C.muted} />
        }
      >
        <Card>
          <View style={st.idRow}>
            <View style={st.avatar}>
              <Text style={st.avatarTxt}>{initialsFor(user?.name, user?.email)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.name} numberOfLines={1}>
                {user?.name || 'Your account'}
              </Text>
              {!!user?.email && (
                <Text style={st.email} numberOfLines={1}>
                  {user.email}
                </Text>
              )}
            </View>
          </View>
        </Card>

        <Card>
          <View style={st.rowBetween}>
            <H2>Membership</H2>
            {!!b && (
              <View style={[st.badge, { borderColor: statusColor }]}>
                <Text style={[st.badgeTxt, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            )}
          </View>

          {!b && billing.refreshing && <Muted>Loading your membership...</Muted>}

          {!b && !billing.refreshing && (
            <>
              <Muted>Could not load your membership right now.</Muted>
              <Btn label="Try again" kind="ghost" onPress={billing.refresh} style={{ marginTop: 10 }} />
            </>
          )}

          {!!b && (
            <>
              {!!b.price_label && <Text style={st.price}>{b.price_label}</Text>}
              {status === 'trial' && !!trialEnds && <Muted>Your free trial ends {trialEnds}.</Muted>}
              {status === 'active' && !!paidUntil && <Muted>Renews {paidUntil}.</Muted>}
              {status === 'expired' && <Muted>Your membership has ended. Renew to get your coach back.</Muted>}
              {status === 'cancelled' && !!paidUntil && <Muted>Access continues until {paidUntil}.</Muted>}
              {status === 'none' && <Muted>You are on the free plan.</Muted>}

              {!hasAccess && (
                <Btn
                  label="Upgrade to Companion"
                  kind="mint"
                  onPress={() => openExternal(b.checkout_url || WEB.companion)}
                  style={{ marginTop: 12 }}
                />
              )}

              <Text style={st.hint}>Payments and billing are handled securely in your browser.</Text>
              <Btn
                label="Manage billing"
                kind="ghost"
                onPress={() => openExternal(WEB.account)}
                style={{ marginTop: 8 }}
              />
            </>
          )}
        </Card>

        <ShopCard openExternal={openExternal} />

        <Card>
          <H2>Session</H2>
          <Btn label="Log out" kind="ghost" onPress={logout} />
        </Card>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// Native supplement shop - products come straight from the store API on the
// site (wc/store/v1), drawn natively. Only the final checkout opens outside
// the app, because payment cannot run natively without a payment SDK.
function ShopCard({ openExternal }: { openExternal: (u?: string | null) => void }) {
  const [items, setItems] = useState<any[] | null>(null);

  useEffect(() => {
    fetch('https://getfitplans.com/wp-json/wc/store/v1/products?per_page=10')
      .then((r) => r.json())
      .then((r) => setItems(Array.isArray(r) ? r : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <Card>
      <H2>Supplements</H2>
      {!items && <Muted>Loading the shop...</Muted>}
      {!!items && items.length === 0 && <Muted>The shop is empty right now.</Muted>}
      {(items ?? []).map((p: any) => (
        <View key={p.id} style={st.prodRow}>
          {!!p.images?.[0]?.thumbnail && (
            <Image source={{ uri: p.images[0].thumbnail }} style={st.prodImg} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={st.prodName} numberOfLines={2}>{p.name}</Text>
            {!!p.prices && (
              <Text style={st.prodPrice}>
                {p.prices.currency_symbol}
                {(Number(p.prices.price) / Math.pow(10, p.prices.currency_minor_unit || 0)).toFixed(0)}
              </Text>
            )}
          </View>
          <Btn label="Buy" kind="mint" onPress={() => openExternal(p.permalink)} />
        </View>
      ))}
      <Text style={st.shopHint}>Checkout completes securely in your browser.</Text>
      <Btn label="My orders" kind="ghost" onPress={() => openExternal(WEB.orders)} style={{ marginTop: 8 }} />
    </Card>
  );
}

const st = StyleSheet.create({
  prodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  prodImg: { width: 44, height: 44, borderRadius: 8, backgroundColor: C.card2 },
  prodName: { color: C.ink, fontFamily: F.bodySemi, fontSize: 13 },
  prodPrice: { color: C.mint, fontFamily: F.bodyMed, fontSize: 12, marginTop: 2 },
  shopHint: { color: C.muted, fontFamily: F.body, fontSize: 11, marginTop: 10 },

  body: { padding: 14, gap: 12 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.card2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  avatarTxt: { color: C.ink, fontFamily: F.bodySemi, fontSize: 16 },
  name: { color: C.ink, fontFamily: F.heading, fontSize: 17 },
  email: { color: C.muted, fontFamily: F.body, fontSize: 12, marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeTxt: { fontFamily: F.bodySemi, fontSize: 11, textTransform: 'capitalize' },
  price: { color: C.mint, fontFamily: F.bodySemi, fontSize: 15, marginBottom: 4 },
  hint: { color: C.muted, fontFamily: F.body, fontSize: 11, marginTop: 10, lineHeight: 16 },
});
