import test from 'node:test'
import assert from 'node:assert/strict'
import { getMovieLimit, buildMovieUrl } from '../src/api.js'
import { limitRenderedItems, renderMovieCard, renderEmptyState } from '../src/screens/list.js'

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

test('movie card markup uses poster-card class and meaningful alt text', () => {
  const html = renderMovieCard({ slug: 'dao-doc-dac', name: 'Đảo độc đắc', year: 2023, origin_name: 'Việt Nam', thumb_url: 'poster.jpg' })
  assert.match(html, /class="local-item movie-card"/)
  assert.match(html, /alt="Đảo độc đắc"/)
  assert.match(html, /2023 • Việt Nam/)
})

test('empty state has composed title and hint', () => {
  const html = renderEmptyState('Danh sách trống', 'Phim đã xem hoặc yêu thích sẽ hiện ở đây.')
  assert.match(html, /empty-state/)
  assert.match(html, /Danh sách trống/)
  assert.match(html, /Phim đã xem hoặc yêu thích sẽ hiện ở đây\./)
})
