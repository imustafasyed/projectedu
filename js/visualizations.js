/* ===============================
   FINAL: js/visualizations.js
   Assignment-ready (clear axes + legends + purpose)
   Dataset: data/videogames_wide.csv
   =============================== */

const dataUrl = "data/videogames_wide.csv"; // <-- keep this exact path

const embedOptions = {
  actions: false,
  renderer: "canvas"
};

// Embed into the inner wrapper if present (matches your HTML structure)
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
  if (typeof vegaEmbed !== "function") {
    ["vis1", "vis2", "vis3", "vis4"].forEach(id =>
      showError(id, "vegaEmbed is not available. Check Vega/Vega-Lite/Vega-Embed script tags.")
    );
    return;
  }

  /* =========================================================
     VIS 1 (CLEAR + EASY)
     What it demonstrates:
     - Which genres sell the most overall
     - Which regions contribute to those genre totals
     Interaction:
     - Click a region in the legend to highlight it (dblclick clears)
     ========================================================= */
  const spec1 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "Global Sales by Genre (Stacked by Region)", subtitle: "Shows which genres sell most and where those sales come from" },
    data: { url: dataUrl },

    width: 1200,
    height: 520,
    autosize: { type: "none" },

    transform: [
      { fold: ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"], as: ["Region", "Sales"] },
      { aggregate: [{ op: "sum", field: "Sales", as: "Total_Sales" }], groupby: ["Genre", "Region"] }
    ],

    params: [
      {
        name: "regionPick",
        select: { type: "point", fields: ["Region"], toggle: false },
        bind: "legend",
        clear: "dblclick"
      }
    ],

    mark: { type: "bar" },

    encoding: {
      x: {
        field: "Genre",
        type: "nominal",
        title: "Game Genre",
        sort: "-y",
        axis: { labelAngle: 0 }
      },
      y: {
        field: "Total_Sales",
        type: "quantitative",
        title: "Total Sales (Millions)",
        stack: "zero"
      },
      color: {
        field: "Region",
        type: "nominal",
        title: "Sales Region (Legend: click to highlight)"
      },
      opacity: {
        condition: { param: "regionPick", value: 1 },
        value: 0.25
      },
      tooltip: [
        { field: "Genre", type: "nominal", title: "Genre" },
        { field: "Region", type: "nominal", title: "Region" },
        { field: "Total_Sales", type: "quantitative", title: "Sales (M)", format: ".2f" }
      ]
    },

    config: {
      axis: { labelFontSize: 12, titleFontSize: 13, titlePadding: 8 },
      legend: { titleFontSize: 13, labelFontSize: 12 }
    }
  };

  /* =========================================================
     VIS 2 (CLEAR TREND VIEW)
     What it demonstrates:
     - How sales change over time for platforms within a selected genre
     Interaction:
     - Genre dropdown
     - Click a platform in legend to highlight it (dblclick clears)
     - Zoom/pan enabled
     ========================================================= */
  const spec2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "Sales Over Time by Platform (Filtered by Genre)", subtitle: "Pick a genre, then compare platform trends over years" },
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
            "Action", "Sports", "Shooter", "Role-Playing", "Platform", "Racing", "Misc",
            "Fighting", "Simulation", "Puzzle", "Adventure", "Strategy"
          ],
          name: "Genre: "
        }
      }
    ],

    transform: [
      { filter: "datum.Year != null && datum.Year != 'N/A'" },
      { calculate: "toNumber(datum.Year)", as: "YearNum" },
      { filter: "datum.Genre === pickGenre" },
      { aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }], groupby: ["YearNum", "Platform"] }
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
          { name: "zoomPan", select: { type: "interval", bind: "scales" } }
        ],
        mark: { type: "line", strokeWidth: 2 },
        encoding: {
          x: { field: "YearNum", type: "quantitative", title: "Release Year" },
          y: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales (Millions)" },
          color: { field: "Platform", type: "nominal", title: "Platform (Legend: click to highlight)" },
          opacity: { condition: { param: "platformPick", value: 1 }, value: 0.12 },
          tooltip: [
            { field: "Platform", type: "nominal" },
            { field: "YearNum", type: "quantitative", title: "Year" },
            { field: "Total_Global_Sales", type: "quantitative", title: "Sales (M)", format: ".2f" }
          ]
        }
      }
    ],

    config: {
      axis: { labelFontSize: 12, titleFontSize: 13, titlePadding: 8 },
      legend: { titleFontSize: 13, labelFontSize: 12 }
    }
  };

  /* =========================================================
     VIS 3 (CLEAR REGION vs PLATFORM VIEW)
     What it demonstrates:
     - Top platforms by total sales
     - How each region contributes per platform (stacked)
     Interaction:
     - Click region in legend to highlight it (dblclick clears)
     ========================================================= */
  const spec3 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "Top Platforms by Total Sales (Stacked by Region)", subtitle: "Compare regional sales contribution across the highest-selling platforms" },
    data: { url: dataUrl },

    width: 1200,
    height: 560,
    autosize: { type: "none" },

    transform: [
      { fold: ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"], as: ["Region", "Sales"] },
      { aggregate: [{ op: "sum", field: "Sales", as: "Total_Sales" }], groupby: ["Platform", "Region"] },

      // rank platforms by total sales (across regions)
      {
        joinaggregate: [{ op: "sum", field: "Total_Sales", as: "Platform_Total" }],
        groupby: ["Platform"]
      },
      { window: [{ op: "rank", as: "Platform_Rank" }], sort: [{ field: "Platform_Total", order: "descending" }] },
      { filter: "datum.Platform_Rank <= 15" } // show top 15 platforms for readability
    ],

    params: [
      {
        name: "regionPick3",
        select: { type: "point", fields: ["Region"], toggle: false },
        bind: "legend",
        clear: "dblclick"
      }
    ],

    mark: "bar",

    encoding: {
      y: {
        field: "Platform",
        type: "nominal",
        title: "Platform (Top 15)",
        sort: { field: "Platform_Total", order: "descending" }
      },
      x: {
        field: "Total_Sales",
        type: "quantitative",
        title: "Total Sales (Millions)",
        stack: "zero"
      },
      color: {
        field: "Region",
        type: "nominal",
        title: "Region (Legend: click to highlight)"
      },
      opacity: { condition: { param: "regionPick3", value: 1 }, value: 0.25 },
      tooltip: [
        { field: "Platform", type: "nominal" },
        { field: "Region", type: "nominal" },
        { field: "Total_Sales", type: "quantitative", title: "Sales (M)", format: ".2f" },
        { field: "Platform_Total", type: "quantitative", title: "Platform Total (M)", format: ".2f" }
      ]
    },

    config: {
      axis: { labelFontSize: 12, titleFontSize: 13, titlePadding: 8 },
      legend: { titleFontSize: 13, labelFontSize: 12 }
    }
  };

  /* =========================================================
     VIS 4 (CLEAR STORY VIEW)
     What it demonstrates:
     - Relationship between overall global success and Japan market share
     Interaction:
     - Brush select points
     - Zoom/pan
     ========================================================= */
  const spec4 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "Japan Share vs Global Sales", subtitle: "Do globally successful games also perform strongly in Japan?" },
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

    mark: { type: "circle", size: 70, opacity: 0.8 },

    encoding: {
      x: { field: "Global_Sales", type: "quantitative", title: "Global Sales (Millions)" },
      y: {
        field: "JP_Share",
        type: "quantitative",
        title: "Japan Share (JP Sales / Global Sales)",
        axis: { format: ".0%" },
        scale: { domain: [0, 1] }
      },
      color: { field: "Genre", type: "nominal", title: "Genre" },
      opacity: { condition: { param: "brush", value: 1 }, value: 0.15 },
      tooltip: [
        { field: "Name", type: "nominal", title: "Game" },
        { field: "Platform", type: "nominal" },
        { field: "Genre", type: "nominal" },
        { field: "Publisher", type: "nominal" },
        { field: "Global_Sales", type: "quantitative", title: "Global Sales (M)", format: ".2f" },
        { field: "JP_Share", type: "quantitative", title: "Japan Share", format: ".0%" }
      ]
    },

    config: {
      axis: { labelFontSize: 12, titleFontSize: 13, titlePadding: 8 },
      legend: { titleFontSize: 13, labelFontSize: 12 }
    }
  };

  // Render all charts safely
  try { await vegaEmbed(target("vis1"), spec1, embedOptions); } catch (e) { showError("vis1", e); }
  try { await vegaEmbed(target("vis2"), spec2, embedOptions); } catch (e) { showError("vis2", e); }
  try { await vegaEmbed(target("vis3"), spec3, embedOptions); } catch (e) { showError("vis3", e); }
  try { await vegaEmbed(target("vis4"), spec4, embedOptions); } catch (e) { showError("vis4", e); }
});
