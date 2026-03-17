export default {
  root: process.cwd(),
  port: 5787,
  host: '0.0.0.0',
  allowedExtensions: ['.md', '.markdown'],
  theme: {
    default: 'system',
  },
  editor: {
    autosave: true,
    debounceMs: 300,
  },
}