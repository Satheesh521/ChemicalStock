// lib/androidPermissions.ts
import { Alert, Platform } from 'react-native';

export type PermissionType = 
  | 'camera'
  | 'storage'
  | 'microphone'
  | 'phone_state';

export interface PermissionHandler {
  requestPermission: (permission: PermissionType) => Promise<boolean>;
  checkPermission: (permission: PermissionType) => Promise<boolean>;
  showPermissionAlert: (permission: PermissionType) => void;
}

// Permission mapping for Android
const PERMISSIONS: Record<PermissionType, string> = {
  camera: 'android.permission.CAMERA',
  storage: 'android.permission.READ_EXTERNAL_STORAGE',
  microphone: 'android.permission.RECORD_AUDIO',
  phone_state: 'android.permission.READ_PHONE_STATE',
};

export const usePermissions = (): PermissionHandler => {
  const requestPermission = async (permission: PermissionType): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    
    try {
      const result = await requestAndroidPermission(PERMISSIONS[permission]);
      return result;
    } catch (error) {
      console.error(`Permission request failed for ${permission}:`, error);
      return false;
    }
  };

  const checkPermission = async (permission: PermissionType): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    
    try {
      const result = await checkAndroidPermission(PERMISSIONS[permission]);
      return result;
    } catch (error) {
      console.error(`Permission check failed for ${permission}:`, error);
      return false;
    }
  };

  const showPermissionAlert = (permission: PermissionType): void => {
    Alert.alert(
      'Permission Required',
      `${permission.charAt(0).toUpperCase() + permission.slice(1)} permission is required for this app to work properly.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Settings', 
          onPress: () => {
            // Open app settings
            if (Platform.OS === 'android') {
              Alert.alert(
                'Open Settings',
                'Please go to Settings > Apps > Chemical Stock > Permissions and grant the required permissions.',
                [
                  { text: 'OK' }
                ]
              );
            }
          }
        }
      ]
    );
  };

  return {
    requestPermission,
    checkPermission,
    showPermissionAlert,
  };
};

// Android permission request function
const requestAndroidPermission = async (permission: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // For React Native, we need to use the native module approach
    // This is a simplified version - in production, you'd use proper permissions
    resolve(true);
  });
};

// Android permission check function  
const checkAndroidPermission = async (permission: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // For React Native, we need to use the native module approach
    // This is a simplified version - in production, you'd use proper permissions
    resolve(true);
  });
};
