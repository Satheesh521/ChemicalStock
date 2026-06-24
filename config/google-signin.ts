/**
 * Google Sign-In Configuration
 * Firebase + Supabase Integration
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';
import { supabase } from './supabase';

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    // IMPORTANT: Replace with your actual Web Client ID from Firebase Console
    webClientId: '965154912780-fg8u361a8e4dmaafcmklsuq6h2ccth80.apps.googleusercontent.com',
    offlineAccess: true, // Required for Firebase
    forceCodeForRefreshToken: true, // Required for offline access
  });
};

// Google Sign-In with Firebase + Supabase Integration
export const signInWithGoogle = async () => {
  try {
    // Check if device supports Google Play Services
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    // Sign in with Google
    const userInfo = await GoogleSignin.signIn();
    
    if (!userInfo.idToken) {
      throw new Error('Failed to get Google ID token');
    }

    // Create Firebase credential
    const googleCredential = GoogleAuthProvider.credential(userInfo.idToken);
    
    // Sign in with Firebase
    const userCredential = await signInWithCredential(auth, googleCredential);
    const firebaseUser = userCredential.user;

    // Create/update user in Supabase
    const { data: supabaseUser, error: supabaseError } = await supabase
      .from('profiles')
      .upsert({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: userInfo.user.name || firebaseUser.displayName || 'Google User',
        avatar_url: userInfo.user.photo || firebaseUser.photoURL,
        provider: 'google',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (supabaseError) {
      console.error('Supabase user creation error:', supabaseError);
      // Don't throw error - user is authenticated in Firebase
    }

    // Sign in to Supabase using Firebase token
    const { error: signInError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: userInfo.idToken,
      nonce: userInfo.idToken, // Using idToken as nonce for simplicity
    });

    if (signInError) {
      console.error('Supabase sign-in error:', signInError);
      // Don't throw error - user is authenticated in Firebase
    }

    return {
      success: true,
      user: {
        firebase: firebaseUser,
        supabase: supabaseUser,
        google: userInfo.user,
      },
    };

  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    
    let errorMessage = 'Google Sign-In failed';
    
    if (error.code) {
      switch (error.code) {
        case 'SIGN_IN_CANCELLED':
          errorMessage = 'Google Sign-In was cancelled';
          break;
        case 'IN_PROGRESS':
          errorMessage = 'Google Sign-In is already in progress';
          break;
        case 'PLAY_SERVICES_NOT_AVAILABLE':
          errorMessage = 'Google Play Services not available';
          break;
        default:
          errorMessage = `Google Sign-In failed: ${error.message}`;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Sign Out from Google
export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    await auth.signOut();
    await supabase.auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('Google Sign-Out Error:', error);
    return { success: false, error: 'Failed to sign out' };
  }
};
