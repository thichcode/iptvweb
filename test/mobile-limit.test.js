import test from 'node:test'
import assert from 'node:assert/strict'
import { API_BASE, apiGet, getMovieLimit, buildMovieUrl, imgSrc, getApiSource, nextApiSource } from '../src/api.js'
import { limitRenderedItems, renderMovieCard, renderEmptyState } from '../src/screens/list.js'

test('mobile viewport uses 5 movies per page', () => {
  assert.equal(getMovieLimit(true), 5)
  assert.equal(getMovieLimit(false), 20)
})

test('API URLs include the requested limit for endpoints that support it', () => {
  assert.equal(buildMovieUrl('phim-bo', 2, '', '', '', 4), '/v1/api/danh-sach/phim-bo?page=2&limit=4&sort_field=year&sort_type=desc')
  assert.equal(buildMovieUrl('search', 1, 'test phim', '', '', 4), '/v1/api/tim-kiem?keyword=test%20phim&page=1&limit=4&sort_field=year&sort_type=desc')
})

test('API defaults to proxy', () => {
  assert.equal(API_BASE, '/api/proxy')
})

test('apiGet falls back when proxy and primary API return errors', async () => {
  const oldFetch = globalThis.fetch
  const urls = []
  globalThis.fetch = async url => {
    urls.push(url)
    if (urls.length <= 1) return { ok: false, status: 404 }
    return { ok: true, json: async () => ({ status: 'success' }) }
  }

  try {
    assert.deepEqual(await apiGet('/v1/api/danh-sach/phim-bo?page=1', 0), { status: 'success' })
    assert.ok(urls[0].includes('/api/proxy?path='), 'first call goes to proxy')
    assert.ok(urls[1].includes('ophim1.com'), 'fallback hits external API')
  } finally {
    globalThis.fetch = oldFetch
  }
})

test('api source defaults to proxy and cycles sources', () => {
  const oldLocalStorage = globalThis.localStorage
  globalThis.localStorage = { getItem: () => null }

  try {
    assert.equal(getApiSource(), 'proxy')
    assert.equal(nextApiSource(), 'ophim')
  } finally {
    globalThis.localStorage = oldLocalStorage
  }
})

test('apiGet uses selected OPhim as primary', async () => {
  const oldFetch = globalThis.fetch
  const oldLocalStorage = globalThis.localStorage
  const urls = []
  globalThis.localStorage = { getItem: () => 'ophim' }
  globalThis.fetch = async url => {
    urls.push(url)
    return { ok: true, json: async () => ({ status: 'success' }) }
  }

  try {
    assert.deepEqual(await apiGet('/v1/api/danh-sach/phim-bo?page=1', 0), { status: 'success' })
    assert.equal(urls[0], 'https://ophim1.com/v1/api/danh-sach/phim-bo?page=1')
  } finally {
    globalThis.fetch = oldFetch
    globalThis.localStorage = oldLocalStorage
  }
})

test('apiGet uses selected PhimAPI as primary', async () => {
  const oldFetch = globalThis.fetch
  const oldLocalStorage = globalThis.localStorage
  const urls = []
  globalThis.localStorage = { getItem: () => 'phimapi' }
  globalThis.fetch = async url => {
    urls.push(url)
    return { ok: true, json: async () => ({ status: 'success' }) }
  }

  try {
    assert.deepEqual(await apiGet('/v1/api/danh-sach/phim-bo?page=1', 0), { status: 'success' })
    assert.equal(urls[0], 'https://phimapi.com/v1/api/danh-sach/phim-bo?page=1')
  } finally {
    globalThis.fetch = oldFetch
    globalThis.localStorage = oldLocalStorage
  }
})

test('image URLs use live CDN directly', () => {
  assert.equal(imgSrc('poster.jpg'), 'https://img.ophim.live/uploads/movies/poster.jpg')
  assert.equal(imgSrc('upload/vod/poster.jpg'), 'https://phimimg.com/upload/vod/poster.jpg')
  assert.equal(imgSrc('https://img.ophim.live/uploads/movies/poster.jpg'), 'https://img.ophim.live/uploads/movies/poster.jpg')
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
