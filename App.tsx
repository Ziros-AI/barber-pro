import { registerRootComponent } from 'expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/contexts/AuthContext';
import { queryClientInstance } from './src/lib/query-client';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AppNavigator />
      </QueryClientProvider>
    </AuthProvider>
  );
}

registerRootComponent(App);
