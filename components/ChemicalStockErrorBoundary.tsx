// components/ChemicalStockErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity
} from 'react-native';

// Safe clipboard import — won't crash if package is missing
let ClipboardModule: { setString: (text: string) => void } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ClipboardModule = require('@react-native-clipboard/clipboard').default;
} catch (_e) {
  // clipboard package not available — copy button will silently skip
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ChemicalStockErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('🔴 [ChemicalStock] App Error:', error.message);
    console.error('🔴 Component Stack:', errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  private handleRestart = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleCopy = (): void => {
    const { error, errorInfo } = this.state;
    const errorId = `ERR-${Date.now()}`;
    const text = [
      `Error ID: ${errorId}`,
      `Message: ${error?.message ?? 'Unknown error'}`,
      `Stack: ${error?.stack ?? 'N/A'}`,
      `Component: ${errorInfo?.componentStack ?? 'N/A'}`,
    ].join('\n');

    if (ClipboardModule) {
      ClipboardModule.setString(text);
    } else {
      console.log('📋 Error details (clipboard not available):', text);
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      const errorId = `ERR-${Date.now()}`;
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.emoji}>🚨</Text>
          <Text style={styles.title}>Oops! App Crashed</Text>
          <Text style={styles.message}>
            {this.state.error?.message ?? 'Something went wrong'}
          </Text>
          <Text style={styles.errorId}>Error ID: {errorId}</Text>

          <TouchableOpacity
            style={styles.restartBtn}
            onPress={this.handleRestart}
            activeOpacity={0.8}
          >
            <Text style={styles.restartText}>🔄 Restart App</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.copyBtn}
            onPress={this.handleCopy}
            activeOpacity={0.8}
          >
            <Text style={styles.copyText}>📋 Copy Error Details</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            If this persists, please clear app cache or reinstall.
          </Text>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  emoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#444444',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 20,
  },
  errorId: {
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 24,
    color: '#666666',
    fontSize: 12,
  },
  restartBtn: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  restartText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  copyBtn: {
    backgroundColor: '#888888',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  copyText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
});

// Default export as well (both named + default)
export default ChemicalStockErrorBoundary;