/* =============================== */
/*  FINAL: js/visualizations.js    */
/* =============================== */

const dataUrl = "data/videogames_wide.csv"; // CSV path //

const embedOptions = { // Embed options //
  actions: false, // Hide action buttons //
  renderer: "svg" // Crisp charts //
};

function showError(targetId, err) { // Show readable errors on the page //
  const el = document.querySelector(targetId); // Find container //
  if (el) { // If it exists //
    el.innerHTML = `<div style="color:#b00020;font-weight:700;">Chart failed to load</div>
                    <pre style="white-space:pre-wrap;">${String(err)}</pre>`; // Print error //
  }
  console.error(err); // Also log error //
}

window.addEventListener("load", async () => { // Run after page is fully loaded //

  /* ---------------- VIS 1 ---------------- */
  const spec1 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: "container",
    height: 420,
    autosize: { type: "fit", contains: "padding" },
    transform: [
      { aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }], groupby: ["Genre", "Platform"] }
    ],
    mark: "rect",
    encoding: {
      x: { field: "Platform", type: "nominal", axis: { labelAngle: -40 }, title: "Platform" },
      y: { field: "Genre", type: "nominal", title: "Genre" },
      color: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales", scale: { scheme: "blues" } },
      tooltip: [
        { field: "Genre", type: "nominal" },
        { field: "Platform", type: "nominal" },
        { field: "Total_Global_Sales", type: "quantitative", format: ".2f" }
      ]
    }
  };

  /* ---------------- VIS 2 (FIXED: selection params live in ONE layer) ---------------- */
  const spec2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: 1200, // Always 1200px as you requested //
    height: 420,

    params: [ // Only NON-selection param at top level //
      {
        name: "pickGenre",
        value: "Action",
        bind: {
          input: "select",
          options: ["Action","Sports","Shooter","Role-Playing","Platform","Racing","Misc","Fighting","Simulation","Puzzle","Adventure","Strategy"],
          name: "Choose Genre: "
        }
      }
    ],

    transform: [
      { filter: "datum.Year != null && datum.Year != 'N/A'" },
      { calculate: "toNumber(datum.Year)", as: "YearNum" },
      { filter: "datum.Genre === pickGenre" },
      { aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }], groupby: ["YearNum","Platform"] }
    ],

    layer: [
      {
        /* Put ALL selection params ONLY in this FIRST layer to avoid duplicate signal bugs. */
        params: [
          {
            name: "platformPick",
            select: { type: "point", fields: ["Platform"], toggle: false }, // Single-select //
            bind: "legend",
            clear: "dblclick"
          },
          {
            name: "hoverPoint",
            select: { type: "point", fields: ["Platform"], nearest: true, on: "mouseover", clear: "mouseout" }
          },
          {
            name: "zoomPan",
            select: { type: "interval", bind: "scales" } // Zoom/pan //
          }
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

  /* ---------------- VIS 3 ---------------- */
  const spec3 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: 1200, // Always 1200px //
    height: 560,
    params: [
      { name: "regionPick", select: { type: "point", fields: ["Region"], toggle: false }, bind: "legend", clear: "dblclick" }
    ],
    transform: [
      { fold: ["NA_Sales","EU_Sales","JP_Sales","Other_Sales"], as: ["Region","Sales"] },
      { aggregate: [{ op: "sum", field: "Sales", as: "Total_Sales" }], groupby: ["Platform","Region"] }
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

  /* ---------------- VIS 4 ---------------- */
  const spec4 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: 1200, // Always 1200px //
    height: 460,
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
      y: { field: "JP_Share", type: "quantitative", title: "Japan Share (JP / Global)", scale: { domain: [0, 1] } },
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

  /* Render charts with error display */
  try { await vegaEmbed("#vis1", spec1, embedOptions); } catch (e) { showError("#vis1", e); }
  try { await vegaEmbed("#vis2", spec2, embedOptions); } catch (e) { showError("#vis2", e); }
  try { await vegaEmbed("#vis3", spec3, embedOptions); } catch (e) { showError("#vis3", e); }
  try { await vegaEmbed("#vis4", spec4, embedOptions); } catch (e) { showError("#vis4", e); }

});
