/* ===============================
   FINAL: js/visualizations.js
   Fix: Vis 1 now matches Vis 2–4 sizing by:
   - Embedding ALL charts into "#visX .vis-inner"
   - Forcing consistent width = 1200
   - Using a single clean DOMContentLoaded flow
   =============================== */

const dataUrl = "data/videogames_wide.csv"; // CSV path (used by all charts)

/* Embed options (keep simple + consistent) */
const embedOptions = {
  actions: false,     // Hide action buttons
  renderer: "canvas"  // Good performance + consistent
};

/* Show readable errors on the page (inside the inner wrapper) */
function showError(targetSelector, err) {
  const el = document.querySelector(targetSelector);
  if (el) {
    el.innerHTML = `
      <div style="padding:12px;border:1px solid #f5c2c7;background:#f8d7da;border-radius:10px;color:#842029;">
        <strong>Chart failed to load</strong><br/>
        <code style="white-space:pre-wrap;">${String(err)}</code>
      </div>
    `;
  }
  console.error(err);
}

/* Helper: always render inside the inner wrapper so the wide container stays intact */
function innerTarget(visId) {
  // Your HTML structure: <div id="visX" class="vis-box-wide"><div class="vis-inner">...</div></div>
  const sel = `#${visId} .vis-inner`;
  return document.querySelector(sel) ? sel : `#${visId}`; // fallback if inner wrapper not found
}

/* Force consistent size AFTER embed (prevents Vis 1 from shrinking) */
function forceSize(result, width = 1200, height = null) {
  try {
    result.view.width(width);
    if (height != null) result.view.height(height);
    result.view.resize();
    result.view.run();
  } catch (e) {
    console.warn("Could not force chart size:", e);
  }
}

document.addEventListener("DOMContentLoaded", async () => {

  /* -------------------------------
     VIS 1 — Global Sales by Genre and Platform
     (Now wide like Vis 2–4)
     ------------------------------- */
  const spec1 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },

    width: 1200,                 // match wide charts
    height: 520,                 // fills the 620px container nicely
    autosize: { type: "none" },  // ensures width/height are respected

    mark: { type: "bar" },
    encoding: {
      x: { field: "Genre", type: "nominal", title: "Genre", sort: "-y" },
      y: {
        aggregate: "sum",
        field: "Global_Sales",
        type: "quantitative",
        title: "Total Global Sales"
      },
      color: { field: "Platform", type: "nominal", title: "Platform" },
      tooltip: [
        { field: "Genre", type: "nominal" },
        { field: "Platform", type: "nominal" },
        { aggregate: "sum", field: "Global_Sales", type: "quantitative", format: ".2f", title: "Global Sales" }
      ]
    }
  };

  /* -------------------------------
     VIS 2 — Sales Over Time by Platform and Genre
     (Your logic preserved; only width behavior stabilized)
     ------------------------------- */
  const spec2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },

    width: 1200,                 // enforce wide
     height: 520,
    autosize: { type: "none" },  // prevent auto shrinking

    params: [
      {
        name: "pickGenre",
        value: "Action",
        bind: {
          input: "select",
          options: [
            "Action","Sports","Shooter","Role-Playing","Platform","Racing","Misc",
            "Fighting","Simulation","Puzzle","Adventure","Strategy"
          ],
          name: "Choose Genre: "
        }
      }
    ],

    transform: [
      { filter: "datum.Year != null && datum.Year != 'N/A'" },
      { calculate: "toNumber(datum.Year)", as: "YearNum" },
      { filter: "datum.Genre === pickGenre" },
      {
        aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }],
        groupby: ["YearNum", "Platform"]
      }
    ],

    layer: [
      {
        params: [
          {
            name: "platformPick",
            select: { type: "point", fields: ["Platform"], toggle: false },
            bind: "legend",
            clear: "dblclick"
          },
          {
            name: "hoverPoint",
            select: { type: "point", fields: ["Platform"], nearest: true, on: "mouseover", clear: "mouseout" }
          },
          { name: "zoomPan", select: { type: "interval", bind: "scales" } }
        ],
        mark: { type: "line", strokeWidth: 2 },
        encoding: {
          x: { field: "YearNum", type: "quantitative", title: "Year" },
          y: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales" },
          color: { field: "Platform", type: "nominal", title: "Platform" },
          opacity: { condition: { param: "platformPick", value: 1 }, value: 0.12 }
        }
      },
      {
        mark: { type: "point", filled: true, size: 70 },
        encoding: {
          x: { field: "YearNum", type: "quantitative" },
          y: { field: "Total_Global_Sales", type: "quantitative" },
          color: { field: "Platform", type: "nominal" },
          opacity: { condition: { param: "hoverPoint", value: 1 }, value: 0 },
          tooltip: [
            { field: "Platform", type: "nominal" },
            { field: "YearNum", type: "quantitative", title: "Year" },
            { field: "Total_Global_Sales", type: "quantitative", format: ".2f" }
          ]
        }
      }
    ]
  };

  /* -------------------------------
     VIS 3 — Regional Sales vs Platform
     ------------------------------- */
  const spec3 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },

    width: 1200,
    height: 560,
    autosize: { type: "none" },

    params: [
      {
        name: "regionPick",
        select: { type: "point", fields: ["Region"], toggle: false },
        bind: "legend",
        clear: "dblclick"
      }
    ],

    transform: [
      { fold: ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"], as: ["Region", "Sales"] },
      { aggregate: [{ op: "sum", field: "Sales", as: "Total_Sales" }], groupby: ["Platform", "Region"] }
    ],

    mark: "bar",
    encoding: {
      y: { field: "Platform", type: "nominal", sort: "-x", title: "Platform" },
      x: { field: "Total_Sales", type: "quantitative", title: "Total Sales" },
      color: { field: "Region", type: "nominal", title: "Region" },
      opacity: { condition: { param: "regionPick", value: 1 }, value: 0.25 },
      tooltip: [
        { field: "Platform", type: "nominal" },
        { field: "Region", type: "nominal" },
        { field: "Total_Sales", type: "quantitative", format: ".2f" }
      ]
    }
  };

  /* -------------------------------
     VIS 4 — Japan Share vs Global Sales
     ------------------------------- */
  const spec4 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },

    width: 1200,
    height: 460,
    autosize: { type: "none" },

    params: [
      { name: "brush", select: { type: "interval" } },
      { name: "zoomPan", select: { type: "interval", bind: "scales" } }
    ],

    transform: [
      { calculate: "datum.Global_Sales > 0 ? datum.JP_Sales / datum.Global_Sales : null", as: "JP_Share" },
      { filter: "isValid(datum.JP_Share)" },
      { filter: "datum.Global_Sales >= 0.5" }
    ],

    mark: { type: "circle", opacity: 0.75, size: 70 },
    encoding: {
      x: { field: "Global_Sales", type: "quantitative", title: "Global Sales" },
      y: {
        field: "JP_Share",
        type: "quantitative",
        title: "Japan Share (JP / Global)",
        scale: { domain: [0, 1] }
      },
      color: { field: "Genre", type: "nominal", title: "Genre" },
      opacity: { condition: { param: "brush", value: 1 }, value: 0.15 },
      tooltip: [
        { field: "Name", type: "nominal" },
        { field: "Platform", type: "nominal" },
        { field: "Genre", type: "nominal" },
        { field: "Publisher", type: "nominal" },
        { field: "Global_Sales", type: "quantitative", format: ".2f" },
        { field: "JP_Share", type: "quantitative", format: ".0%" }
      ]
    }
  };

  /* -------------------------------
     Render charts (ALL to .vis-inner)
     ------------------------------- */
  try {
    const r1 = await vegaEmbed(innerTarget("vis1"), spec1, embedOptions);
    forceSize(r1, 1200, 520);
  } catch (e) {
    showError(innerTarget("vis1"), e);
  }

  try {
    const r2 = await vegaEmbed(innerTarget("vis2"), spec2, embedOptions);
    forceSize(r2, 1200); // height managed by spec/layers; keep stable width
  } catch (e) {
    showError(innerTarget("vis2"), e);
  }

  try {
    const r3 = await vegaEmbed(innerTarget("vis3"), spec3, embedOptions);
    forceSize(r3, 1200, 560);
  } catch (e) {
    showError(innerTarget("vis3"), e);
  }

  try {
    const r4 = await vegaEmbed(innerTarget("vis4"), spec4, embedOptions);
    forceSize(r4, 1200, 460);
  } catch (e) {
    showError(innerTarget("vis4"), e);
  }
});
