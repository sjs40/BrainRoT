export function formatDateIso(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfWeekSunday(baseDate = new Date()): Date {
  const date = new Date(baseDate)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - date.getDay())
  return date
}

export function endOfWeekSaturday(weekStart: Date): Date {
  const date = new Date(weekStart)
  date.setDate(date.getDate() + 6)
  date.setHours(0, 0, 0, 0)
  return date
}

export function nextWeekSunday(weekStartIso: string): Date {
  const date = new Date(`${weekStartIso}T00:00:00`)
  date.setDate(date.getDate() + 7)
  return startOfWeekSunday(date)
}

export function weekFilename(weekStartIso: string): string {
  const [year, month, day] = weekStartIso.split('-')
  return `${year.slice(2)}${month}${day}_Brain_Sheet`
}

export function weekLabel(weekStartIso: string): string {
  const date = new Date(`${weekStartIso}T00:00:00`)
  return `Week of ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

export function computeWeekRange(baseDate = new Date()): {
  weekStart: string
  weekEnd: string
  filename: string
} {
  const weekStartDate = startOfWeekSunday(baseDate)
  const weekStart = formatDateIso(weekStartDate)
  return {
    weekStart,
    weekEnd: formatDateIso(endOfWeekSaturday(weekStartDate)),
    filename: weekFilename(weekStart),
  }
}
