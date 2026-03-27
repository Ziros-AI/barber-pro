import { registerRootComponent } from 'expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/app/providers/AuthProvider';
import { AlertProvider } from './src/app/providers/AlertProvider';
import { queryClientInstance } from './src/lib/query-client';
import AppNavigator from './src/app/navigation/AppNavigator';

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
