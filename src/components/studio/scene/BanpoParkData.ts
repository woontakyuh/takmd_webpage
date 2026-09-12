export type ParkPoint = readonly [east: number, north: number];
export const PARK_KINDS = ['ground', 'island', 'lawn', 'woodland', 'walk', 'cycle', 'service',
  'bridge', 'parking', 'stall', 'court', 'stage', 'fountain', 'pier', 'building'] as const;
export type ParkKind = typeof PARK_KINDS[number];

export interface ParkFeature {
  readonly id: string;
  readonly name: string;
  readonly kind: ParkKind;
  readonly area: boolean;
  readonly p: readonly ParkPoint[];
  readonly widthM: number;
  readonly widthSource: 'osm' | 'class-estimate';
  readonly sport: string;
}

export interface ParkData {
  readonly features: readonly ParkFeature[];
  readonly stagePoint: ParkPoint;
}
