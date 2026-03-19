import { registerRootComponent } from 'expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/contexts/AuthContext';
import { AlertProvider } from './src/contexts/AlertContext';
import { queryClientInstance } from './src/lib/query-client';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <AppNavigator />
        </QueryClientProvider>
      </AuthProvider>
    </AlertProvider>
  );
}

registerRootComponent(App);
