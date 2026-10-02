import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// Whether the room is being drawn for a phone: the same judgement StudioScene uses for the texture cap. Parts that
// have a lighter phone form — garments, rounded corners — read it here instead of threading a prop through everything.
const DeviceContext = createContext(false);

export function DeviceProvider({ phone, children }: { readonly phone: boolean; readonly children: ReactNode }) {
  return <DeviceContext.Provider value={phone}>{children}</DeviceContext.Provider>;
}

export const usePhone = () => useContext(DeviceContext);

// Rounded corners are built from this many segments per corner. A phone cannot show the difference between one and
// three on a two-millimetre radius, and the shelving alone is several hundred such boxes.
export const cornerSegments = (phone: boolean) => (phone ? 1 : 3);
