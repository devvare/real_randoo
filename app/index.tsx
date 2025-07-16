import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!isLoading) {
      timeoutId = setTimeout(() => {
        if (!user) {
          router.replace('/auth/login');
        } else {
          // Route based on user type
          switch (user.user_type) {
            case 'customer':
              router.replace('/(customer)');
              break;
            case 'business':
            case 'staff':
              router.replace('/(business)');
              break;
            default:
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