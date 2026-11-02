// Hook do electron-builder: ajusta a cópia empacotada da biblioteca (nunca os arquivos do
// repositório). Os emuladores salvam a posição da janela, e uma posição num segundo monitor
// faria o emulador abrir fora da tela num PC com um monitor só.
const fs = require('node:fs')
const path = require('node:path')

/** Arquivo de configuração → ajustes aplicados na cópia empacotada. */
const FIXES = {
  // snes9x: "Window:Left = -955   # ..." → 0, mantendo o alinhamento das colunas
  'snes9x.conf': (text) =>
    text.replace(/(Window:(?:Left|Top)\s*=\s*)(-?\d+)/g, (_, prefix, value) => prefix + '0'.padEnd(value.length)),
  // Kega Fusion: posição gravada como os 4 bytes de um inteiro
  'fusion.ini': (text) => text.replace(/^(DWindow[XY]Pos=).*$/gm, '$10,0,0,0'),
  // mGBA: "windowPos=@Point(-1210 266)"
  'qt.ini': (text) => text.replace(/^(windowPos=@Point\().*\)/gm, '$10 0)')
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

exports.default = async function afterPack({ appOutDir }) {
  const emulators = path.join(appOutDir, 'resources', 'plataforma', 'emulador')
  if (!fs.existsSync(emulators)) return

  for (const file of walk(emulators)) {
    const fix = FIXES[path.basename(file).toLowerCase()]
    if (!fix) continue
    const original = fs.readFileSync(file, 'latin1')
    const fixed = fix(original)
    if (fixed !== original) {
      fs.writeFileSync(file, fixed, 'latin1')
      console.log(`  • posição da janela zerada em ${path.relative(appOutDir, file)}`)
    }
  }
}
