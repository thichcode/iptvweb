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

