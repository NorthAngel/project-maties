export const THEMES = ['system', 'light', 'dark'];

export function normalizeTheme(value) {
  return THEMES.includes(value) ? value : 'system';
}

export function resolveTheme(value = 'system', prefersDark = false) {
  const theme = normalizeTheme(value);
  return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
}

export function systemPrefersDark(view = globalThis.window) {
  try { return Boolean(view?.matchMedia?.('(prefers-color-scheme: dark)').matches); } catch { return false; }
}

export function applyTheme(value = 'system', root = document.documentElement, view = globalThis.window) {
  const choice = normalizeTheme(value);
  const resolved = resolveTheme(choice, systemPrefersDark(view));
  root.dataset.themeChoice = choice;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  return resolved;
}

export function watchSystemTheme(callback, view = globalThis.window) {
  const query = view?.matchMedia?.('(prefers-color-scheme: dark)');
  if (!query?.addEventListener) return () => {};
  const listener = () => callback(Boolean(query.matches));
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
