// lifted from https://acerola.gg/colors.html
// accompanying video: https://youtu.be/fv-wlo8yVhk?si=OXdFctDREaR1m7M9

const rgaussn = () => Math.min(1, Math.abs(randomGaussian(1, 8)))

function PaletteSettings (COLOR_COUNT) {
  return {
    hueBase: Math.random(),
    hueContrast: rgaussn(),
    saturationBase: rgaussn(),
    saturationContrast: rgaussn(),
    luminanceBase: Math.random(),
    luminanceContrast: Math.random(),
    fixed: Math.random(),
    saturationConstant: true,
    colorCount: COLOR_COUNT,
  }
}

function oklch_to_oklab(L, c, h) {
  return [L, c * Math.cos(h), c * Math.sin(h)]
}

function oklab_to_linear_srgb(L, a, b) {
  let l_ = L + 0.3963377774 * a + 0.2158037573 * b
  let m_ = L - 0.1055613458 * a - 0.0638541728 * b
  let s_ = L - 0.0894841775 * a - 1.291485548 * b

  let l = l_ * l_ * l_
  let m = m_ * m_ * m_
  let s = s_ * s_ * s_

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

function generateOKLCH(HUE_MODE, settings) {
  let oklchColors = []

  let hueBase = settings.hueBase * 2 * Math.PI
  let hueContrast = lerp(0.33, 1.0, settings.hueContrast)

  let chromaBase = lerp(0.01, 0.1, settings.saturationBase)
  let chromaContrast = lerp(
    0.075,
    0.125 - chromaBase,
    settings.saturationContrast
  )

  let lightnessBase = lerp(0.3, 0.6, settings.luminanceBase)
  let lightnessContrast = lerp(
    0.3,
    1.0 - lightnessBase,
    settings.luminanceContrast
  )
  let lightnessFixed = lerp(0.6, 0.9, settings.fixed)

  let chromaConstant = settings.saturationConstant
  let lightnessConstant = !chromaConstant

  if (HUE_MODE == "monochromatic") {
    chromaConstant = false
    lightnessConstant = false
  }

  for (let i = 0; i < settings.colorCount; ++i) {
    let linearIterator = i / (settings.colorCount - 1)

    let hueOffset = linearIterator * hueContrast * 2 * Math.PI + Math.PI / 4

    if (HUE_MODE == "monochromatic") hueOffset *= 0.0
    if (HUE_MODE == "analagous") hueOffset *= 0.25
    if (HUE_MODE == "complementary") hueOffset *= 0.33
    if (HUE_MODE == "triadic complementary") hueOffset *= 0.66
    if (HUE_MODE == "tetradic complementary") hueOffset *= 0.75

    if (HUE_MODE != "monochromatic") hueOffset += (Math.random() * 2 - 1) * 0.01

    let chroma = chromaBase + linearIterator * chromaContrast
    let lightness = lightnessBase + linearIterator * lightnessContrast

    if (chromaConstant) chroma = chromaBase
    if (lightnessConstant) lightness = lightnessFixed

    let lab = oklch_to_oklab(lightness, chroma, hueBase + hueOffset)
    let rgb = oklab_to_linear_srgb(lab[0], lab[1], lab[2])

    rgb[0] = Math.round(Math.max(0.0, Math.min(rgb[0], 1.0)) * 255)
    rgb[1] = Math.round(Math.max(0.0, Math.min(rgb[1], 1.0)) * 255)
    rgb[2] = Math.round(Math.max(0.0, Math.min(rgb[2], 1.0)) * 255)

    oklchColors.push(rgb)
  }

  return oklchColors
}
