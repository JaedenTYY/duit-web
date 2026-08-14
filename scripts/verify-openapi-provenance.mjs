import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.env.DUIT_OPENAPI_CONTRACT_ROOT ?? process.cwd()
const openApiPath = resolve(root, 'openapi.json')
const provenancePath = resolve(root, 'openapi.provenance.json')
const packageLockPath = resolve(root, 'package-lock.json')

const provenance = readJson(provenancePath)
const actualOpenApiSha256 = createHash('sha256')
  .update(readFileSync(openApiPath))
  .digest('hex')

const failures = []

if (!/^[0-9a-f]{40}$/.test(provenance.backendCommit ?? '')) {
  failures.push('backendCommit must be a 40-character lowercase git SHA')
}

if (!/^[0-9a-f]{64}$/.test(provenance.openApiSha256 ?? '')) {
  failures.push('openApiSha256 must be a 64-character lowercase SHA-256 digest')
} else if (provenance.openApiSha256 !== actualOpenApiSha256) {
  failures.push(
    `openapi.json SHA-256 mismatch: expected ${provenance.openApiSha256}, got ${actualOpenApiSha256}`,
  )
}

if (provenance.generator !== 'orval') {
  failures.push(`generator must be "orval", got ${JSON.stringify(provenance.generator)}`)
}

const packageLock = readJson(packageLockPath)
const lockedOrvalVersion = packageLock.packages?.['node_modules/orval']?.version
if (!lockedOrvalVersion) {
  failures.push('package-lock.json does not contain node_modules/orval')
} else if (provenance.generatorVersion !== lockedOrvalVersion) {
  failures.push(
    `orval version mismatch: expected ${provenance.generatorVersion}, locked ${lockedOrvalVersion}`,
  )
}

if (failures.length > 0) {
  process.stderr.write('OpenAPI provenance verification failed:\n')
  for (const failure of failures) {
    process.stderr.write(`- ${failure}\n`)
  }
  process.exit(1)
}

process.stdout.write(
  `OpenAPI provenance verified: backend ${provenance.backendCommit}, SHA-256 ${actualOpenApiSha256}, orval ${lockedOrvalVersion}\n`,
)

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}
