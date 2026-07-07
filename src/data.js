let movies = null

export async function loadMovies() {
  if (movies) return movies
  try {
    const res = await fetch('/movies.json')
    if (!res.ok) return []
    movies = await res.json()
    return movies
  } catch { return [] }
}

export function searchLocal(keyword, page = 1, limit = 20) {
  if (!movies || !keyword) return { items: [], totalPages: 0 }
  const q = keyword.toLowerCase()
  const matched = movies.filter(m =>
    (m.name || '').toLowerCase().includes(q) ||
    (m.origin_name || '').toLowerCase().includes(q) ||
    (m.slug || '').toLowerCase().includes(q)
  )
  const totalPages = Math.ceil(matched.length / limit)
  const start = (page - 1) * limit
  return { items: matched.slice(start, start + limit), totalPages, total: matched.length }
}

export function getRandomMovies(count = 5) {
  if (!movies?.length) return []
  const shuffled = [...movies].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function getMoviesByPage(page = 1, limit = 20) {
  if (!movies) return { items: [], totalPages: 0 }
  const start = (page - 1) * limit
  return { items: movies.slice(start, start + limit), totalPages: Math.ceil(movies.length / limit) }
}
