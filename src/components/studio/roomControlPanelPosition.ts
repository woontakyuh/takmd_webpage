type Point = { readonly x: number; readonly y: number };
type Size = { readonly width: number; readonly height: number };
export type PanelObstacle = { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number };

const PANEL_GUTTER = 16;
const SWITCH_GAP = 24;

export function getRoomControlPanelPosition(anchor: Point, panel: Size, viewport: Size, obstacle?: PanelObstacle) {
  const maxLeft = Math.max(PANEL_GUTTER, viewport.width - panel.width - PANEL_GUTTER);
  const maxTop = Math.max(PANEL_GUTTER, viewport.height - panel.height - PANEL_GUTTER);
  const place = (left: number, top: number) => ({
    left: Math.round(Math.max(PANEL_GUTTER, Math.min(maxLeft, left))),
    top: Math.round(Math.max(PANEL_GUTTER, Math.min(maxTop, top))),
  });
  const left = place(Math.min(anchor.x, obstacle?.left ?? anchor.x) - SWITCH_GAP - panel.width, anchor.y - panel.height / 2);
  const right = place(Math.max(anchor.x, obstacle?.right ?? anchor.x) + SWITCH_GAP, anchor.y - panel.height / 2);
  const preferRight = obstacle && (obstacle.left + obstacle.right) / 2 < anchor.x;
  const candidates = [preferRight ? right : left, preferRight ? left : right,
    place(anchor.x - panel.width / 2, Math.max(anchor.y, obstacle?.bottom ?? anchor.y) + SWITCH_GAP),
    place(anchor.x - panel.width / 2, Math.min(anchor.y, obstacle?.top ?? anchor.y) - SWITCH_GAP - panel.height)] as const;
  const overlaps = (position: Point, bounds: PanelObstacle) => position.x < bounds.right && position.x + panel.width > bounds.left
    && position.y < bounds.bottom && position.y + panel.height > bounds.top;
  const switchBounds = { left: anchor.x - SWITCH_GAP / 2, right: anchor.x + SWITCH_GAP / 2,
    top: anchor.y - SWITCH_GAP / 2, bottom: anchor.y + SWITCH_GAP / 2 };
  return candidates.find(candidate => {
    const point = { x: candidate.left, y: candidate.top };
    return !overlaps(point, switchBounds) && (!obstacle || !overlaps(point, obstacle));
  }) ?? candidates[0];
}
