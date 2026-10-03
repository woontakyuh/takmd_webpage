import { SIMPLE_OFFICE } from './OfficeStyle';
import { Mesh, Texture } from 'three';
import { Html, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRoomReady } from './DeferredAssets';
import { prepareAreaLightMaterials } from './AreaLightCulling';
import { useBoundsRaycast } from './boundsRaycast';
import type { ThreeEvent } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { Group, Object3D } from 'three';
import { OfficeIcon } from '../OfficeIcon';
import { useArrangement } from '../arrangement';
import { IsidoroBarware } from './IsidoroBarware';
import { IsidoroFixedHalf } from './IsidoroCabinetGeometry';
import { IsidoroWorktop, WhiskyCabinetDoor, useCabinetAction, useIsidoroMotion } from './WhiskyCabinetDoor';
import { WHISKY_CABINET } from './WhiskyCabinetLayout';
import { WhiskyCollection } from './WhiskyCollection';
import { WHISKY_BOTTLES } from './WhiskyBottleSpecs';
import { WhiskyBottleInspector } from './WhiskyBottleInspector';
import { finishWhiskyReturn, returnWhiskyBottle, selectWhiskyBottle } from './WhiskyInspectionState';
import type { WhiskyBottleId, WhiskyInspectionState } from './WhiskyInspectionState';
import { whiskyCabinetPose, whiskyClosedCabinetPose, whiskyInspectionPose } from './WhiskyInspectionMotion';
import { useSceneInspection } from './SceneInspection';
import { EDBM_MAGAZINE } from '../edbmArchive';
import { IsidoroInteriorLighting } from './IsidoroInteriorLighting';
import { useGuidedView } from './GuidedView';
import { WhiskyLectureCard } from './WhiskyLectureCard';
import { WhiskyMagazine } from './WhiskyMagazine';

type WhiskyCabinetProps = {
  readonly wood: Texture;
  readonly reducedMotion: boolean;
  readonly lamp: number;
};

const stopInteriorClick = (event: ThreeEvent<PointerEvent | MouseEvent>) => event.stopPropagation();

export function WhiskyCabinet({ wood, reducedMotion, lamp }: WhiskyCabinetProps) {
  const { editing } = useArrangement();
  const size = useThree(state => state.size);
  const camera = useThree(state => state.camera);
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<WhiskyInspectionState>(null);
  const [magazineBusy, setMagazineBusy] = useState(false);
  const [bottlesReady, setBottlesReady] = useState(false);
  const onBottlesReady = useCallback(() => setBottlesReady(true), []);
  const [magazineReady, setMagazineReady] = useState(false);
  const onMagazineReady = useCallback(() => setMagazineReady(true), []);
  const pendingBottle = useRef<WhiskyBottleId | null>(null);
  const cabinet = useRef<Group>(null);
  const closing = useRef(false);
  const { inspection, setInspection } = useSceneInspection();
  const lectureActive = inspection?.id === 'whisky-lecture';
  const doorPivot = useRef<Group>(null);
  const worktopPivot = useRef<Group>(null);
  const ready = useIsidoroMotion(doorPivot, worktopPivot, open, reducedMotion, editing);
  // The lecture card's cover is a 1500 x 2000 photograph. Left to load on the click that opens the cabinet, a phone
  // spent the opening downloading it and then resizing it on the main thread, so the door appeared to freeze. It is
  // fetched once the room is idle instead: the first load is untouched and opening finds it already there.
  useEffect(() => {
    const source = EDBM_MAGAZINE.cover.src;
    const idle = window.requestIdleCallback?.bind(window) ?? ((run: () => void) => window.setTimeout(run, 2000));
    const cancel = typeof window.requestIdleCallback === 'function' ? window.cancelIdleCallback.bind(window) : window.clearTimeout.bind(window);
    const handle = idle(() => useTexture.preload(source));
    return () => cancel(handle);
  }, []);
  const barware = useRef<Group>(null);
  const bottles = useRef<Group>(null);
  const fixedInterior = useRef<Group>(null);
  const movingInterior = useRef<Group>(null);
  // Opening the cabinet reveals materials the renderer has never drawn — glass, bottles, the lit interior — and
  // linking their programs on the spot froze the door for half a second on a phone. Once the room is ready and the
  // browser idle, only the cabinet is compiled and its visibility is restored before the next frame.
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  const roomReady = useRoomReady();
  const warmed = useRef(false);
  useEffect(() => {
    if ((!SIMPLE_OFFICE && !roomReady) || !bottlesReady || (SIMPLE_OFFICE && !magazineReady) || warmed.current) return;
    const idle = window.requestIdleCallback?.bind(window) ?? ((run: () => void) => window.setTimeout(run, 1500));
    const cancel = typeof window.requestIdleCallback === 'function' ? window.cancelIdleCallback.bind(window) : window.clearTimeout.bind(window);
    const handle = idle(() => {
      const root = cabinet.current; if (!root || warmed.current) return;
      warmed.current = true;
      const groups = [barware.current, bottles.current, fixedInterior.current, movingInterior.current];
      const shown = groups.map(group => group?.visible ?? false);
      groups.forEach(group => { if (group) group.visible = true; });
      root.updateWorldMatrix(true, true);
      // Keep synchronous Safari warmup, but exclude these lights: the target scene already contains them.
      const materials = root.clone(true);
      const lights: Object3D[] = [];
      materials.traverse(object => { if ('isLight' in object) lights.push(object); });
      lights.forEach(light => light.removeFromParent());
      if (SIMPLE_OFFICE) {
        // Recompiling shared, already-rendered matte programs can leave Safari's shadow samplers stale.
        // Warm only unseen materials; the exterior programs are already ready for the first opening.
        const rendered: Mesh[] = [];
        materials.traverse(object => {
          if (!(object instanceof Mesh)) return;
          const finishes = Array.isArray(object.material) ? object.material : [object.material];
          if (finishes.every(material => (gl.properties.get(material) as { currentProgram?: unknown }).currentProgram)) rendered.push(object);
        });
        rendered.forEach(object => object.removeFromParent());
      }
      prepareAreaLightMaterials(materials);
      try {
        if (SIMPLE_OFFICE) {
          const textures = new Set<Texture>();
          materials.traverse(object => {
            if (!(object instanceof Mesh)) return;
            for (const finish of Array.isArray(object.material) ? object.material : [object.material]) {
              for (const value of Object.values(finish)) if (value instanceof Texture) textures.add(value);
            }
          });
          textures.forEach(texture => gl.initTexture(texture));
        }
        if (SIMPLE_OFFICE) {
          // compile() starts linking but leaves first-use uniform discovery to the first render.
          // Wait for GPU linking, then populate that cache while the cabinet is still idle.
          void gl.compileAsync(materials, camera, scene).then(compiled => {
            if (cabinet.current !== root) return;
            compiled.traverse(object => {
              if (!(object instanceof Mesh)) return;
              for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
                const properties = gl.properties.get(material) as { currentProgram?: { getUniforms(): unknown } };
                properties.currentProgram?.getUniforms();
              }
            });
          }).catch(error => console.error('Cabinet shader preparation failed', error));
        } else gl.compile(materials, camera, scene);
      }
      finally { groups.forEach((group, index) => { if (group) group.visible = shown[index]; }); }
    });
    return () => cancel(handle);
  }, [roomReady, bottlesReady, magazineReady, gl, camera, scene]);
  // Bottles and glassware answer pointer rays by their bounding boxes; their triangles are for drawing, not picking.
  // The interior mounts late, so the sweep repeats once a second until nothing new appears.
  const sweep = useRef(0);
  useFrame(() => {
    sweep.current += 1;
    if (sweep.current % 60 === 1) for (const group of [barware.current, bottles.current, fixedInterior.current, movingInterior.current]) if (group) useBoundsRaycast(group);
  });
  useFrame(() => {
    const exposed = (open && !editing) || (doorPivot.current?.rotation.y ?? 0) !== 0;
    if (barware.current) barware.current.visible = exposed;
    if (bottles.current) bottles.current.visible = exposed;
    if (fixedInterior.current) fixedInterior.current.visible = exposed;
    if (movingInterior.current) movingInterior.current.visible = exposed;
  });
  const magazineActive = inspection?.id === 'whisky-magazine';
  const approached = inspection?.id === 'whisky-cabinet' || inspection?.id.startsWith('whisky:') === true || magazineActive;
  const approachCabinet = useCallback((opened = open) => {
    if (cabinet.current) setInspection({ id: 'whisky-cabinet',
      ...(opened ? whiskyCabinetPose : whiskyClosedCabinetPose)(cabinet.current, size) });
  }, [open, size, setInspection]);
  // Inside the Whisky & Music view the visitor already stands before the cabinet: the door and the lecture card open
  // on the first touch instead of walking up to the closed cabinet first.
  const standingHere = useGuidedView() === 3;
  const visitClosedCabinet = useCallback(() => {
    if (!cabinet.current) return false;
    if (standingHere) return true;
    const pose = whiskyClosedCabinetPose(cabinet.current, size);
    if (inspection?.id === 'whisky-cabinet'
      && Math.hypot(...pose.position.map((value, index) => value - camera.position.getComponent(index))) < 0.08) return true;
    approachCabinet(false);
    return false;
  }, [approachCabinet, camera, inspection, size, standingHere]);
  const toggle = useCallback(() => {
    if (editing) return;
    pendingBottle.current = null;
    if (!open) {
      if (!visitClosedCabinet()) return;
      setOpen(true);
      approachCabinet(true);
      return;
    }
    if (open && (selection || magazineBusy)) {
      closing.current = true;
      setSelection(current => returnWhiskyBottle(current, true));
      approachCabinet();
    } else {
      setOpen(false);
      approachCabinet(false);
    }
  }, [approachCabinet, editing, magazineBusy, open, selection, visitClosedCabinet]);
  const { handlers } = useCabinetAction({ visualAccent: true, disabled: editing, onActivate: toggle });
  const chooseBottle = useCallback((id: WhiskyBottleId) => {
    if (!ready || !cabinet.current) return;
    if (magazineBusy) {
      pendingBottle.current = id;
      approachCabinet();
      return;
    }
    closing.current = false;
    setSelection(current => selectWhiskyBottle(current, id));
    setInspection({ id: `whisky:${id}`, ...whiskyInspectionPose(cabinet.current, size, WHISKY_BOTTLES.find(bottle => bottle.image === id)) });
  }, [approachCabinet, magazineBusy, size, ready, setInspection]);
  useEffect(() => {
    if (magazineBusy || !pendingBottle.current) return;
    const id = pendingBottle.current;
    pendingBottle.current = null;
    if (!editing && inspection?.id === 'whisky-cabinet') chooseBottle(id);
  }, [chooseBottle, editing, inspection, magazineBusy]);
  const returnBottle = useCallback(() => {
    setSelection(current => returnWhiskyBottle(current, false));
    approachCabinet();
  }, [approachCabinet]);
  const returned = useCallback((id: WhiskyBottleId) => {
    setSelection(current => finishWhiskyReturn(current, id));
  }, []);
  const leaveCabinet = useCallback(() => {
    closing.current = true;
    setSelection(current => returnWhiskyBottle(current, true));
    setInspection(null);
  }, [setInspection]);
  useEffect(() => {
    if (editing) { closing.current = false; setOpen(false); setSelection(null); }
  }, [editing]);
  useEffect(() => {
    if (selection || magazineBusy || !closing.current) return;
    closing.current = false;
    setOpen(false);
    if (approached) approachCabinet(false);
  }, [selection, magazineBusy, approached, approachCabinet]);
  useEffect(() => {
    if (approached) return;
    closing.current = true;
    setSelection(current => returnWhiskyBottle(current, true));
    if (!selection && !magazineBusy) setOpen(false);
  }, [approached, magazineBusy, selection]);
  useEffect(() => {
    if (!approached || selection || magazineActive) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog:modal')) return;
      event.preventDefault();
      leaveCabinet();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [approached, leaveCabinet, magazineActive, selection]);
  const previousViewport = useRef(size);
  useEffect(() => {
    if (previousViewport.current.width === size.width && previousViewport.current.height === size.height) return;
    previousViewport.current = size;
    if (!approached || !inspection || !cabinet.current || magazineActive) return;
    const pose = inspection.id.startsWith('whisky:')
      ? whiskyInspectionPose(cabinet.current, size, WHISKY_BOTTLES.find(bottle => `whisky:${bottle.image}` === inspection.id))
      : (open ? whiskyCabinetPose : whiskyClosedCabinetPose)(cabinet.current, size);
    setInspection({ id: inspection.id, ...pose });
  }, [approached, inspection, magazineActive, open, setInspection, size]);
  return <group ref={cabinet} name="Poltrona Frau Isidoro drinks cabinet"
    userData={{
      product: 'Poltrona Frau Isidoro',
      width: WHISKY_CABINET.width,
      depth: WHISKY_CABINET.depth,
      height: WHISKY_CABINET.height,
      openWidth: WHISKY_CABINET.openWidth,
      open: open && !editing,
      selectedBottle: selection?.bottle ?? null,
    }} {...(!open ? handlers : {
      onPointerDown: stopInteriorClick, onPointerUp: stopInteriorClick, onClick: stopInteriorClick,
    })}>
    <IsidoroFixedHalf wood={wood} interior={fixedInterior}>
      <group ref={barware} name="Enclosed Isidoro barware">
      <IsidoroBarware />
      </group>
      {/* Keep zero-intensity lights registered while closed so opening does not recompile the room. */}
      <IsidoroInteriorLighting lowerShelf={0.973} open={open && !editing} power={lamp} reducedMotion={reducedMotion} />
    </IsidoroFixedHalf>
    <WhiskyCabinetDoor open={open} pivot={doorPivot} worktop={worktopPivot} interior={movingInterior} wood={wood}
      exterior={<WhiskyLectureCard open={open} disabled={editing}
        onApproach={visitClosedCabinet} onReturn={approachCabinet} />
      }
      disabled={editing} onActivate={toggle}>
      <group ref={bottles} name="complete seven-bottle whisky and Armagnac collection">
        {(SIMPLE_OFFICE || roomReady) && <Suspense fallback={null}><WhiskyCollection cabinet={cabinet} selection={selection}
          enabled={ready && !editing} reducedMotion={reducedMotion || editing} onSelect={chooseBottle} onReturned={returned}
          onReady={onBottlesReady} /></Suspense>}
        {(SIMPLE_OFFICE || roomReady) && <Suspense fallback={null}><WhiskyMagazine enabled={ready && !editing && !selection} reducedMotion={reducedMotion || editing}
          onBusyChange={setMagazineBusy} onReturn={approachCabinet} onReady={onMagazineReady} /></Suspense>}
      </group>
      <IsidoroInteriorLighting lowerShelf={0.648} open={open && !editing} power={lamp} reducedMotion={reducedMotion} />
    </WhiskyCabinetDoor>
    <IsidoroWorktop open={open} pivot={worktopPivot} wood={wood} disabled={editing} />
    <Html fullscreen zIndexRange={[17, 11]} style={{ pointerEvents: 'none' }}
      calculatePosition={(_object, _camera, viewport) => [viewport.width / 2, viewport.height / 2]}>
      <button className="office-secret-trigger" type="button" disabled={editing || lectureActive || magazineBusy}
        aria-expanded={open} onClick={toggle}>{open ? 'Close' : approached ? 'Open' : 'View'} Isidoro drinks cabinet</button>
    </Html>
    {approached && !selection && !magazineActive && <Html fullscreen zIndexRange={[18, 12]} style={{ pointerEvents: 'none' }}
      calculatePosition={(_object, _camera, viewport) => [viewport.width / 2, viewport.height / 2]}>
      <button className="whisky-cabinet-exit" type="button" onClick={leaveCabinet} aria-label="Close cabinet view"
        onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}><OfficeIcon name="close" /></button>
    </Html>}
    {selection && <WhiskyBottleInspector bottleId={selection.bottle} returning={selection.returning}
      onReturn={returnBottle} />}
  </group>;
}
