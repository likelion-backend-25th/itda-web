let loggedIn = true
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getLoggedIn() {
  return loggedIn
}

export function setLoggedIn(next: boolean) {
  if (loggedIn === next) return
  loggedIn = next
  emit()
}
