import test from 'node:test'
import assert from 'node:assert/strict'
import { getMovieLimit, buildMovieUrl } from '../src/api.js'
import { limitRenderedItems } from '../src/screens/list.js'

test('mobile viewport uses 5 movies per page', () => {
  assert.equal(getMovieLimit(true), 5)
  assert.equal(getMovieLimit(false), 20)
})

test('API URLs include the requested limit for endpoints that support it', () => {
  assert.equal(buildMovieUrl('phim-bo', 2, '', '', '', 4), '/v1/api/danh-sach/phim-bo?page=2&limit=4&sort_field=year&sort_type=desc')
  assert.equal(buildMovieUrl('search', 1, 'test phim', '', '', 4), '/v1/api/tim-kiem?keyword=test%20phim&page=1&limit=4&sort_field=year&sort_type=desc')
})

test('mobile render fallback only keeps first 5 items', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ slug: String(i) }))
  assert.equal(limitRenderedItems(items, true).length, 5)
  assert.equal(limitRenderedItems(items, false).length, 10)
})
