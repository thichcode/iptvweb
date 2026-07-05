const PI = Math.PI
const CAN = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý']
const CHI = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi']
const DOW = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy']

function jd(dd, mm, yy) {
  const a = Math.floor((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3
  return dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

function newMoon(k) {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
  const Mp = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3
  let jd = jd1 + 0.1734 * Math.sin(M * dr) - 0.4068 * Math.sin(Mp * dr) + 0.0161 * Math.sin(2 * dr * Mp)
  jd -= 0.0004 * Math.sin(dr * 2 * F) - 0.0052 * Math.sin(dr * (M + Mp)) - 0.0104 * Math.sin(dr * (M - Mp))
  return jd + 0.000233 * Math.sin(dr * (2 * F + Mp))
}

function sunLongitude(jdn) {
  const T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = PI / 180
  let L = 280.46646 + 36000.76983 * T + 0.0003032 * T2
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T2
  let C = (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(M * dr)
  C += (0.019993 - 0.000101 * T) * Math.sin(2 * M * dr) + 0.000289 * Math.sin(3 * M * dr)
  let sl = L + C
  return sl - 360 * Math.floor(sl / 360)
}

function lunarMonth11(yy, tz) {
  const off = jd(31, 12, yy) - 2415019
  return Math.floor(newMoon(Math.floor(off / 29.530588853)) + 0.5 + tz / 24)
}

function leapMonthOffset(a11, tz) {
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853)
  let last = 0, i = 1
  let arc = sunLongitude(newMoon(k + 1))
  do { last = arc; i++; arc = sunLongitude(newMoon(k + i)) } while (arc !== last && i < 14)
  return i - 1
}

export function solarToLunar(yy, mm, dd, tz) {
  tz = tz || 7
  const dayNumber = jd(dd, mm, yy)
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853)
  let monthStart = Math.floor(newMoon(k + 1) + 0.5 + tz / 24)
  if (monthStart > dayNumber) monthStart = Math.floor(newMoon(k) + 0.5 + tz / 24)
  let a11 = lunarMonth11(yy, tz), lunarYear
  if (a11 >= monthStart) { lunarYear = yy; a11 = lunarMonth11(yy - 1, tz) }
  else { lunarYear = yy + 1 }
  const lunarDay = dayNumber - monthStart + 1
  const diff = Math.floor((monthStart - a11) / 29)
  const leapOff = leapMonthOffset(a11, tz)
  let lunarMonth, leap = false
  if (diff <= leapOff) { lunarMonth = diff; leap = false }
  else if (diff <= leapOff + 1) { lunarMonth = diff - 1; leap = true }
  else { lunarMonth = diff - 1; leap = false }
  return { day: lunarDay, month: Math.max(1, Math.min(12, lunarMonth)), year: lunarYear, leap }
}

export function getToday() {
  const n = new Date()
  const yy = n.getFullYear(), mm = n.getMonth() + 1, dd = n.getDate()
  const jdn = jd(dd, mm, yy)
  const l = solarToLunar(yy, mm, dd)
  return {
    dow: DOW[n.getDay()],
    solar: { day: dd, month: mm, year: yy },
    lunar: l,
    dayCanChi: CAN[(jdn + 9) % 10] + ' ' + CHI[(jdn + 1) % 12],
    yearCanChi: CAN[(l.year - 4) % 10] + ' ' + CHI[(l.year - 4) % 12]
  }
}
