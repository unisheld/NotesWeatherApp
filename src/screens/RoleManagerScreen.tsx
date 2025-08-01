import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '../hooks/useTheme';
import { useIsAdmin } from '../hooks/useIsAdmin';

type UserRole = 'admin' | 'editor' | 'user';

interface UserRoleItem {
  uid: string;
  email: string | null;
  role: UserRole;
}

const ALL_ROLES: UserRole[] = ['admin', 'editor', 'user'];

export default function RoleManagerScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);

  const isCurrentUserAdmin = useIsAdmin();

  const [users, setUsers] = useState<UserRoleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = firestore()
      .collection('users')
      .onSnapshot(
        (snapshot) => {
          const usersData: UserRoleItem[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              uid: doc.id,
              email: data.email ?? null,
              role: (['admin', 'editor', 'user'].includes(data.role) ? data.role : 'user') as UserRole,
            };
          });
          setUsers(usersData);
          setLoading(false);
        },
        (error) => {
          console.error('Failed to subscribe to users:', error);
          Alert.alert('Error', 'Failed to load users list.');
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    setUpdatingUid(uid);
    try {
      await firestore().collection('users').doc(uid).update({ role: newRole });

      setUsers((prev) =>
        prev.map((user) => (user.uid === uid ? { ...user, role: newRole } : user))
      );
    } catch (error) {
      console.error('Failed to update role:', error);
      Alert.alert('Error', 'Failed to update user role.');
    } finally {
      setUpdatingUid(null);
    }
  };

  const renderRoleButton = (user: UserRoleItem, role: UserRole) => {
    const selected = user.role === role;
    const isUpdating = updatingUid === user.uid;
    
    const disableChangeForAdmin =
      isCurrentUserAdmin && user.role === 'admin' && role !== 'admin';

    const disabled = selected || isUpdating || disableChangeForAdmin;

    return (
      <TouchableOpacity
        key={role}
        disabled={disabled}
        onPress={() => updateUserRole(user.uid, role)}
        style={[
          styles.roleButton,
          selected ? styles.roleButtonSelected : styles.roleButtonUnselected,
          disabled && { opacity: 0.5 },
        ]}
      >
        <Text style={selected ? styles.roleButtonTextSelected : styles.roleButtonText}>
          {role}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderUser = ({ item }: { item: UserRoleItem }) => (
    <View style={styles.userRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.emailText}>{item.email ?? '(No Email)'}</Text>
        <Text style={styles.uidText}>{item.uid}</Text>
      </View>
      <View style={styles.rolesContainer}>
        {ALL_ROLES.map((role) => renderRoleButton(item, role))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.text, marginTop: 12 }}>Loading users...</Text>
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View style={styles.loadingWrapper}>
        <Text style={{ color: theme.text }}>No users found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={renderUser}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 16,
    },
    loadingWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: theme.background === '#ffffff' ? '#f2f2f2' : '#333',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    emailText: {
      color: theme.text,
      fontWeight: '600',
      fontSize: 14,
    },
    uidText: {
      color: theme.text + '99',
      fontSize: 10,
      marginTop: 2,
    },
    rolesContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    roleButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary,
      marginLeft: 8,
      minWidth: 64,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roleButtonSelected: {
      backgroundColor: theme.primary,
    },
    roleButtonUnselected: {
      backgroundColor: 'transparent',
    },
    roleButtonText: {
      color: theme.primary,
      fontWeight: '600',
    },
    roleButtonTextSelected: {
      color: '#fff',
      fontWeight: '700',
    },
  });
