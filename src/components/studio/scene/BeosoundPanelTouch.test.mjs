import { expect, it } from 'bun:test';
import { BEOSOUND_PANEL_KEYS, panelKeyHitArea, panelKeyPosition } from './BeosoundPanel.ts';
it('keeps every printed key inside its touch target and every target disjoint', () => {
  const areas = BEOSOUND_PANEL_KEYS.map(key => {
    const area = panelKeyHitArea(key), printed = panelKeyPosition(key.x,key.y);
    expect(Math.abs(printed[0]-area.position[0])).toBeLessThan(area.size[0]/2);
    expect(Math.abs(printed[1]-area.position[1])).toBeLessThan(area.size[1]/2);
    expect(area.size[0]).toBeGreaterThan(.039); expect(area.size[1]).toBeGreaterThan(.035);
    return area;
  });
  for(let a=0;a<areas.length;a++) for(let b=a+1;b<areas.length;b++) {
    const one=areas[a],two=areas[b];
    const overlapX=Math.abs(one.position[0]-two.position[0])<(one.size[0]+two.size[0])/2;
    const overlapY=Math.abs(one.position[1]-two.position[1])<(one.size[1]+two.size[1])/2;
    expect(overlapX && overlapY).toBe(false);
  }
});
