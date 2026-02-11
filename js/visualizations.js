/* ===============================
   FINAL: js/visualizations.js
   - Reliable embedding into #visX .vis-inner
   - Shows errors inside each chart container
   - Easy Vis 1 (bar chart by Genre)
   =============================== */

const dataUrl = "data/videogames_wide.csv"; // ✅ Make sure this file exists at this path

const embedOptions = {
  actions: false,
  renderer: "canvas"
};

// Use inner wrapper if present (matches your HTML structure)
function target(visId) {
  const inner = document.querySelector(`#${visId} .vis-inner`);
  return inner ? `#${visId} .vis-inner` : `#${visId}`;
}

function showError(visId, err) {
  const el = document.querySelector(target(visId)) || document.querySelector(`#${visId}`);
  if (el) {
    el.innerHTML = `
      <div style="padding:12px;border:1px solid #f5c2c7;background:#f8d7da;border-radius:10px;color:#842029;">
        <strong>Chart failed to load</strong><br/>
        <code style="white-space:pre-wrap;">${String(err)}</code>
      </div>
    `;
  }
  console.error(`[${visId}]`, err);
}

document.addEventListener("DOMContentLoaded", async () => {
  // If Vega libraries didn’t load, show a clear message
  if (typeof vegaEmbed !== "function") {
    ["vis1", "vis2", "vis3", "vis4"].forEach(id =>
      showError(id, "vegaEmbed is not available. Check Vega/Vega-Lite/Vega-Embed script tags in HTML.")
    );
    return;
  }

  /* =========================
     VIS 1 (EASY): Total Global Sales by Genre
     ========================= */
  const spec1 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: 1200,
    height: 520,
    autosize: { type: "none" },

    transform: [
      { aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }], groupby: ["Genre"] }
    ],

    mark: { type: "bar" },
    encoding: {
      x: { field: "Genre", type: "nominal", title: "Genre", sort: "-y", axis: { labelAngle: 0 } },
      y: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales (Millions)" },
      tooltip: [
        { field: "Genre", type: "nominal", title: "Genre" },
        { field: "Total_Global_Sales", type: "quantitative", title: "Global Sales", format: ".2f" }
      ],
      color: { value: "#2563eb" }
    }
  };

  /* =========================
     VIS 2: Sales Over Time (by Platform) with Genre dropdown + legend highlight + zoom
     ========================= */
  const spec2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: 1200,
    height: 420,
    autosize: { type: "none" },

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
          { name: "platformPick", select: { type: "point", fields: ["Platform"], toggle: false }, bind: "legend", clear: "dblclick" },
          { name: "zoomPan", select: { type: "interval", bind: "scales" } }
        ],
        mark: { type: "line", strokeWidth: 2 },
        encoding: {
          x: { field: "YearNum", type: "quantitative", title: "Year" },
          y: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales" },
          color: { field: "Platform", type: "nominal", title: "Platform" },
          opacity: { condition: { param: "platformPick", value: 1 }, value: 0.12 }
        }
      }
    ]
  };

  /* =========================
     VIS 3: Regional Sales vs Platform (stacked bars)
     ========================= */
  const spec3 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: 1200,
    height: 560,
    autosize: { type: "none" },

    transform: [
      { fold: ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"], as: ["Region", "Sales"] },
      { aggregate: [{ op: "sum", field: "Sales", as: "Total_Sales" }], groupby: ["Platform", "Region"] }
    ],

    mark: "bar",
    encoding: {
      y: { field: "Platform", type: "nominal", title: "Platform", sort: "-x" },
      x: { field: "Total_Sales", type: "quantitative", title: "Total Sales (Millions)" },
      color: { field: "Region", type: "nominal", title: "Region" },
      tooltip: [
        { field: "Platform", type: "nominal" },
        { field: "Region", type: "nominal" },
        { field: "Total_Sales", type: "quantitative", format: ".2f" }
      ]
    }
  };

  /* =========================
     VIS 4: Japan Share vs Global Sales (scatter + brush + zoom)
     ========================= */
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
      x: { field: "Global_Sales", type: "quantitative", title: "Global Sales (Millions)" },
      y: { field: "JP_Share", type: "quantitative", title: "Japan Share (JP/Global)", scale: { domain: [0, 1] } },
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

  // Render each chart safely (so one failure doesn’t block others)
  try { await vegaEmbed(target("vis1"), spec1, embedOptions); } catch (e) { showError("vis1", e); }
  try { await vegaEmbed(target("vis2"), spec2, embedOptions); } catch (e) { showError("vis2", e); }
  try { await vegaEmbed(target("vis3"), spec3, embedOptions); } catch (e) { showError("vis3", e); }
  try { await vegaEmbed(target("vis4"), spec4, embedOptions); } catch (e) { showError("vis4", e); }
});
