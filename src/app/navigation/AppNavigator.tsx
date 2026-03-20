import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Calendar, Users, DollarSign, LayoutDashboard, Ellipsis } from 'lucide-react-native';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../providers/AuthProvider';

import DashboardScreen from '../../features/dashboard/screens/DashboardScreen';
import AgendaScreen from '../../features/agenda/screens/AgendaScreen';
import ClientesScreen from '../../features/clientes/screens/ClientesScreen';
import CaixaScreen from '../../features/vendas/screens/CaixaScreen';
import LembretesScreen from '../../features/lembretes/screens/LembretesScreen';
import LoginScreen from '../../features/auth/screens/LoginScreen';
import ConfiguracoesScreen from '../../features/configuracoes/screens/ConfiguracoesScreen';
import ProdutosScreen from '../../features/produtos/screens/ProdutosScreen';
import MaisScreen from '../../features/mais/screens/MaisScreen';
import { ServicosScreen } from '../../features/configuracoes/servicos/screens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#18181b',
          borderTopColor: '#27272a',
          height: 74,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#71717a',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Agenda"
        component={AgendaScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Caixa"
        component={CaixaScreen}
        options={{
          tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Clientes"
        component={ClientesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Mais"
        component={MoreStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Ellipsis color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MaisMain" component={MaisScreen} />
      <MoreStack.Screen name="Servicos" component={ServicosScreen} />
      <MoreStack.Screen name="Produtos" component={ProdutosScreen} />
      <MoreStack.Screen name="Lembretes" component={LembretesScreen} />
      <MoreStack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
    </MoreStack.Navigator>
  );
}

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

export default AppNavigator;
