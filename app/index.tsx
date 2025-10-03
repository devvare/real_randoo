import '../polyfills';
import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (!isLoading) {
      timeoutId = setTimeout(() => {
        if (!user) {
          router.replace('/auth/login');
        } else {
          console.log('Index.tsx routing user:', {
            user_type: user.user_type,
            id: user.id,
            email: user.email
          });
          // Route based on user type
          switch (user.user_type) {
            case 'customer':
              console.log('Routing to customer dashboard');
              router.replace('/(customer)');
              break;
            case 'business':
              console.log('Routing to business dashboard');
              router.replace('/(business)');
              break;
            case 'staff':
              console.log('Routing to staff dashboard');
              router.replace('/(staff)');
              break;
            default:
              console.log('Routing to login (unknown user type)');
              router.replace('/auth/login');
          }
        }
      }, 100);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Inter-Medium',
  },
});