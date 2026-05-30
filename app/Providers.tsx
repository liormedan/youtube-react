'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '../src/store/configureStore';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { GlobalLifecycle } from '../src/components/GlobalLifecycle/GlobalLifecycle';

// For Phase 1, we preserve the global store to allow existing Redux/Sagas to run unmodified.
// In Phase 4, we will transition to a per-request store factory.
const store = configureStore();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <GlobalLifecycle />
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </Provider>
  );
}
