import { AuthProvider } from '@/context/AuthContext';
import AppRouter from '@/routes/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
