import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, X, MessageCircle, Bell, CheckCircle, AlertCircle, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
  related_type?: string;
  related_data?: any;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Bildirimleri çek
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('business_notifications')
        .select('*')
        .eq('business_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Bildirimler çekilemedi:', error);
        Alert.alert('Hata', 'Bildirimler yüklenemedi');
        return;
      }

      setNotifications(data || []);
      
      // Okunmamış sayısını hesapla
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
      
    } catch (error) {
      console.error('Bildirim çekme hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  // Yenileme
  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Bildirimi okundu olarak işaretle
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('business_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Bildirim güncellenemedi:', error);
        return;
      }

      // Local state'i güncelle
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Bildirim güncelleme hatası:', error);
    }
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .rpc('mark_all_notifications_read', { p_business_id: user.id });

      if (error) {
        console.error('Bildirimler güncellenemedi:', error);
        Alert.alert('Hata', 'Bildirimler güncellenemedi');
        return;
      }

      // Local state'i güncelle
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      
      Alert.alert('Başarılı', 'Tüm bildirimler okundu olarak işaretlendi');
      
    } catch (error) {
      console.error('Bildirim güncelleme hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    }
  };

  // Bildirimi sil
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('business_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Bildirim silinemedi:', error);
        Alert.alert('Hata', 'Bildirim silinemedi');
        return;
      }

      // Local state'den kaldır
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
    } catch (error) {
      console.error('Bildirim silme hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_appointment':
        return <Calendar size={20} color="#6366f1" />;
      case 'changed_appointment':
        return <Clock size={20} color="#f59e0b" />;
      case 'cancelled_appointment':
        return <X size={20} color="#ef4444" />;
      case 'review':
        return <MessageCircle size={20} color="#10b981" />;
      case 'payment':
        return <CheckCircle size={20} color="#059669" />;
      case 'reminder':
        return <Bell size={20} color="#8b5cf6" />;
      default:
        return <AlertCircle size={20} color="#6b7280" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'Şimdi';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} dakika önce`;
    } else if (diffHours < 24) {
      return `${diffHours} saat önce`;
    } else if (diffDays < 7) {
      return `${diffDays} gün önce`;
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Bildirimler</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <CheckCircle size={20} color="#6366f1" />
            <Text style={styles.markAllText}>Tümünü Okundu İşaretle</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bell size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Bildirim Yok</Text>
          <Text style={styles.emptyMessage}>Henüz hiç bildiriminiz bulunmuyor.</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#6366f1']}
            />
          }
        >
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.is_read && styles.unreadCard
              ]}
              onPress={() => {
                if (!notification.is_read) {
                  markAsRead(notification.id);
                }
                // İlgili sayfaya yönlendir
                if (notification.related_type === 'appointment' && notification.related_id) {
                  // TODO: Randevu detay sayfasına git
                  console.log('Randevu detayına git:', notification.related_id);
                }
              }}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationTime}>{formatTime(notification.created_at)}</Text>
                </View>
                <View style={styles.notificationActions}>
                  {!notification.is_read && <View style={styles.unreadDot} />}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 12,
    color: '#6366f1',
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
    textAlign: 'center',
  },
});
