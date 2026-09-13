import type { SceneInspection } from './SceneInspection';
import type { CollectionId } from './CollectionInspectionState';
import type { Box3 } from 'three';
import { fitCollectionItem } from './CollectionInspectionLayout';
import type { CollectionCopyPlacement } from './CollectionInspectionLayout';

export type CollectionItem = {
  readonly id: string;
  readonly collection: CollectionId;
  readonly label: string;
  readonly title: string;
  readonly date: string;
  readonly description: string;
  readonly center: readonly [number, number, number];
  readonly copy: CollectionCopyPlacement;
  readonly copyAvoid?: string;
};

export const CREDENTIAL_ITEMS = [
  {
    id: 'credential-ksns', collection: 'credentials', label: 'Permanent membership',
    title: 'Korean Spinal Neurosurgery Society', date: 'March 12, 2022 · Certificate No. 580',
    description: 'The society certifies Woon Tak Yuh, M.D. as a permanent member.',
    center: [2.225, 1.974, 3.12], copy: 'left',
  },
  {
    id: 'credential-snu', collection: 'credentials', label: 'Master of Science in Medicine',
    title: 'Seoul National University', date: 'February 26, 2018',
    description: 'Seoul National University conferred the degree of Master of Science in Medicine in recognition of academic achievement and the ability to conduct research.',
    center: [1.935, 1.974, 3.12], copy: 'upper-right', copyAvoid: 'credential-komiss',
  },
  {
    id: 'credential-komiss', collection: 'credentials', label: 'Life membership · No. 180',
    title: 'Korean Minimally Invasive Spine Surgery Society', date: 'April 14, 2023',
    description: 'This certificate records Woon Tak Yuh’s life membership No. 180 in KOMISS.',
    center: [1.5925, 1.929, 3.12], copy: 'right',
  },
] as const satisfies readonly CollectionItem[];

export const AWARD_ITEMS = [
  {
    id: 'award-hallym', collection: 'awards', label: 'Appreciation plaque',
    title: 'Hallym University Dongtan Sacred Heart Hospital', date: 'January 17, 2025',
    description: 'Presented in appreciation of outstanding medical care and dedication during service in the department of neurosurgery, and contributions to its development.',
    center: [-1.54, 1.428, 3.095], copy: 'left',
  },
  {
    id: 'award-snuh', collection: 'awards', label: 'Neurosurgery merit award',
    title: 'Seoul National University Hospital', date: 'February 28, 2023',
    description: 'A merit award presented by the Department of Neurosurgery at Seoul National University Hospital.',
    center: [-1.875, 1.45, 3.115], copy: 'bottom',
  },
  {
    id: 'award-komiss', collection: 'awards', label: 'Lifetime membership · No. 180',
    title: 'Korean Minimally Invasive Spine Surgery Society', date: 'April 14, 2023',
    description: 'This award marks Woon Tak Yuh’s lifetime membership No. 180 in KOMISS.',
    center: [-2.21, 1.445, 3.115], copy: 'right',
  },
] as const satisfies readonly CollectionItem[];

export function collectionInspection(collection: CollectionId, width: number, height: number): SceneInspection {
  const targets = {
    credentials: [1.91, 1.965, 3.12], awards: [-1.875, 1.45, 3.11],
    honors: [-1.875, 2.55, 3.12], certificates: [1.875, 2.38, 3.12],
  } as const;
  const target = targets[collection];
  const verticalFov = width < height ? 60 : 42;
  const tangent = Math.tan(verticalFov * Math.PI / 360);
  const distance = Math.max(0.97 / (0.84 * 2 * tangent * width / height), 0.35 / (0.76 * 2 * tangent)) + .04;
  return {
    id: `collection-${collection}`,
    position: [target[0], target[1], target[2] - distance],
    target,
  };
}

export function itemInspection(item: CollectionItem, width: number, height: number, bounds: Box3,
  copyHeight = 240, obstacle?: Box3): SceneInspection {
  const { position, target } = fitCollectionItem(bounds, item.copy, { width, height }, copyHeight, obstacle);
  return { id: item.id, position, target };
}
