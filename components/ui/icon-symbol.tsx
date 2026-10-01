// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = { [key: string]: ComponentProps<typeof MaterialIcons>['name'] };
type IconSymbolName = string;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'plus.app': 'add-circle',
  'list.bullet': 'list',
  'arrow.down.circle': 'arrow-downward',
  'bell.fill': 'notifications',
  'stock': 'inventory',
  'profile': 'account-circle',
  'chemicals': 'science',
  'camera.viewfinder': 'camera',
  // Additional mappings for the app
  'person.circle.fill': 'account-circle',
  // Material Community Icons fallbacks (used in some screens)
  'flask': 'science',
  'tray-arrow-up': 'upload',
  'tray-arrow-down': 'download',
  'file-document-outline': 'description',
  'account-circle': 'account-circle',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name];
  if (!iconName) {
    console.warn(`IconSymbol: No mapping found for "${name}", using fallback icon`);
    return <MaterialIcons color={color} size={size} name="help-outline" style={style} />;
  }
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
