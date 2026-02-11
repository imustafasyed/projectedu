/* ========================================= */
/* FINAL: js/visualizations.js (One file)    */
/* All charts match the same width behavior  */
/* as Visualization 1 using width:"container"*/
/* ========================================= */

const dataUrl = "data/videogames_wide.csv"; // Path to your CSV on GitHub Pages //

const embedOptions = { // Vega-Embed options //
  actions: false, // Hide Vega action buttons //
  renderer: "svg" // Crisp rendering (good for portfolio sites) //
};

function showError(targetId, err) { // Show chart errors directly on the page //
  const el = document.querySelector(targetId); // Find the chart container //
  if (el) { // If it exists //
    el.innerHTML = `
      <div style="color:#b00020;font-weight:700;">Chart failed to load</div>
      <pre style="white-space:pre-wrap;">${String(err)}</pre>
    `; // Display error message //
  }
  console.error(err); // Also log error in browser console //
}

window.addEventListener("load", async () => { // Run after page + libraries load //

  /* ========================= */
  /* Visualization 1 (Heatmap) */
  /* ========================= */
  const spec1 = { // Chart 1 spec //
    $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite schema //
    data: { url: dataUrl }, // Load CSV //
    width: "container", // Match container width (same as your Vis 1 behavior) //
    height: 420, // Height similar to your current Vis 1 //
    autosize: { type: "fit", contains: "padding" }, // Fit inside card nicely //
    transform: [ // Prepare data //
      { aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }], groupby: ["Genre", "Platform"] } // Sum sales by Genre+Platform //
    ], // End transform //
    mark: "rect", // Heatmap blocks //
    encoding: { // Encodings //
      x: { field: "Platform", type: "nominal", title: "Platform", axis: { labelAngle: -40 } }, // Platform axis //
      y: { field: "Genre", type: "nominal", title: "Genre" }, // Genre axis //
      color: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales", scale: { scheme: "blues" } }, // Color scale //
      tooltip: [ // Hover tooltip //
        { field: "Genre", type: "nominal" }, // Genre //
        { field: "Platform", type: "nominal" }, // Platform //
        { field: "Total_Global_Sales", type: "quantitative", format: ".2f" } // Total sales //
      ] // End tooltip //
    } // End encoding //
  }; // End spec1 //

  /* ========================================= */
  /* Visualization 2 (Line: Genre dropdown +   */
  /* single-select legend + hover + zoom/pan)  */
  /* FIX: selection params are inside ONE layer */
  /* to avoid duplicate signal errors in layers */
  /* ========================================= */
  const spec2 = { // Chart 2 spec //
    $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite schema //
    data: { url: dataUrl }, // Load CSV //
    width: "container", // Match Vis 1 width behavior exactly //
    height: 420, // Comfortable height //
    autosize: { type: "fit", contains: "padding" }, // Fit inside container //
    params: [ // Top-level params (ONLY the dropdown here) //
      { // Dropdown param //
        name: "pickGenre", // Variable name //
        value: "Action", // Default value //
        bind: { // Dropdown UI //
          input: "select", // Make dropdown //
          options: ["Action","Sports","Shooter","Role-Playing","Platform","Racing","Misc","Fighting","Simulation","Puzzle","Adventure","Strategy"], // Allowed genres //
          name: "Choose Genre: " // Label //
        } // End bind //
      } // End dropdown //
    ], // End params //
    transform: [ // Clean and aggregate //
      { filter: "datum.Year != null && datum.Year != 'N/A'" }, // Remove missing year //
      { calculate: "toNumber(datum.Year)", as: "YearNum" }, // Convert year to number //
      { filter: "datum.Genre === pickGenre" }, // Filter by selected genre //
      { aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }], groupby: ["YearNum","Platform"] } // Sum by Year+Platform //
    ], // End transform //
    layer: [ // Layer chart (line + points) //
      { // Layer 1: line (THIS layer owns the selections to avoid duplicates) //
        params: [ // Selections live only here to avoid duplicate signal name errors in layered charts [1](https://forum.enterprisedna.co/t/deneb-pan-and-zoom-layer-with-2-chart/36742)[2](https://collegedouglas-my.sharepoint.com/personal/syedm5_douglascollege_ca/Documents/Microsoft%20Copilot%20Chat%20Files/style.css) //
          { // Single-select platform by legend //
            name: "platformPick", // Selection name //
            select: { type: "point", fields: ["Platform"], toggle: false }, // Single-select only //
            bind: "legend", // Click legend to select //
            clear: "dblclick" // Double-click anywhere to reset //
          }, // End platformPick //
          { // Hover tooltip nearest point //
            name: "hoverPoint", // Hover selection name //
            select: { type: "point", fields: ["Platform"], nearest: true, on: "mouseover", clear: "mouseout" } // Nearest hover //
          }, // End hoverPoint //
          { // Zoom and pan //
            name: "zoomPan", // Zoom selection name //
            select: { type: "interval", bind: "scales" } // Drag to zoom/pan //
          } // End zoomPan //
        ], // End params in layer 1 //
        mark: { type: "line", strokeWidth: 2 }, // Line marks //
        encoding: { // Line encodings //
          x: { field: "YearNum", type: "quantitative", title: "Year" }, // X axis //
          y: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales" }, // Y axis //
          color: { field: "Platform", type: "nominal", title: "Platform" }, // Color by platform //
          opacity: { condition: { param: "platformPick", value: 1 }, value: 0.12 } // Fade unselected //
        } // End encoding //
      }, // End layer 1 //
      { // Layer 2: points for hover tooltips //
        mark: { type: "point", filled: true, size: 70 }, // Point marks //
        encoding: { // Point encodings //
          x: { field: "YearNum", type: "quantitative" }, // Same X //
          y: { field: "Total_Global_Sales", type: "quantitative" }, // Same Y //
          color: { field: "Platform", type: "nominal" }, // Same color //
          opacity: { condition: { param: "hoverPoint", value: 1 }, value: 0 }, // Only show on hover //
          tooltip: [ // Tooltip details //
            { field: "Platform", type: "nominal" }, // Platform //
            { field: "YearNum", type: "quantitative", title: "Year" }, // Year //
            { field: "Total_Global_Sales", type: "quantitative", format: ".2f" } // Sales //
          ] // End tooltip //
        } // End encoding //
      } // End layer 2 //
    ] // End layer //
  }; // End spec2 //

  /* ========================================== */
  /* Visualization 3 (Stacked bars: Region vs   */
  /* Platform + single-select legend + hover)   */
  /* ========================================== */
  const spec3 = { // Chart 3 spec //
    $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite schema //
    data: { url: dataUrl }, // Load CSV //
    width: "container", // Match Vis 1 width behavior exactly //
    height: 560, // Taller due to many platforms //
    autosize: { type: "fit", contains: "padding" }, // Fit inside container //
    params: [ // Interactivity //
      { // Single-select region by legend //
        name: "regionPick", // Selection name //
        select: { type: "point", fields: ["Region"], toggle: false }, // Single select //
        bind: "legend", // Legend click //
        clear: "dblclick" // Reset on double-click //
      }, // End regionPick //
      { // Hover highlight //
        name: "hoverSeg", // Hover selection //
        select: { type: "point", fields: ["Platform","Region"], on: "mouseover", clear: "mouseout" } // Hover segment //
      } // End hoverSeg //
    ], // End params //
    transform: [ // Convert wide to long //
      { fold: ["NA_Sales","EU_Sales","JP_Sales","Other_Sales"], as: ["Region","Sales"] }, // Fold regions //
      { aggregate: [{ op: "sum", field: "Sales", as: "Total_Sales" }], groupby: ["Platform","Region"] } // Sum totals //
    ], // End transform //
    mark: "bar", // Bar mark //
    encoding: { // Encodings //
      y: { field: "Platform", type: "nominal", title: "Platform", sort: "-x" }, // Platforms listed //
      x: { field: "Total_Sales", type: "quantitative", title: "Total Sales" }, // Total sales //
      color: { field: "Region", type: "nominal", title: "Region" }, // Stack by region //
      opacity: { condition: { param: "regionPick", value: 1 }, value: 0.25 }, // Fade other regions //
      stroke: { condition: { param: "hoverSeg", value: "#111" }, value: null }, // Outline on hover //
      strokeWidth: { condition: { param: "hoverSeg", value: 1.5 }, value: 0 }, // Thicker outline on hover //
      tooltip: [ // Tooltip //
        { field: "Platform", type: "nominal" }, // Platform //
        { field: "Region", type: "nominal" }, // Region //
        { field: "Total_Sales", type: "quantitative", format: ".2f" } // Sales //
      ] // End tooltip //
    } // End encoding //
  }; // End spec3 //

  /* ============================================= */
  /* Visualization 4 (Scatter: JP share story +     */
  /* brush selection + zoom/pan + hover tooltip)    */
  /* ============================================= */
  const spec4 = { // Chart 4 spec //
    $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite schema //
    data: { url: dataUrl }, // Load CSV //
    width: "container", // Match Vis 1 width behavior exactly //
    height: 460, // Good scatter height //
    autosize: { type: "fit", contains: "padding" }, // Fit inside container //
    params: [ // Interactivity //
      { name: "brush", select: { type: "interval" } }, // Brush selection //
      { name: "zoomPan", select: { type: "interval", bind: "scales" } } // Zoom/pan //
    ], // End params //
    transform: [ // Compute JP share //
      { calculate: "datum.Global_Sales > 0 ? datum.JP_Sales / datum.Global_Sales : null", as: "JP_Share" }, // JP share //
      { filter: "isValid(datum.JP_Share)" }, // Keep valid //
      { filter: "datum.Global_Sales >= 0.5" } // Reduce noise //
    ], // End transform //
    mark: { type: "circle", opacity: 0.75, size: 70 }, // Circle marks //
    encoding: { // Encodings //
      x: { field: "Global_Sales", type: "quantitative", title: "Global Sales" }, // X axis //
      y: { field: "JP_Share", type: "quantitative", title: "Japan Share (JP / Global)", scale: { domain: [0, 1] } }, // Y axis //
      color: { field: "Genre", type: "nominal", title: "Genre" }, // Color by genre //
      opacity: { condition: { param: "brush", value: 1 }, value: 0.15 }, // Brush highlight //
      tooltip: [ // Tooltip //
        { field: "Name", type: "nominal" }, // Game //
        { field: "Platform", type: "nominal" }, // Platform //
        { field: "Genre", type: "nominal" }, // Genre //
        { field: "Publisher", type: "nominal" }, // Publisher //
        { field: "Global_Sales", type: "quantitative", format: ".2f" }, // Global //
        { field: "JP_Share", type: "quantitative", format: ".0%" } // JP share %
      ] // End tooltip //
    } // End encoding //
  }; // End spec4 //

  /* ========================= */
  /* Render all charts safely  */
  /* ========================= */
  try { await vegaEmbed("#vis1", spec1, embedOptions); } catch (e) { showError("#vis1", e); } // Render Vis1 //
  try { await vegaEmbed("#vis2", spec2, embedOptions); } catch (e) { showError("#vis2", e); } // Render Vis2 //
  try { await vegaEmbed("#vis3", spec3, embedOptions); } catch (e) { showError("#vis3", e); } // Render Vis3 //
  try { await vegaEmbed("#vis4", spec4, embedOptions); } catch (e) { showError("#vis4", e); } // Render Vis4 //

}); // End window load //
