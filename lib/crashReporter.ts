// lib/crashReporter.ts
import { Platform } from 'react-native';

export interface CrashReport {
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

class CrashReporter {
  private static instance: CrashReporter;
  private reports: CrashReport[] = [];

  private constructor() {
    this.setupErrorHandlers();
  }

  public static getInstance(): CrashReporter {
    if (!CrashReporter.instance) {
      CrashReporter.instance = new CrashReporter();
    }
    return CrashReporter.instance;
  }

  private setupErrorHandlers(): void {
    // Global error handler
    if (Platform.OS === 'android') {
      // Setup Android-specific error handling
      console.log('🛡️ Setting up Android crash handlers');
    }

    // JavaScript error handler
    const originalHandler = (Error as any).getStackTrace;
    (Error as any).getStackTrace = () => {
      const error = new Error('App crashed');
      this.reportCrash(error);
      return originalHandler ? originalHandler() : '';
    };

    // Unhandled promise rejection
    const originalRejectionHandler = (globalThis as any).PromiseRejectionEvent;
    (globalThis as any).PromiseRejectionEvent = (event: any) => {
      this.reportCrash(new Error(`Unhandled promise rejection: ${event.reason}`));
    };
  }

  public reportCrash(error: Error): void {
    const report: CrashReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      deviceInfo: {
        platform: Platform.OS,
        version: '1.0.0', // Get from app.json
        model: Platform.select({
          android: 'Android Device',
          ios: 'iOS Device',
        }),
      },
      appState: {
        memoryUsage: this.getMemoryUsage(),
        storageUsed: this.getStorageUsage(),
        networkStatus: 'unknown',
      },
    };

    this.reports.push(report);
    console.error('🚨 Crash Report:', report);
    
    // In production, send to crash reporting service
    if (__DEV__ === false) {
      this.sendReport(report);
    }
  }

  private getMemoryUsage(): string {
    try {
      if (Platform.OS === 'android' && 'performance' in globalThis) {
        return (globalThis as any).performance.memory?.usedJSHeapSize || 'unknown';
      }
    } catch {
      return 'unknown';
    }
    return 'unknown';
  }

  private getStorageUsage(): string {
    try {
      return '150MB'; // From your app info
    } catch {
      return 'unknown';
    }
  }

  private async sendReport(report: CrashReport): Promise<void> {
    try {
      // In production, send to your crash reporting service
      console.log('📤 Sending crash report to service...');
      // await fetch('https://your-crash-service.com/api/reports', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report),
      // });
    } catch (error) {
      console.error('Failed to send crash report:', error);
    }
  }

  public getReports(): CrashReport[] {
    return this.reports;
  }

  public clearReports(): void {
    this.reports = [];
  }
}

export default CrashReporter;
