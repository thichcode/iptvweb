import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PRIMARY = 'https://ophim1.com'
const FALLBACK = 'https://phimapi.com'
const DELAY = 120
const PAGE_SIZE = 24
const OUT = join(process.cwd(), 'public', 'movies.json')

function loadProgress() {
  if (!existsSync(OUT)) return { page: 1, movies: [] }
  try {
    const movies = JSON.parse(readFileSync(OUT, 'utf8'))
    return { page: Math.floor(movies.length / PAGE_SIZE) + 1, movies }
  } catch { return { page: 1, movies: [] } }
}

function save(movies) {
  writeFileSync(OUT, JSON.stringify(movies))
}

async function fetchPage(page) {
  const url = `/danh-sach/phim-moi-cap-nhat?page=${page}&limit=${PAGE_SIZE}`
  for (const base of [PRIMARY, FALLBACK]) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 12000)
      const res = await fetch(base + url, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!res.ok) continue
      return await res.json()
    } catch {}
  }
  return null
}

function slim(item) {
  return {
    name: item.name,
    slug: item.slug,
    origin_name: item.origin_name || '',
    year: item.year || 0,
    thumb_url: item.thumb_url || '',
    poster_url: item.poster_url || ''
  }
}

async function crawl() {
  const first = await fetchPage(1)
  if (!first?.items?.length) { console.error('API down'); process.exit(1) }

  const total = first.pagination?.totalItems || first.items.length
  const totalPages = first.pagination?.totalPages || Math.ceil(total / PAGE_SIZE)
  console.log(`Total: ${total} movies, ${totalPages} pages`)

  const { page: startPage, movies } = loadProgress()
  if (movies.length > 0) console.log(`Resuming from page ${startPage} (${movies.length} movies cached)`)

  for (let p = startPage; p <= totalPages; p++) {
    if (p === 1 && startPage === 1) {
      for (const item of first.items) movies.push(slim(item))
    } else {
      await new Promise(r => setTimeout(r, DELAY))
      const data = await fetchPage(p)
      if (!data?.items?.length) {
        await new Promise(r => setTimeout(r, 800))
        const retry = await fetchPage(p)
        if (!retry?.items?.length) { console.log(`Page ${p} skipped`); continue }
        for (const item of retry.items) movies.push(slim(item))
      } else {
        for (const item of data.items) movies.push(slim(item))
      }
    }
    if (p % 100 === 0 || p === totalPages) {
      save(movies)
      console.log(`Page ${p}/${totalPages} - ${movies.length} movies`)
    }
  }

  save(movies)
  const mb = (Buffer.byteLength(JSON.stringify(movies)) / 1024 / 1024).toFixed(1)
  console.log(`Done! ${movies.length} movies - ${mb} MB`)
}

crawl()
