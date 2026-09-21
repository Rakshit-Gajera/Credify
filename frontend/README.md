# CrediGuard — Frontend

React + Vite single-page app for the loan default prediction project. It talks to the
Flask backend in `../backend` over REST and renders the 3D visualisations with Three.js.

## Running it

Start the backend first (it owns the model and the dataset):

```bash
cd backend && python app.py
```

Then the frontend:

```bash
cd frontend && npm install && npm run dev
```

The app opens on <http://localhost:5173> and expects the API on
<http://127.0.0.1:5000>. That address lives in one place — `src/lib/api.js` — change
`API_BASE` there if the backend moves.

The navbar shows a live **API connected / API offline** pill, so it is obvious during a
demo whether Flask is actually running.

## Pages

| Route | What it shows |
| --- | --- |
| `/` | Landing page with the animated hero scene and headline dataset figures |
| `/predict` | 16-field applicant form, 3D risk gauge, affordability preview, demo profiles |
| `/insights` | Dataset KPIs, class balance donut, draggable 3D loan-amount histogram, sample rows |
| `/model` | Interactive 3D diagram of the backend pipeline, model card, feature dictionary, API reference |
| `/history` | Every logged prediction, with filtering, search, expandable detail and CSV export |

## Layout

```
src/
  lib/
    api.js           API base URL + one function per endpoint
    three-stage.js   Shared Three.js lifecycle: renderer, lights, env map, RAF loop, cleanup
  components/
    HeroScene.jsx      Landing-page scene
    RiskOrb.jsx        Prediction result gauge
    BarChart3D.jsx     Draggable histogram
    PipelineScene.jsx  Clickable backend-pipeline diagram
    DonutChart.jsx     SVG class-balance chart
    Navbar.jsx  Reveal.jsx  Icons.jsx
  pages/
    Home.jsx  Predict.jsx  Insights.jsx  Model.jsx  History.jsx
  styles/global.css   Design tokens and every component style
```

Each 3D component describes only its own contents; `three-stage.js` handles renderer
setup, resizing, pausing scenes that scroll out of view, and disposing GPU resources on
unmount.

## Scripts

```bash
npm run dev      # dev server with hot reload
npm run build    # production bundle into dist/
npm run preview  # serve the built bundle
npm run lint     # oxlint
```
