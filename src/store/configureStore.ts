import { configureStore as rtkConfigureStore } from '@reduxjs/toolkit';
import reducer from './reducers';

export function configureStore() {
  const store = rtkConfigureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
    devTools: process.env.NODE_ENV !== 'production',
  });

  return store;
}

const store = configureStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = any;