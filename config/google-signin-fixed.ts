/**
 * Google Sign-In - Fixed for Expo Go + Development Build
 */
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { supabase } from '../lib/supabase';
import { auth } from './firebase';

// ✅ @react-native-google-signin doesn't work in Expo Go
const isExpoGo = typeof process?.env?.EXPO_GO !== 'undefined';

const signInWithGoogle = async () => {
  try {
    // ❌ Native Google Sign-In doesn't work in Expo Go
    if (isExpoGo) {
      throw new Error('Google Sign-In requires Development Build. Run: npx expo run:android');
    }

    // ✅ This works only in Development Build
    const { GoogleSignin, statusCodes } = await import(
      '@react-native-google-signin/google-signin'
    );

    // Configure
    GoogleSignin.configure({
      webClientId: '965154912780-fg8u361a8e4dmaafcmklsuq6h2ccth80.apps.googleusercontent.com',
      offlineAccess: true,
    });

    // Check Play Services
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Sign In
    const userInfo = await GoogleSignin.signIn();
    
    if (!userInfo.data?.idToken) {
      throw new Error('No user data received from Google Sign-In');
    }
    
    // Firebase Credential
    const credential = GoogleAuthProvider.credential(userInfo.data.idToken);
    const userCredential = await signInWithCredential(auth, credential);
    
    // Supabase Upsert
    const { data: supabaseUser, error: supabaseError } = await supabase
      .from('profiles')
      .upsert({
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name: userInfo.data.user?.name || userCredential.user.displayName || 'Google User',
        avatar_url: userInfo.data.user?.photo || userCredential.user.photoURL,
        provider: 'google',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
    }

    return {
      success: true,
      user: {
        firebase: userCredential.user,
        supabase: supabaseUser,
        google: userInfo.data.user,
      },
    };

  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    
    return {
      success: false,
      error: error.message || 'Google Sign-In failed',
    };
  }
};

export { signInWithGoogle };

