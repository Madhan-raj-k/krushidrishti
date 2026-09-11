# KrushiDrishti

On-device crop leaf checks for farmers, an officer outbreak queue, and a Maharashtra operations board — built as a static web app so inference can stay on the phone.

**Live demo:** [krushidrishti.vercel.app](https://krushidrishti.vercel.app)

> Demo GIF of the farmer leaf-check flow is tracked in [#1](https://github.com/Madhan-raj-k/krushidrishti/issues/1) (`docs/demo.gif` once added).

## What it does

| Surface | Path | Purpose |
| --- | --- | --- |
| **Farmer** | `/` (also `farmer/`) | Capture or upload a leaf photo, run the model on-device, get advisory (English + Marathi) |
| **Officer queue** | `officer/` | Review reports sent from the farmer flow |
| **Map / board** | `dashboard/` | Maharashtra operations view |

Privacy note: the leaf photo is meant to stay on the device; the model runs in the browser (TensorFlow.js + bundled model assets).

## Quick start

This repo is static HTML/CSS/JS (no `package.json`). From the repo root:

```bash
npx --yes serve .
```

Or:

```bash
python3 -m http.server 8080
```

Then open the printed local URL. Model and weight files are large — first load can take a moment.

## Project layout

```
index.html          Farmer leaf-check UI (default)
farmer/             Farmer entry
officer/            Officer queue UI
dashboard/          Operations / map UI
app.js              Farmer inference + advisory flow
officer.js          Queue logic
dashboard.js        Board logic
shared.js           Shared helpers
weather.js          Field conditions / spray window strip
advice.json         Advisory copy
labels.txt          Model labels
model.json / *.tflite / weights.bin   On-device model assets
style.css           Shared styles
```

## Tech stack

- Vanilla HTML, CSS, JavaScript
- [TensorFlow.js](https://www.tensorflow.org/js) (CDN) for in-browser inference
- Bundled TFLite / weight assets for on-device checks
- Deployable to any static host (currently [Vercel](https://krushidrishti.vercel.app))

## Demo readiness checklist

- [x] Public repo
- [x] Live demo URL
- [ ] README (this PR)
- [ ] Short demo GIF — [#1](https://github.com/Madhan-raj-k/krushidrishti/issues/1)
- [x] Open-source license — [#2](https://github.com/Madhan-raj-k/krushidrishti/issues/2)

## License

MIT — see [`LICENSE`](LICENSE).
