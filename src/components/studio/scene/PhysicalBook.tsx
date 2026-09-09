import { Suspense, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { Group } from 'three';
import type { BookPage, PersonalBook } from '../personalBooks';
import { BookSurfaceMesh } from './BookSurface';

const BOARD_THICKNESS = .0015;

function Solid({ size, position, color, name }: {
  readonly size: readonly [number, number, number];
  readonly position: readonly [number, number, number];
  readonly color: string;
  readonly name: string;
}) {
  return <mesh name={name} position={[...position]} castShadow receiveShadow>
    <boxGeometry args={[...size]} />
    <meshStandardMaterial color={color} roughness={.84} />
  </mesh>;
}

export function PhysicalBook({ book, showDetails, page, openAmount, reducedMotion }: {
  readonly book: PersonalBook;
  readonly showDetails: boolean;
  readonly page: BookPage | undefined;
  readonly openAmount: RefObject<number>;
  readonly reducedMotion: boolean;
}) {
  const cover = useRef<Group>(null);
  const { width: w, height: h, thickness: t } = book;
  useFrame((_, delta) => {
    if (!cover.current) return;
    const target = page ? -Math.PI * .96 * openAmount.current : 0;
    const angle = reducedMotion ? target : MathUtils.damp(cover.current.rotation.y, target, 8, delta);
    cover.current.rotation.y = Math.max(angle, -Math.PI * .96 * openAmount.current);
  });
  return <group name={`physical-book-${book.id}`}>
    <Solid name="bound-paper-block" size={[w - .004, h - .005, t - BOARD_THICKNESS * 2]}
      position={[w / 2, 0, 0]} color="#e6dfcf" />
    <Solid name="binding-body" size={[.004, h, t]} position={[0, 0, 0]} color={book.binding} />
    <Solid name="back-cover-board" size={[w, h, BOARD_THICKNESS]}
      position={[w / 2, 0, -t / 2]} color={book.binding} />
    <Suspense fallback={null}>
      <BookSurfaceMesh surface={book.spine} width={t} height={h} name={`book-spine-${book.id}`}
        position={[-.0021, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
    </Suspense>
    {showDetails && <Suspense fallback={null}>
      <BookSurfaceMesh surface={book.back} width={w} height={h} name={`book-back-${book.id}`}
        position={[w / 2, 0, -t / 2 - .0008]} rotation={[0, Math.PI, 0]} />
      {page && <BookSurfaceMesh surface={page.right} width={w - .004} height={h - .005}
        name={`book-right-page-${book.id}`} position={[w / 2, 0, t / 2 - .0004]} />}
    </Suspense>}
    <group name="hinged-front-cover" ref={cover} position={[0, 0, t / 2]}>
      <Solid name="front-cover-board" size={[w, h, BOARD_THICKNESS]}
        position={[w / 2, 0, 0]} color={book.binding} />
      <mesh name="inside-cover-paper" position={[w / 2, 0, -.0009]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w - .002, h - .002]} />
        <meshStandardMaterial color={book.id === 'woodpecker' ? '#d5cd29' : '#e6dfcf'} roughness={.94} />
      </mesh>
      {showDetails && <Suspense fallback={null}>
        <BookSurfaceMesh surface={book.cover} width={w} height={h} name={`book-cover-${book.id}`}
          position={[w / 2, 0, .0009]} />
        {page?.left && <BookSurfaceMesh surface={page.left} width={w - .004} height={h - .005}
          name={`book-left-page-${book.id}`} position={[w / 2, 0, -.0011]} rotation={[0, Math.PI, 0]} />}
      </Suspense>}
    </group>
  </group>;
}
