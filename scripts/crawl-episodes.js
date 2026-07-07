import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PRIMARY = 'https://ophim1.com'
const FALLBACK = 'https://phimapi.com'
const DELAY = 500
const OUT = join(process.cwd(), 'public', 'episodes.json')
const MOVIES = join(process.cwd(), 'public', 'movies.json')

function loadProgress() {
  if (!existsSync(OUT)) return { movies: {}, failed: [] }
  try {
    const raw = JSON.parse(readFileSync(OUT, 'utf8'))
    if (raw.movies) return raw
    return { movies: raw, failed: [] }
  } catch { return { movies: {}, failed: [] } }
}

function save(data) {
  writeFileSync(OUT, JSON.stringify(data))
}

async function fetchDetail(slug) {
  for (const base of [PRIMARY, FALLBACK]) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 15000)
      const res = await fetch(base + '/phim/' + slug, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!res.ok) continue
      return await res.json()
    } catch {}
  }
  return null
}

async function crawl() {
  const movies = JSON.parse(readFileSync(MOVIES, 'utf8'))
  const total = movies.length
  console.log(`Total: ${total} movies`)

  const progress = loadProgress()
  const done = progress.movies
  const failedSlugs = new Set(progress.failed || [])
  const doneCount = Object.keys(done).length
  if (doneCount > 0) console.log(`Resuming: ${doneCount} crawled, ${failedSlugs.size} failed`)

  let fetched = 0, failed = 0, skipped = 0

  for (let i = 0; i < total; i++) {
    const m = movies[i]
    if (done[m.slug]) { skipped++; continue }

    await new Promise(r => setTimeout(r, DELAY))
    const data = await fetchDetail(m.slug)

    if (!data?.episodes?.length) {
      failed++
      failedSlugs.add(m.slug)
      if (failed % 10 === 0) console.log(`[${i+1}/${total}] fetched=${fetched} failed=${failed} skipped=${skipped}`)
      if (failed % 20 === 0) save({ movies: done, failed: [...failedSlugs] })
      continue
    }

    done[m.slug] = data.episodes.map(ep => ({
      server_name: ep.server_name,
      server_data: (ep.server_data || []).map(e => ({
        name: e.name,
        slug: e.slug,
        link_m3u8: e.link_m3u8 || '',
        link_embed: e.link_embed || ''
      }))
    }))
    failedSlugs.delete(m.slug)

    fetched++
    if (fetched % 10 === 0) {
      save({ movies: done, failed: [...failedSlugs] })
      console.log(`[${i+1}/${total}] fetched=${fetched} failed=${failed} total=${Object.keys(done).length}`)
    }
  }

  save({ movies: done, failed: [...failedSlugs] })
  const mb = (Buffer.byteLength(JSON.stringify(done)) / 1024 / 1024).toFixed(1)
  console.log(`Done! ${Object.keys(done).length} movies with episodes (${mb} MB)`)
}

crawl()
