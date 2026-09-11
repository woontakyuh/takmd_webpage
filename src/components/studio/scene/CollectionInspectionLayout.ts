import { Vector3 } from 'three';
import type { Box3, Camera } from 'three';
import { focusFov } from './config';
import type { Point } from './config';

export type CollectionCopyPlacement = 'left' | 'bottom' | 'right' | 'upper-right';
type Viewport = { readonly width: number; readonly height: number };
type ScreenBounds = { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number };
type CopyLayout = {
  readonly placement: CollectionCopyPlacement;
  readonly copyWidth: number;
  readonly copyHeight: number;
  readonly gap: number;
};

export function collectionCopyWidth({ width, height }: Viewport) {
  return width < 760 || width < height ? Math.min(420, width - 32) : Math.min(360, width * .28);
}

export function fitCollectionItem(bounds: Box3, preferred: CollectionCopyPlacement, viewport: Viewport,
  naturalCopyHeight: number, obstacle?: Box3): CopyLayout & { readonly position: Point; readonly target: Point } {
  const { width, height } = viewport;
  const stacked = width < 760 || width < height || preferred === 'bottom';
  const placement = stacked ? 'bottom' : preferred;
  const copyWidth = collectionCopyWidth(viewport);
  const gap = width < 760 ? 16 : 24;
  const availableHeight = Math.max(160, height - 144);
  const copyHeight = Math.min(naturalCopyHeight, Math.max(96, availableHeight * (stacked ? .45 : .7)));
  const objectWidth = bounds.max.x - bounds.min.x;
  const objectHeight = bounds.max.y - bounds.min.y;
  const aboveNeighbor = obstacle ? bounds.max.y - obstacle.max.y : 0;
  const availableWidth = width - 48;
  let scale = stacked
    ? Math.min(availableWidth / objectWidth, (availableHeight - copyHeight - gap) / objectHeight)
    : Math.min((availableWidth - copyWidth - gap) / objectWidth, availableHeight * .88 / objectHeight);
  if (placement === 'upper-right') {
    scale = Math.min(scale, (availableHeight - gap - copyHeight) / (objectHeight - aboveNeighbor));
  }
  const objectPixels = { width: objectWidth * scale, height: objectHeight * scale };
  const copyTopOffset = placement === 'upper-right' ? aboveNeighbor * scale - gap - copyHeight : 0;
  const totalHeight = stacked ? objectPixels.height + gap + copyHeight
    : Math.max(objectPixels.height, copyHeight) - Math.min(0, copyTopOffset);
  const totalWidth = stacked ? Math.max(objectPixels.width, copyWidth) : objectPixels.width + gap + copyWidth;
  const objectLeft = stacked ? (width - objectPixels.width) / 2
    : (width - totalWidth) / 2 + (placement === 'left' ? copyWidth + gap : 0);
  const objectTop = 72 + (availableHeight - totalHeight) / 2 - Math.min(0, copyTopOffset)
    + (!stacked && placement !== 'upper-right' ? Math.max(0, copyHeight - objectPixels.height) / 2 : 0);
  const center = bounds.getCenter(new Vector3());
  const target: Point = [
    center.x + (objectLeft + objectPixels.width / 2 - width / 2) / scale,
    center.y + (objectTop + objectPixels.height / 2 - height / 2) / scale,
    center.z,
  ];
  const tangent = Math.tan(focusFov(null, width < 760, width, height) * Math.PI / 360);
  const distance = height / (2 * tangent * scale);
  return { placement, copyWidth, copyHeight, gap, target, position: [target[0], target[1], bounds.min.z - distance] };
}

export function projectCollectionBounds(bounds: Box3, camera: Camera, { width, height }: Viewport): ScreenBounds {
  const point = new Vector3();
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        point.set(x, y, z).project(camera);
        const screenX = (point.x + 1) * width / 2;
        const screenY = (1 - point.y) * height / 2;
        left = Math.min(left, screenX); right = Math.max(right, screenX);
        top = Math.min(top, screenY); bottom = Math.max(bottom, screenY);
      }
    }
  }
  return { left, right, top, bottom };
}

export function positionCollectionCopy(object: ScreenBounds, layout: CopyLayout, viewport: Viewport, obstacle?: ScreenBounds) {
  const { placement, copyWidth, copyHeight, gap } = layout;
  const centerY = (object.top + object.bottom - copyHeight) / 2;
  let left: number, top: number;
  switch (placement) {
    case 'left': left = object.left - gap - copyWidth; top = centerY; break;
    case 'right': left = object.right + gap; top = centerY; break;
    case 'upper-right': left = object.right + gap; top = (obstacle?.top ?? object.top) - gap - copyHeight; break;
    case 'bottom': left = (object.left + object.right - copyWidth) / 2; top = object.bottom + gap; break;
    default: return placement satisfies never;
  }
  return {
    left: Math.max(16, Math.min(viewport.width - copyWidth - 16, left)),
    top: Math.max(16, Math.min(viewport.height - copyHeight - 72, top)),
  };
}
