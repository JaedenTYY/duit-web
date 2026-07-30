import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const generatedRoot = path.resolve('src/api/generated')

async function normalizeDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true })

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        await normalizeDirectory(entryPath)
        return
      }
      if (!entry.isFile() || path.extname(entry.name) !== '.ts') {
        return
      }

      const content = await readFile(entryPath, 'utf8')
      const normalized = `${content.trimEnd()}\n`
      if (content !== normalized) {
        await writeFile(entryPath, normalized, 'utf8')
      }
    }),
  )
}

await normalizeDirectory(generatedRoot)
