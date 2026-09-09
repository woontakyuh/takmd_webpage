import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { Group } from 'three';
import type { ExhibitId } from '../types';
import { BOOK_READING_CENTER, BOOK_SHELF_TOP, PERSONAL_BOOKS } from '../personalBooks';
import type { PersonalBook, PersonalBookId } from '../personalBooks';
import { Interactive } from './Interactive';
import { PhysicalBook } from './PhysicalBook';

type BookshelfBooksProps = {
  readonly selected: ExhibitId | null;
  readonly selectedBook: PersonalBookId;
  readonly pageIndex: number;
  readonly reducedMotion: boolean;
  readonly onBookSelect: (id: PersonalBookId) => void;
};

const BOOK_GAP = .003;
const ROW_WIDTH = PERSONAL_BOOKS.reduce((sum, book) => sum + book.thickness + BOOK_GAP, -BOOK_GAP);
const SHELF_SPINE_Z = 3.004;

export function BookshelfBooks(props: BookshelfBooksProps) {
  const extractedBook = useRef<PersonalBookId | null>(null);
  let offset = 0;
  return <group name="owner-photographed-personal-library">
    {PERSONAL_BOOKS.map(book => {
      const x = -1.875 + ROW_WIDTH / 2 - offset - book.thickness / 2;
      offset += book.thickness + BOOK_GAP;
      return <ShelfBook key={book.id} book={book} shelfX={x} extractedBook={extractedBook} {...props} />;
    })}
  </group>;
}

function ShelfBook({ book, shelfX, extractedBook, selected, selectedBook, pageIndex, reducedMotion, onBookSelect }: BookshelfBooksProps & {
  readonly book: PersonalBook;
  readonly shelfX: number;
  readonly extractedBook: RefObject<PersonalBookId | null>;
}) {
  const active = selected === 'books' && selectedBook === book.id;
  const group = useRef<Group>(null);
  const progress = useRef(0);
  const opening = useRef(0);
  const readingOffset = useRef(0);
  const hoverOffset = useRef(0);
  const previousPage = useRef(pageIndex);
  const [hovered, setHovered] = useState(false);
  const [detailsRequested, setDetailsRequested] = useState(active);
  const visiblePageIndex = active ? pageIndex : previousPage.current;
  const page = book.pages[visiblePageIndex];

  useEffect(() => {
    if (!active) return;
    setDetailsRequested(true);
    previousPage.current = pageIndex;
  }, [active, pageIndex]);

  useFrame((_, delta) => {
    const object = group.current;
    if (!object) return;
    const canExtract = active && (extractedBook.current === null || extractedBook.current === book.id);
    if (canExtract) extractedBook.current = book.id;
    progress.current = reducedMotion ? Number(canExtract) : MathUtils.damp(progress.current, Number(canExtract), 8, Math.min(delta, .1));
    if (!active && progress.current < .003 && extractedBook.current === book.id) extractedBook.current = null;
    const pull = MathUtils.smoothstep(progress.current, 0, .5);
    const turn = MathUtils.smoothstep(progress.current, .5, 1);
    opening.current = MathUtils.smoothstep(progress.current, .72, 1);
    const offsetTarget = page ? (book.id === 'csrs' && !page.left ? book.width * .43 : 0) : book.width / 2;
    readingOffset.current = reducedMotion ? offsetTarget : MathUtils.damp(readingOffset.current, offsetTarget, 8, delta);
    hoverOffset.current = reducedMotion ? Number(hovered) : MathUtils.damp(hoverOffset.current, Number(hovered), 8, delta);
    const readingX = BOOK_READING_CENTER[0] + readingOffset.current;
    object.position.set(
      MathUtils.lerp(shelfX, readingX, turn),
      MathUtils.lerp(BOOK_SHELF_TOP + book.height / 2, BOOK_READING_CENTER[1], turn),
      MathUtils.lerp(SHELF_SPINE_Z - hoverOffset.current * .007, BOOK_READING_CENTER[2], pull),
    );
    object.rotation.set(.65 * turn, -Math.PI / 2 - Math.PI / 2 * turn, 0);
  });

  return <group ref={group} position={[shelfX, BOOK_SHELF_TOP + book.height / 2, SHELF_SPINE_Z]}
    rotation={[0, -Math.PI / 2, 0]} name={`shelf-book-${book.id}`}>
    <Interactive id="books" selected={selected} onSelect={() => onBookSelect(book.id)}
      onActivate={() => onBookSelect(book.id)} position={[0, 0, 0]} reducedMotion={reducedMotion}
      onHoverChange={setHovered} name={`Read ${book.title}`}>
      <PhysicalBook book={book} showDetails={detailsRequested} page={page}
        openAmount={opening} reducedMotion={reducedMotion} />
    </Interactive>
  </group>;
}
