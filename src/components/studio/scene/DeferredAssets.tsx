import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

const RoomReadyContext = createContext(false);

export function RoomReadyProvider({ ready, children }: { readonly ready: boolean; readonly children: ReactNode }) {
  return <RoomReadyContext.Provider value={ready}>{children}</RoomReadyContext.Provider>;
}

export const useRoomReady = () => useContext(RoomReadyContext);
