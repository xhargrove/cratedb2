import { describe, expect, it } from 'vitest';

import {
  parseCollectionSearchParams,
  serializeCollectionParams,
  type CollectionUrlState,
} from '@/lib/collection-query-params';

describe('parseCollectionSearchParams', () => {
  it('defaults empty query to newest sort and grid view', () => {
    expect(parseCollectionSearchParams({})).toEqual({
      q: '',
      sort: 'newest',
      view: 'grid',
      genre: '',
      storageLocation: '',
    });
  });

  it('parses q, sort, view, genre, location', () => {
    expect(
      parseCollectionSearchParams({
        q: '  jazz ',
        sort: 'title-asc',
        view: 'list',
        genre: 'Rock',
        location: 'Shelf A',
      })
    ).toEqual({
      q: 'jazz',
      sort: 'title-asc',
      view: 'list',
      genre: 'Rock',
      storageLocation: 'Shelf A',
    });
  });

  it('falls back invalid sort to newest', () => {
    expect(parseCollectionSearchParams({ sort: 'not-a-sort' }).sort).toBe(
      'newest'
    );
  });

  it('falls back invalid view to grid', () => {
    expect(parseCollectionSearchParams({ view: 'tiles' }).view).toBe('grid');
  });

  it('uses first value when param is an array', () => {
    expect(
      parseCollectionSearchParams({
        q: ['a', 'b'],
        sort: ['artist-asc', 'newest'],
      })
    ).toMatchObject({ q: 'a', sort: 'artist-asc' });
  });
});

describe('serializeCollectionParams', () => {
  const base: CollectionUrlState = {
    q: '',
    sort: 'newest',
    view: 'grid',
    genre: '',
    storageLocation: '',
  };

  it('returns empty string for all defaults', () => {
    expect(serializeCollectionParams(base)).toBe('');
  });

  it('includes non-default fields only', () => {
    expect(
      serializeCollectionParams({
        ...base,
        q: 'hello',
        sort: 'oldest',
        view: 'list',
        genre: 'Funk',
        storageLocation: 'Bin 2',
      })
    ).toBe('?q=hello&sort=oldest&view=list&genre=Funk&location=Bin+2');
  });

  it('preserves list view without other params', () => {
    expect(serializeCollectionParams({ ...base, view: 'list' })).toBe(
      '?view=list'
    );
  });
});
