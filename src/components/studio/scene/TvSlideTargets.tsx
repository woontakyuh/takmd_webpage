import { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { WALL_TV } from './config';
import { scheduleSceneSingleAction } from './sceneGesture';
import type { TvPreview } from './tvPreviews';

type Props = {
  readonly previews: readonly TvPreview[];
  readonly talkId: string | undefined;
  readonly current: number;
  readonly count: number;
  readonly onTalk: (id: string | null) => void;
  readonly onSlide: (index: number) => void;
};

export function TvSlideTargets({ previews, talkId, current, count, onTalk, onSlide }: Props) {
  const canvas = useThree(state => state.gl.domElement);
  const start = useRef<readonly [number, number] | null>(null);
  const targets = previews.map((preview, index) => ({ ...preview, name: `TV preview ${preview.caption}`, x: 1400, y: 191 + index * 255, width: 320, height: 194 }));
  if (talkId && count > 1) {
    for (const [step, x, name] of [[-1, 1305, 'previous'], [1, 1495, 'next']] as const) {
      const slideIndex = current + step;
      if (slideIndex < 0 || slideIndex >= count) continue;
      targets.push({ src: name, caption: name, active: false, talkId, slideIndex,
        name: `TV ${name} page`, x, y: 866, width: 150, height: 52 });
    }
  }
  return <group name="TV slide previews" userData={{ sceneControl: true }}>{targets.map(preview => <mesh
    key={preview.src} name={preview.name}
    position={[(preview.x / 1600 - .5) * WALL_TV.screenWidth, (.5 - preview.y / 900) * WALL_TV.screenHeight + .003, WALL_TV.depth / 2 + .002]}
    onPointerDown={event => { event.stopPropagation(); start.current = [event.clientX, event.clientY]; }}
    onPointerCancel={() => { start.current = null; }}
    onClick={event => {
      event.stopPropagation();
      const origin = start.current; start.current = null;
      if (!origin || event.delta >= 5 || Math.hypot(event.clientX - origin[0], event.clientY - origin[1]) >= 5) return;
      scheduleSceneSingleAction(canvas, () => {
        if (preview.talkId !== talkId) onTalk(preview.talkId);
        onSlide(preview.slideIndex);
      });
    }}>
    <planeGeometry args={[WALL_TV.screenWidth * preview.width / 1600, WALL_TV.screenHeight * preview.height / 900]} />
    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
  </mesh>)}</group>;
}
