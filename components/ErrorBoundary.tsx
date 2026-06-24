// components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { View, Text } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error details for debugging
    console.log('Error Stack:', errorInfo.componentStack);
    
    this.setState({ hasError: true, error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, color: 'red', textAlign: 'center' }}>
            🚨 App Crashed
          </Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10 }}>
            {this.state.error?.message || 'Something went wrong'}
          </Text>
          <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 10 }}>
            Please restart the app
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
