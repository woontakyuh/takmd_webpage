import { Html, useCursor } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject, SyntheticEvent } from 'react';
import { Box3 } from 'three';
import type { Group } from 'three';
import { useArrangement } from '../arrangement';
import { OfficeIcon } from '../OfficeIcon';
import type { CollectionItem } from './CollectionInspectionData';
import { collectionInspection, itemInspection } from './CollectionInspectionData';
import { collectionCopyWidth, fitCollectionItem, positionCollectionCopy, projectCollectionBounds } from './CollectionInspectionLayout';
import { inspectionBelongsToCollection, nextCollectionInspection } from './CollectionInspectionState';
import type { CollectionId } from './CollectionInspectionState';
import { useSceneInspection } from './SceneInspection';
import { cancelSceneSingleAction, scheduleSceneSingleAction } from './sceneGesture';
import './collection-inspection.css';

const CLICK_THRESHOLD = 5;
const SETTLED_DISTANCE = 0.1;

type Gesture = { readonly pointerId: number; readonly x: number; readonly y: number };

function collectionBounds(group: Group, item: CollectionItem) {
  const obstacle = item.copyAvoid ? group.parent?.getObjectByName(`${item.copyAvoid} inspection target`) : undefined;
  return { bounds: new Box3().setFromObject(group, true), obstacle: obstacle ? new Box3().setFromObject(obstacle, true) : undefined };
}

export function CollectionInspectionItem({ item, children }: {
  readonly item: CollectionItem;
  readonly children: ReactNode;
}) {
  const { editing } = useArrangement();
  const { camera, gl, size } = useThree();
  const { inspection, setInspection } = useSceneInspection();
  const latestInspection = useRef(inspection);
  const group = useRef<Group>(null);
  const gesture = useRef<Gesture | null>(null);
  const [hovered, setHovered] = useState(false);
  const focused = inspection?.id === item.id;
  latestInspection.current = inspection;
  useCursor(hovered && !editing);
  useEffect(() => { if (editing) setHovered(false); }, [editing]);

  const modified = (event: ThreeEvent<PointerEvent>) => event.shiftKey || event.ctrlKey || event.metaKey || event.altKey;
  const onPointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const start = gesture.current;
    gesture.current = null;
    if (editing || !start || event.button !== 0 || !event.isPrimary || modified(event) || event.pointerId !== start.pointerId
      || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= CLICK_THRESHOLD) return;
    const currentId = inspection?.id ?? null;
    if (inspectionBelongsToCollection(currentId, item.collection) && inspection
      && camera.position.distanceTo({ x: inspection.position[0], y: inspection.position[1], z: inspection.position[2] }) > SETTLED_DISTANCE) return;
    scheduleSceneSingleAction(gl.domElement, () => {
      if ((latestInspection.current?.id ?? null) !== currentId) return;
      const nextId = nextCollectionInspection(currentId, item.collection, item.id);
      if (nextId === item.id && group.current) {
        const { bounds, obstacle } = collectionBounds(group.current, item);
        setInspection(itemInspection(item, size.width, size.height, bounds, 240, obstacle));
      } else setInspection(collectionInspection(item.collection, size.width, size.height));
    });
  };

  return <group ref={group} name={`${item.id} inspection target`}
    onPointerOver={event => { if (!editing && event.buttons === 0) { event.stopPropagation(); setHovered(true); } }}
    onPointerOut={() => setHovered(false)}
    onPointerDown={event => {
      if (editing) return;
      event.stopPropagation();
      gesture.current = event.button === 0 && event.isPrimary && !modified(event)
        ? { pointerId: event.pointerId, x: event.clientX, y: event.clientY } : null;
    }}
    onPointerCancel={() => { gesture.current = null; }} onPointerUp={onPointerUp}
    onClick={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>
    {children}
    {focused && <CollectionDescription item={item} target={group} />}
  </group>;
}

export function CollectionInspectionExit({ collection }: { readonly collection: CollectionId }) {
  const { gl } = useThree();
  const { inspection, setInspection } = useSceneInspection();
  const active = inspectionBelongsToCollection(inspection?.id ?? null, collection);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement;
    button.current?.focus({ preventScroll: true });
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog:modal')) return;
      event.preventDefault();
      setInspection(null);
    };
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('keydown', close);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [active, setInspection]);
  const anchor = collectionInspection(collection, 1280, 720).target;
  const close = (event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
    cancelSceneSingleAction(gl.domElement);
    setInspection(null);
  };
  return active ? <Html position={anchor} fullscreen zIndexRange={[42, 38]} style={{ pointerEvents: 'none' }}
    calculatePosition={(_, __, viewport) => [viewport.width / 2, viewport.height / 2]}>
    <button ref={button} type="button" className="collection-inspection-exit"
      onPointerDown={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()} onClick={close}
      aria-label={`Close ${collection} inspection`}><OfficeIcon name="close" /></button>
  </Html> : null;
}

function CollectionDescription({ item, target }: { readonly item: CollectionItem; readonly target: RefObject<Group | null> }) {
  const { camera, size } = useThree();
  const { setInspection } = useSceneInspection();
  const [section, setSection] = useState<HTMLElement | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const placement = useRef<{
    readonly bounds: Box3;
    readonly obstacle: Box3 | undefined;
    readonly layout: ReturnType<typeof fitCollectionItem>;
  } | null>(null);
  useLayoutEffect(() => {
    const group = target.current, element = section, text = content.current;
    if (!group || !element || !text) return;
    const { bounds, obstacle } = collectionBounds(group, item);
    let measuredHeight = 0;
    const arrange = () => {
      const height = text.getBoundingClientRect().height;
      if (Math.abs(height - measuredHeight) < .5) return;
      measuredHeight = height;
      const layout = fitCollectionItem(bounds, item.copy, size, height, obstacle);
      placement.current = { bounds, obstacle, layout };
      element.style.maxHeight = `${layout.copyHeight}px`;
      setInspection({ id: item.id, position: layout.position, target: layout.target });
    };
    arrange();
    const observer = new ResizeObserver(arrange);
    observer.observe(text);
    return () => observer.disconnect();
  }, [item, section, setInspection, size.width, size.height, target]);
  useFrame(() => {
    const current = placement.current, element = section;
    if (!current || !element) return;
    const object = projectCollectionBounds(current.bounds, camera, size);
    const obstacle = current.obstacle ? projectCollectionBounds(current.obstacle, camera, size) : undefined;
    const { left, top } = positionCollectionCopy(object, current.layout, size, obstacle);
    element.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    element.style.visibility = 'visible';
  });
  return <Html position={item.center} fullscreen zIndexRange={[40, 36]} style={{ pointerEvents: 'none' }}
    calculatePosition={(_, __, viewport) => [viewport.width / 2, viewport.height / 2]}>
    <section ref={setSection} className="collection-inspection-copy" role="dialog" aria-modal="false" tabIndex={0}
      style={{ width: collectionCopyWidth(size), visibility: 'hidden' }}
      aria-labelledby={`collection-title-${item.id}`} data-item={item.id} lang="en"
      onPointerDown={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}>
      <div ref={content} className="collection-inspection-content">
      <p className="collection-inspection-label">{item.label}</p>
      <h2 id={`collection-title-${item.id}`}>{item.title}</h2>
      <p className="collection-inspection-date">{item.date}</p>
      <p>{item.description}</p>
      </div>
    </section>
  </Html>;
}
