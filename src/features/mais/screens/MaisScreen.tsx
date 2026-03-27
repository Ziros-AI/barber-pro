import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bell, ChevronRight, Package, Scissors, Settings } from 'lucide-react-native';

import { COLORS } from '../../../styles/colors';

type ShortcutItem = {
  title: string;
  description: string;
  route: 'Lembretes' | 'Produtos' | 'Configuracoes' | 'Servicos';
  icon: React.ReactNode;
};

const shortcuts: ShortcutItem[] = [
  {
    title: 'Servicos',
    description: 'Edite os servicos oferecidos e os valores praticados.',
    route: 'Servicos',
    icon: <Scissors color={COLORS.gold} size={22} />
  },
  {
    title: 'Produtos',
    description: 'Gerencie produtos e itens disponiveis no caixa.',
    route: 'Produtos',
    icon: <Package color={COLORS.gold} size={22} />
  },
  {
    title: 'Lembretes',
    description: 'Acompanhe avisos e lembretes automaticos.',
    route: 'Lembretes',
    icon: <Bell color={COLORS.gold} size={22} />
  },
  {
    title: 'Configuracoes',
    description: 'Personalize dados da barbearia e preferencias gerais.',
    route: 'Configuracoes',
    icon: <Settings color={COLORS.gold} size={22} />
  }
];

export default function MaisScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Atalhos e gerenciamento</Text>
        <Text style={styles.title}>Mais</Text>
        <Text style={styles.subtitle}>
          Reunimos aqui as telas de apoio para manter a navegacao principal mais limpa.
        </Text>
      </View>

      <View style={styles.section}>
        {shortcuts.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(item.route as never)}
          >
            <View style={styles.cardIcon}>{item.icon}</View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
            <ChevronRight color={COLORS.zinc500} size={18} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    paddingBottom: 32
  },
  hero: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc800
  },
  eyebrow: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10
  },
  title: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 8
  },
  subtitle: {
    color: COLORS.zinc400,
    fontSize: 14,
    lineHeight: 20
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: `${COLORS.gold}15`,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardBody: {
    flex: 1
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4
  },
  cardDescription: {
    color: COLORS.zinc400,
    fontSize: 13,
    lineHeight: 18
  }
});
