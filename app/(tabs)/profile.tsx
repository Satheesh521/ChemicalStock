/**
 * Profile Screen
 * User profile and account management
 */

import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function ProfileScreen() {
  const { user, signOut, loading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Do you want to logout?', [
      {
        text: 'Cancel',
        onPress: () => { },
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);

          try {
            await signOut();
            // Redirect will be handled by Auth listener automatically
          } catch (error: any) {
            console.error('Logout error:', error);
            Alert.alert('Error', error.message || 'Could not logout');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  // Get user initials
  const email = user?.email || '';
  const initials = email
    .split('@')[0]
    .split('.')
    .map((part) => part && part[0] ? part[0].toUpperCase() : '')
    .join('')
    .slice(0, 2);

  // Get account creation date
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : 'Unknown';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || '👤'}</Text>
          </View>
          <Text style={styles.userName}>{email.split('@')[0]}</Text>
        </View>

        {/* Details Section */}
        <View style={styles.detailsCard}>
          {/* Email */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>📧 Email</Text>
            <Text style={styles.detailValue}>{email}</Text>
          </View>

          <View style={styles.divider} />

          {/* Created Date */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>📅 Account Created</Text>
            <Text style={styles.detailValue}>{createdAt}</Text>
          </View>

          <View style={styles.divider} />

          {/* App Version */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>📱 Version</Text>
            <Text style={styles.detailValue}>1.0.0</Text>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => Alert.alert('Info', 'Your account is secure')}
          >
            <Text style={styles.actionIcon}>🔒</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Security</Text>
              <Text style={styles.actionDesc}>Check account security</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => Alert.alert('About', 'Chemical Stock Manager v1.0.0\n\n© 2024')}
          >
            <Text style={styles.actionIcon}>ℹ️</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>About</Text>
              <Text style={styles.actionDesc}>Version and terms</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, isLoggingOut && styles.logoutBtnDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.logoutIcon}></Text>
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>📞 Need Help?</Text>
          <Text style={styles.helpText}>
            For any issues or support,{'\n'}
            Contact Admin{'\n'}
            Email: satheeshkanna521@gmail.com{'\n'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  detailItem: {
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  actionDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutBtnDisabled: {
    opacity: 0.6,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  helpSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 18,
  },
});
