import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { GestureResponderEvent, TouchableOpacity } from 'react-native';

export function HapticTab(props: React.ComponentProps<typeof PlatformPressable>) {
  // Safe fallback if PlatformPressable is not available
  if (!PlatformPressable) {
    console.warn('PlatformPressable is not available, using TouchableOpacity fallback');
    return (
      <TouchableOpacity
        {...(props as React.ComponentProps<typeof TouchableOpacity>)}
        onPressIn={(ev: GestureResponderEvent) => {
          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(err => {
              console.warn('Haptic feedback failed:', err);
            });
          }
          props.onPressIn?.(ev);
        }}
      />
    );
  }

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev: GestureResponderEvent) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(err => {
            console.warn('Haptic feedback failed:', err);
          });
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}

export default HapticTab;