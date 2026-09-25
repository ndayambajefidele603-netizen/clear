export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function getStudentDefaultPassword(student) {
  const idDigits = String(student?.id || '').replace(/\D/g, '')
  const emailPart = normalizeEmail(student?.email || '').split('@')[0] || 'student'
  const fallback = `${emailPart.replace(/[^a-z]/gi, '').slice(0, 6) || 'student'}2026`
  const digits = idDigits.length >= 4 ? idDigits.slice(-6) : fallback.replace(/\D/g, '').slice(0, 6) || '202606'
  return `UR@${digits}`
}

export function getLeaderDefaultPassword(leader) {
  const name = String(leader?.name || '').split(' ').map(part => part.charAt(0)).join('').toUpperCase()
  return name ? `${name}123` : 'LEADER123'
}
