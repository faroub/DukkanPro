import React, { ErrorInfo } from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { ErrorState } from './ErrorState';
import { Spacing } from '@/constants/theme';

export interface ErrorBoundaryProps extends ViewProps {
  children: React.ReactNode;
  errorMessage?: string;
  retryLabel?: string;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, {
    hasError: boolean;
  }> {
  state = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    const { errorMessage = 'Error', retryLabel = 'Retry', children } = this.props;

    if (this.state.hasError) {
      return (
        <ErrorState
          message={errorMessage}
          onRetry={() => this.setState({ hasError: false })}
          retryLabel={retryLabel}
        />
      );
    }

    return children as React.ReactNode;
  }
}