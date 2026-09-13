import type { UrbanBuilding } from './BanpoUrbanFabric';

export interface SouthBuilding extends UrbanBuilding {
  readonly complex: string;
  readonly name: string;
  readonly heightSource: 'osm-height' | 'osm-levels' | 'class-estimate' | 'photo-construction';
}

export interface SouthBankData {
  readonly buildings: readonly SouthBuilding[];
  readonly construction: readonly SouthBuilding[];
  readonly trees: readonly (readonly number[])[];
  readonly terrain: {
    readonly west: number;
    readonly south: number;
    readonly step: number;
    readonly rows: readonly (readonly number[])[];
    readonly cover: readonly (readonly number[])[];
  };
}

export type SouthBankGeometry = Omit<SouthBankData, 'buildings' | 'construction'> & {
  readonly buildings: readonly UrbanBuilding[];
  readonly construction: readonly UrbanBuilding[];
};
