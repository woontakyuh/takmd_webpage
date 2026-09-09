import { Suspense, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { Group } from 'three';
import type { BookPage, PersonalBook } from '../personalBooks';
import { BookSurfaceMesh } from './BookSurface';
import { BookPaperPacket } from './BookPaperPacket';
import { bookPacketLayout } from './bookGeometry';
import { useBookPageTurn } from './useBookPageTurn';

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

export function PhysicalBook({ book, showDetails, page, openAmount, reducedMotion, active, onPageStep }: {
  readonly book: PersonalBook;
  readonly showDetails: boolean;
  readonly page: BookPage | undefined;
  readonly openAmount: RefObject<number>;
  readonly reducedMotion: boolean;
  readonly active: boolean;
  readonly onPageStep: (direction: 1 | -1) => void;
}) {
  const pageTurn = useBookPageTurn(active, onPageStep);
  const cover = useRef<Group>(null);
  const bend = useRef(0);
  const { width: w, height: h, thickness: t } = book;
  const board = book.coverThickness ?? .0015;
  const { leftDepth, rightDepth, splitZ } = bookPacketLayout({ thickness: t, coverThickness: board }, page?.leftLeaves ?? 0);
  const pageWidth = w - .002;
  const pageHeight = h - .002;
  useFrame((_, delta) => {
    if (!cover.current) return;
    const spreadAngle = book.id === 'csrs' && page && !page.left ? .55 : .92;
    const target = page ? -Math.PI * spreadAngle * openAmount.current : 0;
    const angle = reducedMotion ? target : MathUtils.damp(cover.current.rotation.y, target, 8, delta);
    cover.current.rotation.y = Math.max(angle, -Math.PI * .92 * openAmount.current);
    bend.current = .015 * MathUtils.smoothstep(-cover.current.rotation.y, .1, 2.2);
  });
  return <group name={`physical-book-${book.id}`}>
    <group position={[.001, 0, splitZ]}>
      <BookPaperPacket width={pageWidth} height={pageHeight} depth={rightDepth}
        direction={1} bend={bend} name="right-bound-paper-packet" />
    </group>
    <Solid name="binding-body" size={[.002, h, t]} position={[0, 0, 0]} color={book.binding} />
    <Solid name="back-cover-board" size={[w, h, board]}
      position={[w / 2, 0, -t / 2 + board / 2]} color={book.binding} />
    <Suspense fallback={null}>
      <BookSurfaceMesh surface={book.spine} width={t} height={h} name={`book-spine-${book.id}`}
        position={[-.0011, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
    </Suspense>
    {showDetails && <Suspense fallback={null}>
      <BookSurfaceMesh surface={book.back} width={w} height={h} name={`book-back-${book.id}`}
        position={[w / 2, 0, -t / 2 - .00003]} rotation={[0, Math.PI, 0]} />
      {page && <group name={`book-next-page-${book.id}`} {...pageTurn(1)}>
        <BookSurfaceMesh surface={page.right} width={pageWidth} height={pageHeight} bend={bend}
          name={`book-right-page-${book.id}`} position={[w / 2, 0, splitZ + .00005]} />
      </group>}
    </Suspense>}
    <group name="hinged-front-cover" ref={cover} position={[0, 0, splitZ]} {...pageTurn(-1)}>
      {leftDepth > 0 && <group position={[.001, 0, 0]}>
        <BookPaperPacket width={pageWidth} height={pageHeight} depth={leftDepth}
          direction={-1} bend={bend} name="left-bound-paper-packet" />
      </group>}
      <group name={`book-next-cover-${book.id}`} {...pageTurn(1)}>
        <Solid name="front-cover-board" size={[w, h, board]}
          position={[w / 2, 0, leftDepth + board / 2]} color={book.binding} />
        {showDetails && <Suspense fallback={null}>
          <BookSurfaceMesh surface={book.cover} width={w} height={h} name={`book-cover-${book.id}`}
            position={[w / 2, 0, leftDepth + board + .00003]} />
        </Suspense>}
      </group>
      <mesh name="inside-cover-paper" position={[w / 2, 0, leftDepth - .00004]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[pageWidth, pageHeight]} />
        <meshStandardMaterial color={book.id === 'woodpecker' ? '#d5cd29' : '#e6dfcf'} roughness={.94} />
      </mesh>
      {showDetails && <Suspense fallback={null}>
        {page?.left && <BookSurfaceMesh surface={page.left} width={pageWidth} height={pageHeight} bend={bend} spineAtRight
          name={`book-left-page-${book.id}`} position={[w / 2, 0, -.00005]} rotation={[0, Math.PI, 0]} />}
      </Suspense>}
    </group>
  </group>;
}
