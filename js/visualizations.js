/* ===============================
   FINAL: js/visualizations.js (READY TO GO)
   Fixes:
   - Removes nested/duplicate event listeners
   - Defines spec1 properly (no "spec1 is not defined")
   - Embeds ALL charts into "#visX .vis-inner" to match your HTML
   - Forces consistent wide width (1200px) like your .vis-inner
   =============================== */

const dataUrl = "data/videogames_wide.csv"; // CSV path used by all charts

const embedOptions = {
  actions: false,     // hide action buttons
  renderer: "canvas"  // consistent rendering
};

// Find the correct embed target (inner wrapper if present, else fallback)
function target(visId) {
  const inner = document.querySelector(`#${visId} .vis-inner`);
  return inner ? `#${visId} .vis-inner` : `#${visId}`;
}

// Show readable errors inside the container (so you can debug easily)
function showError(visId, err) {
  const el = document.querySelector(target(visId));
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

document.addEventListener("DOMContentLoaded", async () => {


  /* ---------------------------
   VIS 1 — HEATMAP: Global Sales by Genre (X) and Platform (Y)
   Clickable legend: select a Sales Band (discrete bins) from the legend
   --------------------------- */
const spec1 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  data: { url: dataUrl },

  // 1) Aggregate global sales by Genre x Platform
  transform: [
    {
      aggregate: [
        { op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }
      ],
      groupby: ["Genre", "Platform"]
    },
    // 2) Bin the aggregated sales so the legend becomes discrete + clickable
    {
      bin: { maxbins: 7 },             // adjust bins if you want (e.g., 5 or 9)
      field: "Total_Global_Sales",
      as: ["Sales_Bin_Start", "Sales_Bin_End"]
    },
    // 3) Friendly label for legend
    {
      calculate: "format(datum.Sales_Bin_Start, '.2f') + ' – ' + format(datum.Sales_Bin_End, '.2f')",
      as: "Sales_Band"
    }
  ],

  width: 1200,
  height: 520,
  autosize: { type: "none" },

  // Clickable legend selection (single select)
  params: [
    {
      name: "bandPick",
      select: { type: "point", fields: ["Sales_Band"], toggle: false },
      bind: "legend",
      clear: "dblclick" // double click to clear selection
    }
  ],

  mark: { type: "rect" },

  encoding: {
    x: {
      field: "Genre",
      type: "nominal",
      title: "Genre",                 // ✅ X-axis label
      sort: "-color"
    },

    y: {
      field: "Platform",
      type: "nominal",
      title: "Platform"               // ✅ Y-axis label
    },

    // Color is DISCRETE (Sales_Band), so legend is clickable
    color: {
      field: "Sales_Band",
      type: "ordinal",
      title: "Global Sales (Binned)", // ✅ legend title
      scale: { scheme: "blues" }
    },

    // Highlight only the selected band via opacity
    opacity: {
      condition: { param: "bandPick", value: 1 },
      value: 0.25
    },

    tooltip: [
      { field: "Genre", type: "nominal", title: "Genre" },
      { field: "Platform", type: "nominal", title: "Platform" },
      { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales", format: ".2f" },
      { field: "Sales_Band", type: "ordinal", title: "Sales Band" }
    ]
  },

  // Optional: draw thin grid lines for readability
  config: {
    view: { stroke: "transparent" },
    axis: { labelFontSize: 12, titleFontSize: 13 }
  }
};
  /* ---------------------------
     VIS 2 — Sales Over Time by Platform and Genre
     (Single-select legend + hover + zoom/pan; genre dropdown)
     --------------------------- */
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
        // Put ALL selections only in this first layer (avoids duplicate signal bugs)
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

  /* ---------------------------
     VIS 3 — Regional Sales vs Platform
     --------------------------- */
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

  /* ---------------------------
     VIS 4 — Japan Share vs Global Sales
     --------------------------- */
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

  // ---------------------------
  // RENDER ALL 4 VIS
  // ---------------------------
  try { await vegaEmbed(target("vis1"), spec1, embedOptions); } catch (e) { showError("vis1", e); }
  try { await vegaEmbed(target("vis2"), spec2, embedOptions); } catch (e) { showError("vis2", e); }
  try { await vegaEmbed(target("vis3"), spec3, embedOptions); } catch (e) { showError("vis3", e); }
  try { await vegaEmbed(target("vis4"), spec4, embedOptions); } catch (e) { showError("vis4", e); }
});
