function colorStr(color) {
  const str = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
  return str
}

function rgaussn() {
  return Math.min(1, Math.abs(randomGaussian(1, 8)))
}

class PaletteSettings {
  constructor(hueMode, colorCount) {
    this.hueMode = hueMode
    this.hueBase = Math.random()
    this.hueContrast = Math.random()
    this.saturationBase = Math.random()
    this.saturationContrast = Math.random()
    this.luminanceBase = Math.random()
    this.luminanceContrast = Math.random()
    this.fixed = Math.random()
    this.saturationConstant = true
    this.colorCount = colorCount
  }

  randomize() {
    this.hueBase = Math.random()
    this.hueContrast = Math.random()
    this.saturationBase = Math.random()
    this.saturationContrast = Math.random()
    this.luminanceBase = Math.random()
    this.luminanceContrast = Math.random()
    this.fixed = Math.random()
  }
}

const State = {
  div: 0,
  palette: [],
  paletteSettings: new PaletteSettings(
    "tetradic complementary", 21
  ),
  lines: [],
  cyber: false,
  blur: false,
  lineHopProbability: 1.4,

  init() {
    this.div = parseInt(random(7, 21))
    this.lines = new Array(parseInt(random(5, 13)))
    this.regenPalette(false)

    for (let i = 0, n = this.lines.length; i < n; i++) {
      this.lines[i] = makeLineOps(
        new Line(
          i,
          Math.abs(randomGaussian(n * n * 4) / Math.pow(i + 1, 2)),
          absIntMod(randomGaussian(height / 2, 90), height)
        )
      )
    }
  },

  draw () {
    push()
    background(State.palette[0])
    let n = State.lines.length
    for (let i = 0; i < n; i++) {
      State.lines[i].draw(State, i, n)
    }
    pop()
  },

  regenLines(draw=true) {
    for (let line of this.lines) {
      makeLineOps(line)
    }
    draw && this.draw()
  },

  regenPalette(draw=true) {
    this.paletteSettings.colorCount = this.lines.length + 1
    this.paletteSettings.randomize()
    this.refreshPalette(draw)
  },

  applyPaletteCSS() {
    const style = document.querySelector(":root").style
    style.setProperty("--body-bg-color", colorStr(this.palette[0]))
    style.setProperty(
      "--body-fg-color",
      colorStr(this.palette[this.palette.length - 1])
    )
    style.setProperty(
      "--btn-border-color",
      colorStr(this.palette[this.palette.length - 2])
    )
    style.setProperty(
      "--btn-fg-color",
      colorStr(this.palette[this.palette.length - 1])
    )
    style.setProperty("--btn-bg-color", colorStr(this.palette[2]))
  },

  refreshPalette(draw=true) {
    this.palette = generateOKLCH(this.paletteSettings)
    this.applyPaletteCSS()
    draw && this.draw()
  },
}

class Line {
  constructor(color, stroke, y) {
    this.color = color
    this.stroke = stroke
    this.y = y
    this.diverge_sign = sign(randomGaussian())
    this.reset()
  }
  reset() {
    this.ops = []
    this.hop_probability = State.lineHopProbability
  }
  draw(State, i, n) {
    push()
    if (State.blur) {
      let bf = (n * 3) / (i + 1) - 2
      if (bf > 1) drawingContext.filter = `blur(${bf}px)`
    }
    noFill()
    strokeWeight(this.stroke + 4)
    stroke(State.palette[0])
    beginShape()
    for (let [op, ...args] of this.ops) {
      op(...args)
    }
    endShape()
    strokeWeight(this.stroke)
    stroke(State.palette[this.color + 1])
    beginShape()
    for (let [op, ...args] of this.ops) {
      op(...args)
    }
    endShape()
    pop()
  }
  toString() {
    return `Line(${this.color}, ${this.y}, ${this.x1}, ${this.x2})`
  }
}

function sign(value) {
  const s = Math.sign(value)
  if (s === 0) return 1
  if (s === -0) return -1
  return s
}

function absIntMod(value, mod) {
  return Math.abs(parseInt(value)) % mod
}

function rr(max) {
  return randomGaussian(max / State.div, 5)
}

function straightX(x, y, line, fix = null) {
  let _x = fix == null ? x + Math.abs(rr(width)) : fix
  _x = Math.min(_x, width)
  line.ops.push([vertex, _x, y])
  return [_x, y]
}

function hop45Y(x, y, line) {
  let r = Math.abs(rr(height))
  let x1 = x + r
  let y1 = y + r * line.diverge_sign
  line.diverge_sign = -line.diverge_sign
  line.ops.push([vertex, x1, y1])
  return [x1, y1]
}

function hopBezierY(x, y, line) {
  // using and inverting line.diverge_sign makes the lines return to their base
  // instead of wandering off
  let r = Math.abs(rr(height))
  let x1 = x + r
  let y1 = y + r * line.diverge_sign
  let x2 = x1 + r
  let y2 = y1 + r * line.diverge_sign
  line.diverge_sign = -line.diverge_sign
  line.ops.push([quadraticVertex, x1, y, x1, y1])
  line.ops.push([quadraticVertex, x1, y2, x2, y2])
  return [x2, y2]
}

function lineHopSwitch(x, y, line) {
  const r = randomGaussian()
  if (r < -line.hop_probability || r > line.hop_probability) {
    // increasing the probability makes the lines look less like a series of
    // stairs
    line.hop_probability *= line.hop_probability
    return State.cyber ? hop45Y(x, y, line) : hopBezierY(x, y, line)
  }
  return straightX(x, y, line)
}

function makeLineOps(line) {
  let x = 0
  let y = line.y
  line.reset()
  line.ops.push([vertex, x, y])
  while (x < width) {
    const [nx, ny] = lineHopSwitch(x, y, line)
    x = nx
    y = ny
  }
  if (x < width) {
    line.ops.push([vertex, width, y])
  }
  return line
}

function setup() {
  createCanvas(windowWidth, windowHeight)
  State.init()
  noLoop()
}

function draw() {
  State.draw()
}

function mouseClicked(event) {
  if (event.target == canvas) {
    State.init()
    State.draw()
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
}
