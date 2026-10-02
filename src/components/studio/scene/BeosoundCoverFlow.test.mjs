import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BeosoundCoverFlow } from './BeosoundCoverFlow';
import { ALBUM_IDS } from './BeosoundAlbums';

describe('CD case order during exchange', () => {
  for (const focusAlbum of ALBUM_IDS) {
    test(`preserves catalog order while viewing case ${focusAlbum}`, () => {
      const markup = renderToStaticMarkup(createElement(BeosoundCoverFlow, {
        album: 7, focusAlbum, disabled: true, onAlbum() {}, onOpen() {},
      }));
      const cases = [...markup.matchAll(/data-cd-album="(\d+)"[^>]*style="([^"]*)"/g)];
      expect(cases.map(match => Number(match[1]))).toEqual([...ALBUM_IDS]);
      const offsets = cases.map(match => Number(/--cover-offset:([^;]+)/.exec(match[2])[1]));
      for (let index = 1; index < offsets.length; index++) expect(offsets[index]).toBeGreaterThan(offsets[index - 1]);
      expect(offsets[ALBUM_IDS.indexOf(focusAlbum)]).toBe(0);
    });
  }
});
