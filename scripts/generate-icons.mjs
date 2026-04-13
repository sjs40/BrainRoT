import { mkdir, mkdtemp, readFile, rm, writeFile, copyFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const execFileAsync = promisify(execFile)
const root = process.cwd()
const sizes = [16, 32, 64, 128, 256, 512, 1024]

const files = {
  lightSvg: join(root, 'branding', 'source', 'app-icon-light.svg'),
  darkSvg: join(root, 'branding', 'source', 'app-icon-dark.svg'),
  lightPngDir: join(root, 'branding', 'png', 'light'),
  darkPngDir: join(root, 'branding', 'png', 'dark'),
  appDir: join(root, 'branding', 'app'),
  ico: join(root, 'branding', 'app', 'app-icon.ico'),
  icns: join(root, 'branding', 'app', 'app-icon.icns'),
}

await Promise.all([
  mkdir(files.lightPngDir, { recursive: true }),
  mkdir(files.darkPngDir, { recursive: true }),
  mkdir(files.appDir, { recursive: true }),
])

const lightBuffers = await renderPngSet(files.lightSvg, files.lightPngDir)
await renderPngSet(files.darkSvg, files.darkPngDir)

await writeIco(lightBuffers)
await writeIcnsIfPossible()
await writeReadme()

async function renderPngSet(svgPath, outDir) {
  const svg = await readFile(svgPath)
  const buffers = []

  for (const size of sizes) {
    const buffer = await sharp(svg)
      .resize(size, size)
      .png()
      .toBuffer()
    await writeFile(join(outDir, `icon-${size}.png`), buffer)
    buffers.push(buffer)
  }

  return buffers
}

async function writeIco(buffers) {
  // NSIS (Windows installer) rejects ICO entries > 256px (PNG-compressed).
  // Limit to the first 5 sizes: 16, 32, 64, 128, 256.
  const ico = await pngToIco(buffers.slice(0, 5))
  await writeFile(files.ico, ico)
}

async function writeIcnsIfPossible() {
  if (process.platform !== 'darwin') {
    return
  }

  const iconutil = await hasIconutil()
  if (!iconutil) {
    return
  }

  const tempDir = await mkdtemp(join(tmpdir(), 'brainrot-iconset-'))
  const iconsetDir = join(tempDir, 'app.iconset')
  await mkdir(iconsetDir, { recursive: true })

  const map = [
    ['icon_16x16.png', 16],
    ['icon_16x16@2x.png', 32],
    ['icon_32x32.png', 32],
    ['icon_32x32@2x.png', 64],
    ['icon_128x128.png', 128],
    ['icon_128x128@2x.png', 256],
    ['icon_256x256.png', 256],
    ['icon_256x256@2x.png', 512],
    ['icon_512x512.png', 512],
    ['icon_512x512@2x.png', 1024],
  ]

  for (const [name, size] of map) {
    await copyFile(join(files.lightPngDir, `icon-${size}.png`), join(iconsetDir, name))
  }

  await execFileAsync('iconutil', ['-c', 'icns', iconsetDir, '-o', files.icns])
  await rm(tempDir, { recursive: true, force: true })
}

async function hasIconutil() {
  try {
    await execFileAsync('iconutil', ['--help'])
    return true
  } catch {
    return false
  }
}

async function writeReadme() {
  const content = `# Icon Pipeline

Run:

\`\`\`bash
npm run icons:generate
\`\`\`

Outputs:
- PNG exports in \`branding/png/light\`
- PNG exports in \`branding/png/dark\`
- Windows \`.ico\` in \`branding/app/app-icon.ico\`
- macOS \`.icns\` in \`branding/app/app-icon.icns\` when run on macOS with \`iconutil\` available

Requirements:
- Node dependencies: \`sharp\`, \`png-to-ico\`
- For automatic \`.icns\` generation: macOS and Apple \`iconutil\`

Notes:
- PNG and ICO generation are cross-platform.
- ICNS generation is skipped automatically when \`iconutil\` is unavailable.
- Source artwork lives in \`branding/source\`.
`
  await writeFile(join(files.appDir, 'icon-pipeline.md'), content)
}
