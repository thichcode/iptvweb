const FAVS_KEY = 'wp_favs'
const HIST_KEY = 'wp_hist'

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

export const store = {
  screen: 'home',
  menuIndex: 0,
  listItems: [],
  listPage: 1,
  listTotalPages: 1,
  listType: '',
  currentSlug: '',
  currentMovie: null,
  episodes: [],
  episodeFocusIdx: 0,
  currentKeyword: '',
  categorySlug: '',
  countrySlug: '',
  searchMode: false,
  prevScreen: '',
  serverIdx: 0,
  epIdx: 0
}

export function getFavs() { return read(FAVS_KEY) }
export function setFavs(o) { write(FAVS_KEY, o) }
export function isFav(slug) { return !!getFavs()[slug] }
export function toggleFav(slug, movie) {
  const f = getFavs()
  if (f[slug]) { delete f[slug] } else { f[slug] = { name: movie.name, thumb: movie.thumb_url || movie.poster_url || '', year: movie.year, origin: movie.origin_name } }
  setFavs(f)
}

export function getHist() { return read(HIST_KEY) }
export function setHist(o) { write(HIST_KEY, o) }
export function saveHist(slug, movie, epName, sIdx, eIdx) {
  const h = getHist()
  h[slug] = { name: movie.name, thumb: movie.thumb_url || movie.poster_url || '', year: movie.year, origin: movie.origin_name, episode: epName, serverIdx: sIdx, epIdx: eIdx, at: Date.now() }
  setHist(h)
}
