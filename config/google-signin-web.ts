/**
 * Google Sign-In Configuration - Web/Expo Go Version
 * Firebase JS SDK Integration (No Native Modules)
 */

import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { supabase } from './supabase';

// Web-based Google Sign-In (for Expo Go and Web)
export const signInWithGoogle = async () => {
  try {
    // For Web/Expo Go, we'll use Firebase's built-in Google provider
    const provider = new GoogleAuthProvider();
    
    // Add scopes if needed
    provider.addScope('email');
    provider.addScope('profile');

    // Sign in with Firebase using popup (for web) or redirect
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;

    // Create/update user in Supabase
    const { data: supabaseUser, error: supabaseError } = await supabase
      .from('profiles')
      .upsert({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'Google User',
        avatar_url: firebaseUser.photoURL,
        provider: 'google',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (supabaseError) {
      console.error('Supabase user creation error:', supabaseError);
    }

    return {
      success: true,
      user: {
        firebase: firebaseUser,
        supabase: supabaseUser,
      },
    };

  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    
    let errorMessage = 'Google Sign-In failed';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Google Sign-In was cancelled';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Google Sign-In popup was blocked';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Google Sign-In was cancelled';
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

// Sign Out
export const signOutFromGoogle = async () => {
  try {
    await signOut(auth);
    await supabase.auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('Google Sign-Out Error:', error);
    return { success: false, error: 'Failed to sign out' };
  }
};
