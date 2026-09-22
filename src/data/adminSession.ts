let admin = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribeAdmin(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAdmin() {
  return admin
}

export function setAdmin(next: boolean) {
  if (admin === next) return
  admin = next
  emit()
}
