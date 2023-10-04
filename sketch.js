const State = {
  div: 0,
  palette: [],
  lines: [],
  shearX: 0,
  hueMode: "tetradic complementary",
  cyber: false,
  lineHopProbability: 1.4,

  regenLines () {
    for (let line of this.lines) {
      makeLineOps(line)
    }
  }
}

class Line {
  constructor(color, stroke, y) {
    this.color = color
    this.stroke = stroke
    this.y = y
    this.diverge_sign = sign(randomGaussian())
    this.reset()
    // shearX per line looks interesting
    // shearY doesn't look good at all
    // this.shearX = PI / (randomGaussian(1, 4) * 8)
    // this.shearY = PI / (randomGaussian(1, 4) * 8)
  }
  reset () {
    this.ops = []
    this.hop_probability = State.lineHopProbability
  }
  toString () {
    return `Line(${this.color}, ${this.y}, ${this.x1}, ${this.x2})`
  }
}

function sign (value) {
  const s = Math.sign(value)
  if (s === 0) return 1
  if (s === -0) return -1
  return s
}

function absIntMod (value, mod) {
  return Math.abs(parseInt(value)) % mod
}

function numericComp(a, b) { return a - b }

function rr (max) {
  return randomGaussian(max / State.div, 5)
}

function straightX (x, y, line, fix = null) {
  let _x = fix == null ? x + Math.abs(rr(width)) : fix
  _x = Math.min(_x, width)
  line.ops.push(
    [vertex, _x, y]
  )
  return [_x, y]
}

function hop45Y (x, y, line) {
  let r = Math.abs(rr(height))
  let x1 = x + r
  let y1 = y + r * line.diverge_sign
  line.diverge_sign = -line.diverge_sign
  line.ops.push(
    [vertex, x1, y1]
  )
  return [x1, y1]
}

function hopBezierY (x, y, line) {
  // using and inverting line.diverge_sign makes the lines return to their base
  // instead of wandering off
  let r = Math.abs(rr(height))
  let x1 = x + r
  let y1 = y + r * line.diverge_sign
  let x2 = x1 + r
  let y2 = y1 + r * line.diverge_sign
  line.diverge_sign = -line.diverge_sign
  line.ops.push(
    [quadraticVertex, x1, y, x1, y1]
  )
  line.ops.push(
    [quadraticVertex, x1, y2, x2, y2]
  )
  return [x2, y2]
}

function lineHopSwitch (x, y, line) {
  const r = randomGaussian()
  if (r < -line.hop_probability || r > line.hop_probability) {
    // increasing the probability makes the lines look less like a series of
    // stairs
    line.hop_probability *= line.hop_probability
    return State.cyber ? hop45Y(x, y, line) : hopBezierY(x, y, line)
  }
  return straightX(x, y, line)
}

function makeLineOps (line) {
  let x = 0
  let y = line.y
  line.reset()
  line.ops.push(
    [vertex, x, y]
  )
  while (x < width) {
    const [nx, ny] = lineHopSwitch(x, y, line)
    x = nx
    y = ny
  }
  if (x < width) {
    line.ops.push(
      [vertex, width, y]
    )
  }
  return line
}

function initState () {
  State.div = parseInt(random(7, 21))
  State.lines = new Array(parseInt(random(5, 13)))
  State.shearX = PI / (randomGaussian(1, 4) * 8)
  State.paletteSettings = PaletteSettings(State.lines.length + 1)
  State.palette = generateOKLCH(State.hueMode, State.paletteSettings)

  for (let i = 0, n = State.lines.length; i < n; i++) {
    State.lines[i] = makeLineOps(
      new Line(
        i,
        Math.abs(randomGaussian(n * n * 4) / Math.pow(i + 1, 2)),
        absIntMod(randomGaussian(height / 2, 90), height)
      )
    )
  }
}

function setup () {
  createCanvas(1024, 768)
  initState()
  initDOM()
}

function draw () {
  background(State.palette[0])
  let j = 0;
  for (let l of State.lines) {
    push()
    noFill()
    strokeWeight(l.stroke + 4)
    stroke(State.palette[0])
    beginShape()
    for (let [op, ...args] of l.ops) {
      op(...args)
    }
    endShape()
    strokeWeight(l.stroke)
    stroke(State.palette[l.color + 1])
    beginShape()
    for (let [op, ...args] of l.ops) {
      op(...args)
    }
    endShape()
    pop()
  }
}

function mouseClicked (event) {
  if (event.target == canvas) {
    initState()
  }
}

function initDOM () {
  let sel = document.querySelector("#palette-mode")
  sel.value = State.hueMode
  sel.addEventListener("change", (event) => {
    State.hueMode = event.target.value
    State.palette = generateOKLCH(State.hueMode, State.paletteSettings)
  })
  document.querySelector("#palette-regen").addEventListener("click", () => {
    State.paletteSettings = PaletteSettings(State.lines.length + 1)
    State.palette = generateOKLCH(State.hueMode, State.paletteSettings)
  })
  let paletteSaturationBase = document.querySelector("#palette-saturation-base")
  paletteSaturationBase.value = State.paletteSettings.saturationBase
  paletteSaturationBase.addEventListener("input", (event) => {
    State.paletteSettings.saturationBase = parseFloat(event.target.value)
    State.palette = generateOKLCH(State.hueMode, State.paletteSettings)
  })
  let paletteHueContrast = document.querySelector("#palette-hue-contrast")
  paletteHueContrast.value = State.paletteSettings.hueContrast
  paletteHueContrast.addEventListener("input", (event) => {
    State.paletteSettings.hueContrast = parseFloat(event.target.value)
    State.palette = generateOKLCH(State.hueMode, State.paletteSettings)
  })
  let cyberToggle = document.querySelector("#cyber-toggle")
  cyberToggle.checked = State.cyber
  cyberToggle.addEventListener("click", (event) => {
    State.cyber = event.target.checked
    State.regenLines()
  })
  let linesRegen = document.querySelector("#lines-regen")
  linesRegen.addEventListener("click", () => {
    State.regenLines()
  })
  let hopProbability = document.querySelector("#line-hop-probability")
  hopProbability.value = -State.lineHopProbability
  hopProbability.addEventListener("input", (event) => {
    State.lineHopProbability = Math.abs(parseFloat(event.target.value))
    State.regenLines()
  })
}
