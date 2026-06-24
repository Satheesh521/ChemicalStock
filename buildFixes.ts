// buildFixes.ts
// Production build fixes for Chemical Stock app

export const PRODUCTION_BUILD_CONFIG = {
  // Enable production optimizations
  enableProguard: true,
  enableShrinking: true,
  optimizeCode: true,
  
  // Memory settings for low-end devices
  heapSize: '256m',
  maxHeapSize: '512m',
  
  // Network configuration
  enableNetworkSecurityConfig: true,
  allowClearTextTraffic: true,
  
  // Debug settings
  enableDebugging: false,
  enableLogging: false,
  
  // APK signing
  enableSigning: true,
  signingConfig: 'release',
};

export const getBuildCommand = (environment: 'development' | 'production') => {
  const baseCommand = 'cd android && ./gradlew assembleRelease';
  
  if (environment === 'production') {
    return `${baseCommand} -Pprod=true -PenableProguard=true -PenableShrinking=true`;
  }
  
  return baseCommand;
};

export const getAdbInstallCommand = (apkPath: string) => {
  return `adb install -r ${apkPath}`;
};
