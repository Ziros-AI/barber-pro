import React, { useState } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Calendar, Users, DollarSign, LayoutDashboard, Ellipsis, Bell, Package, Scissors, Settings } from 'lucide-react-native';
import { View, ActivityIndicator, Pressable, TouchableOpacity, Text, StyleSheet } from 'react-native';

import { useAuth } from '../providers/AuthProvider';

import DashboardScreen from '../../features/dashboard/screens/DashboardScreen';
import AgendaScreen from '../../features/agenda/screens/AgendaScreen';
import ClientesScreen from '../../features/clientes/screens/ClientesScreen';
import CaixaScreen from '../../features/vendas/screens/CaixaScreen';
import LembretesScreen from '../../features/lembretes/screens/LembretesScreen';
import LoginScreen from '../../features/auth/screens/LoginScreen';
import ConfiguracoesScreen from '../../features/configuracoes/screens/ConfiguracoesScreen';
import ProdutosScreen from '../../features/produtos/screens/ProdutosScreen';
import { ServicosScreen } from '../../features/configuracoes/servicos/screens';
import { COLORS } from '../../styles/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

type MoreShortcut = {
  title: string
  route: 'Servicos' | 'Produtos' | 'Lembretes' | 'Configuracoes'
  icon: React.ReactNode
}

const moreShortcuts: MoreShortcut[] = [
  {
    title: 'Servicos',
    route: 'Servicos',
    icon: <Scissors color={COLORS.gold} size={18} />
  },
  {
    title: 'Produtos',
    route: 'Produtos',
    icon: <Package color={COLORS.gold} size={18} />
  },
  {
    title: 'Lembretes',
    route: 'Lembretes',
    icon: <Bell color={COLORS.gold} size={18} />
  },
  {
    title: 'Configuracoes',
    route: 'Configuracoes',
    icon: <Settings color={COLORS.gold} size={18} />
  }
];

function EmptyScreen() {
  return <View style={styles.emptyScreen} />;
}

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MaisMain" component={EmptyScreen} />
      <MoreStack.Screen name="Servicos" component={ServicosScreen} />
      <MoreStack.Screen name="Produtos" component={ProdutosScreen} />
      <MoreStack.Screen name="Lembretes" component={LembretesScreen} />
      <MoreStack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
    </MoreStack.Navigator>
  );
}

const TabNavigator = () => {
  const navigation = useNavigation<any>();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navigateToMoreOption = (route: MoreShortcut['route']) => {
    setIsMoreOpen(false);
    navigation.navigate('Main', {
      screen: 'Mais',
      params: {
        screen: route
      }
    });
  };

  const closeMoreMenu = () => setIsMoreOpen(false);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenListeners={{
          state: () => {
            if (isMoreOpen) {
              setIsMoreOpen(false);
            }
          }
        }}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#18181b',
            borderTopColor: '#27272a',
            height: 74,
            paddingBottom: 10,
            paddingTop: 10
          },
          tabBarActiveTintColor: '#D4AF37',
          tabBarInactiveTintColor: '#71717a',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600'
          }
        }}
      >
        <Tab.Screen
          name="Agenda"
          component={AgendaScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />
          }}
          listeners={{ tabPress: closeMoreMenu }}
        />
        <Tab.Screen
          name="Caixa"
          component={CaixaScreen}
          options={{
            tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} />
          }}
          listeners={{ tabPress: closeMoreMenu }}
        />
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />
          }}
          listeners={{ tabPress: closeMoreMenu }}
        />
        <Tab.Screen
          name="Clientes"
          component={ClientesScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />
          }}
          listeners={{ tabPress: closeMoreMenu }}
        />
        <Tab.Screen
          name="Mais"
          component={MoreStackNavigator}
          options={{
            tabBarIcon: ({ color, size }) => <Ellipsis color={color} size={size} />,
            tabBarButton: (props) => (
              <Pressable
                accessibilityState={props.accessibilityState}
                accessibilityLabel={props.accessibilityLabel}
                testID={props.testID}
                style={({ pressed }) => [
                  props.style,
                  pressed ? styles.moreTabButtonPressed : null
                ]}
                onPress={() => setIsMoreOpen((current) => !current)}
              >
                {props.children}
              </Pressable>
            )
          }}
          listeners={{
            tabPress: (event) => {
              event.preventDefault();
            }
          }}
        />
      </Tab.Navigator>

      {isMoreOpen ? (
        <>
          <Pressable style={styles.backdrop} onPress={closeMoreMenu} />
          <View style={styles.moreMenu}>
            {moreShortcuts.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={styles.moreMenuItem}
                activeOpacity={0.85}
                onPress={() => navigateToMoreOption(item.route)}
              >
                <View style={styles.moreMenuIcon}>{item.icon}</View>
                <Text style={styles.moreMenuText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
};

const AppNavigator = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  emptyScreen: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent'
  },
  moreMenu: {
    position: 'absolute',
    right: 12,
    bottom: 82,
    width: 210,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.zinc800,
    borderRadius: 18,
    padding: 10,
    gap: 8
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.zinc900
  },
  moreMenuIcon: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  moreMenuText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700'
  },
  moreTabButtonPressed: {
    opacity: 0.7
  }
});

export default AppNavigator;
