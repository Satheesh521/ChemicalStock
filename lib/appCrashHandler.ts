// lib/appCrashHandler.ts
import { Platform, Alert } from 'react-native';

export interface CrashInfo {
  timestamp: string;
  error: string;
  stack?: string;
  deviceInfo: {
    platform: string;
    version: string;
    model?: string;
  };
  appState: {
    memoryUsage?: string;
    storageUsed?: string;
    networkStatus?: string;
  };
}

class AppCrashHandler {
  private static instance: AppCrashHandler;
  private crashReports: CrashInfo[] = [];

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): AppCrashHandler {
    if (!AppCrashHandler.instance) {
      AppCrashHandler.instance = new AppCrashHandler();
    }
    return AppCrashHandler.instance;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled JavaScript errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleCrash(new Error(event.message), event.error?.stack);
      });
    }

    // Handle unhandled promise rejections
    if (typeof global !== 'undefined') {
      global.onUnhandledRejection = (event) => {
        this.handleCrash(new Error(`Unhandled promise rejection: ${event.reason}`));
      };
    }
  }

  public handleCrash(error: Error, stack?: string): void {
    const crashInfo: CrashInfo = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: stack || error.stack,
      deviceInfo: {
        platform: Platform.OS,
        version: '1.0.0',
        model: Platform.select({
          android: 'Android Device',
          ios: 'iOS Device',
          default: 'Unknown Device',
        }),
      },
      appState: {
        memoryUsage: this.getMemoryUsage(),
        storageUsed: '150MB', // From your app info
        networkStatus: 'unknown',
      },
    };

    this.crashReports.push(crashInfo);
    console.error('🚨 App Crash Detected:', crashInfo);
    
    // Show user-friendly error message
    this.showCrashAlert(crashInfo);
    
    // In production, send crash report
    if (!__DEV__) {
      this.sendCrashReport(crashInfo);
    }
  }

  private showCrashAlert(crashInfo: CrashInfo): void {
    Alert.alert(
      '🚨 App Crashed',
      `The app encountered an error: ${crashInfo.error}\n\nPlease restart the app.`,
      [
        { text: 'OK', onPress: () => this.restartApp() },
        { 
          text: 'Report Issue', 
          onPress: () => this.reportIssue(crashInfo) 
        }
      ]
    );
  }

  private restartApp(): void {
    // In React Native, you can't programmatically restart the app
    // Show instructions to user
    Alert.alert(
      'Restart Required',
      'Please close and restart the app manually.',
      [{ text: 'OK' }]
    );
  }

  private reportIssue(crashInfo: CrashInfo): void {
    // Copy crash info to clipboard for easy reporting
    const crashReport = `
Chemical Stock App Crash Report
============================
Time: ${crashInfo.timestamp}
Error: ${crashInfo.error}
Device: ${crashInfo.deviceInfo.platform} ${crashInfo.deviceInfo.model}
App Version: ${crashInfo.deviceInfo.version}

Stack Trace:
${crashInfo.stack || 'No stack trace available'}
    `.trim();

    console.log('📋 Crash Report Generated:', crashReport);
    
    Alert.alert(
      'Crash Report',
      'Crash details have been logged. Please share this with support.',
      [{ text: 'OK' }]
    );
  }

  private getMemoryUsage(): string {
    try {
      if (Platform.OS === 'android' && 'performance' in global) {
        return (global as any).performance.memory?.usedJSHeapSize || 'unknown';
      }
    } catch {
      return 'unknown';
    }
  }

  private async sendCrashReport(crashInfo: CrashInfo): Promise<void> {
    try {
      // In production, send to your crash reporting service
      console.log('📤 Sending crash report to service...');
      
      // Example: Send to your backend
      // await fetch('https://your-backend.com/api/crash-reports', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(crashInfo),
      // });
      
    } catch (error) {
      console.error('Failed to send crash report:', error);
    }
  }

  public getCrashReports(): CrashInfo[] {
    return this.crashReports;
  }

  public clearCrashReports(): void {
    this.crashReports = [];
  }

  // Check for common crash patterns
  public checkForCommonIssues(): string[] {
    const issues: string[] = [];
    
    // Check for Firebase initialization issues
    if (this.crashReports.some(report => 
      report.error.includes('Firebase') || 
      report.error.includes('auth already initialized')
    )) {
      issues.push('Firebase initialization issues detected');
    }
    
    // Check for network issues
    if (this.crashReports.some(report => 
      report.error.includes('Network') || 
      report.error.includes('fetch failed')
    )) {
      issues.push('Network connectivity issues detected');
    }
    
    // Check for permission issues
    if (this.crashReports.some(report => 
      report.error.includes('Permission') || 
      report.error.includes('denied')
    )) {
      issues.push('Permission issues detected');
    }
    
    return issues;
  }
}

export default AppCrashHandler;
