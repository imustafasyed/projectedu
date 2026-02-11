/* =============================================== */
/* js/visualizations.js                            */
/* - Keeps your HTML exactly the same              */
/* - Adds mouse interactivity + smooth fade-in     */
/* - Ensures all charts have the same size         */
/* =============================================== */

const dataUrl = "data/videogames_wide.csv"; // Where your dataset lives on the website //

const embedOptions = { actions: false, renderer: "svg" }; // Hide Vega buttons + use crisp SVG rendering //

/* ---------- Small “fade-in” animation (no HTML changes needed) ---------- */
(function addFadeStyles() { // Create CSS once, automatically //
  const style = document.createElement("style"); // Create a <style> tag //
  style.innerHTML = ` 
    .vis-fade { opacity: 0; transition: opacity 700ms ease; }  /* Start invisible */
    .vis-fade.show { opacity: 1; }                            /* Fade to visible */
  `; // Add CSS rules //
  document.head.appendChild(style); // Attach styles to the page //
})(); // Run immediately //

function setLoadingState(selector) { // Adds fade class + loading text //
  const el = document.querySelector(selector); // Find the target div //
  if (!el) return; // Stop if not found //
  el.classList.add("vis-fade"); // Start hidden (for fade-in) //
  if (el.innerHTML.trim() === "") el.textContent = "Loading chart…"; // Add loading text if empty //
}

function showChart(selector) { // Makes chart fade in //
  const el = document.querySelector(selector); // Find target div //
  if (!el) return; // Stop if not found //
  requestAnimationFrame(() => { // Wait one frame so browser can apply initial opacity //
    el.classList.add("show"); // Trigger CSS transition //
  });
}

function showError(selector, error) { // Show readable error on the page //
  const el = document.querySelector(selector); // Find target div //
  if (!el) return; // Stop if not found //
  el.innerHTML = `<div style="color:#b00020;font-weight:700;">Chart failed to load</div>
                  <pre style="white-space:pre-wrap;">${String(error)}</pre>`; // Print error //
  el.classList.add("show"); // Ensure it becomes visible //
  console.error(error); // Log to browser console too //
}

/* ---------- Wait for page + Vega libraries to be ready ---------- */
window.addEventListener("load", async () => { // Run after page fully loads //

  /* Prepare loading state for each chart container */
  setLoadingState("#vis1"); // Prep Vis 1 //
  setLoadingState("#vis2"); // Prep Vis 2 //
  setLoadingState("#vis3"); // Prep Vis 3 //
  setLoadingState("#vis4"); // Prep Vis 4 //

  /* ============================================================ */
  /* VIS 1: Global Sales by Genre and Platform (Heatmap)           */
  /* - Mouse: hover tooltip + hover outline                         */
  /* - Size: same width behavior + fixed height                      */
  /* ============================================================ */
  const spec1 = { // Vega-Lite spec for Vis 1 //
    $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite version //
    data: { url: dataUrl }, // Load data from CSV //
    width: "container", // Match the container width (same behavior for all charts) //
    height: 420, // Same height as others for consistency //
    autosize: { type: "fit", contains: "padding" }, // Fit nicely inside the card //
    params: [ // Interactive parameters //
      { // Hover selection (highlights the hovered heatmap cell) //
        name: "hoverCell", // Name of hover selection //
        select: { type: "point", on: "mouseover", clear: "mouseout" } // Hover on/off //
      } // End hoverCell //
    ], // End params //
    transform: [ // Prep data //
      { // Sum global sales for each (Genre, Platform) //
        aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }], // Sum //
        groupby: ["Genre", "Platform"] // Group by these fields //
      } // End transform step //
    ], // End transform //
    mark: { type: "rect" }, // Heatmap squares //
    encoding: { // Map fields to visuals //
      x: { field: "Platform", type: "nominal", title: "Platform", axis: { labelAngle: -40 } }, // X axis //
      y: { field: "Genre", type: "nominal", title: "Genre" }, // Y axis //
      color: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales", scale: { scheme: "blues" } }, // Color scale //
      stroke: { condition: { param: "hoverCell", value: "#111" }, value: null }, // Outline on hover //
      strokeWidth: { condition: { param: "hoverCell", value: 1.5 }, value: 0 }, // Thicker outline on hover //
      tooltip: [ // Hover details //
        { field: "Genre", type: "nominal" }, // Genre //
        { field: "Platform", type: "nominal" }, // Platform //
        { field: "Total_Global_Sales", type: "quantitative", format: ".2f" } // Sales //
      ] // End tooltip //
    } // End encoding //
  }; // End spec1 //

  /* ============================================================ */
  /* VIS 2: Sales Over Time by Platform and Genre (Line)            */
  /* - Mouse: hover tooltip (nearest) + zoom/pan                     */
  /* - Click: SINGLE-select platform via legend                      */
  /* - IMPORTANT: selection params live in ONE layer (prevents       */
  /*   duplicate signal errors in layered specs).                     */
  /* ============================================================ */
  const spec2 = { // Vega-Lite spec for Vis 2 //
    $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite version //
    data: { url: dataUrl }, // Load CSV //
    width: "container", // Same width behavior as Vis 1 //
    height: 420, // Same height for consistency //
    autosize: { type: "fit", contains: "padding" }, // Fit inside card //
    params: [ // Only the dropdown at top-level //
      { // Genre dropdown //
        name: "pickGenre", // Dropdown param name //
        value: "Action", // Default value //
        bind: { // Dropdown UI //
          input: "select", // Select dropdown //
          options: ["Action","Sports","Shooter","Role-Playing","Platform","Racing","Misc","Fighting","Simulation","Puzzle","Adventure","Strategy"], // Options //
          name: "Choose Genre: " // Label //
        } // End bind //
      } // End dropdown //
    ], // End params //
    transform: [ // Clean + summarize data //
      { filter: "datum.Year != null && datum.Year != 'N/A'" }, // Remove missing years //
      { calculate: "toNumber(datum.Year)", as: "YearNum" }, // Convert Year to number //
      { filter: "datum.Genre === pickGenre" }, // Filter by selected genre //
      { aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }], groupby: ["YearNum","Platform"] } // Sum sales //
    ], // End transform //
    layer: [ // Layered chart: line + hover points //
      { // Layer 1: line (owns selections to avoid duplicate signal issues) //
        params: [ // Selection params ONLY here (prevents duplicate signal name bugs) //
          { // SINGLE-select platform (legend click) //
            name: "platformPick", // Name of selection //
            select: { type: "point", fields: ["Platform"], toggle: false }, // Single select only //
            bind: "legend", // Clicking legend selects platform //
            clear: "dblclick" // Double-click to reset //
          }, // End platformPick //
          { // Hover nearest point selection //
            name: "hoverPoint", // Name //
            select: { type: "point", fields: ["Platform"], nearest: true, on: "mouseover", clear: "mouseout" } // Nearest hover //
          }, // End hoverPoint //
          { // Zoom/pan selection //
            name: "zoomPan", // Name //
            select: { type: "interval", bind: "scales" } // Drag to zoom/pan //
          } // End zoomPan //
        ], // End params in layer 1 //
        mark: { type: "line", strokeWidth: 2 }, // Draw lines //
        encoding: { // Map line //
          x: { field: "YearNum", type: "quantitative", title: "Year" }, // X axis //
          y: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales" }, // Y axis //
          color: { field: "Platform", type: "nominal", title: "Platform" }, // Color by platform //
          opacity: { condition: { param: "platformPick", value: 1 }, value: 0.12 } // Fade unselected //
        } // End encoding //
      }, // End layer 1 //
      { // Layer 2: points only visible on hover (for clean tooltips) //
        mark: { type: "point", filled: true, size: 70 }, // Points //
        encoding: { // Map points //
          x: { field: "YearNum", type: "quantitative" }, // Same X //
          y: { field: "Total_Global_Sales", type: "quantitative" }, // Same Y //
          color: { field: "Platform", type: "nominal" }, // Same color //
          opacity: { condition: { param: "hoverPoint", value: 1 }, value: 0 }, // Show only when hovering //
          tooltip: [ // Tooltip details //
            { field: "Platform", type: "nominal" }, // Platform //
            { field: "YearNum", type: "quantitative", title: "Year" }, // Year //
            { field: "Total_Global_Sales", type: "quantitative", format: ".2f" } // Sales //
          ] // End tooltip //
        } // End encoding //
      } // End layer 2 //
    ] // End layer //
  }; // End spec2 //

  /* ============================================================ */
  /* VIS 3: Regional Sales vs Platform (Stacked Bars)               */
  /* - Mouse: hover tooltip + hover outline                          */
  /* - Click: SINGLE-select region via legend                         */
  /* - Size: same width behavior + fixed height                       */
  /* ============================================================ */
  const spec3 = { // Vega-Lite spec for Vis 3 //
    $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite version //
    data: { url: dataUrl }, // Load CSV //
    width: "container", // Same width behavior as Vis 1 //
    height: 420, // Same height for consistency //
    autosize: { type: "fit", contains: "padding" }, // Fit nicely //
    params: [ // Interactivity //
      { // Single-select region via legend //
        name: "regionPick", // Name //
        select: { type: "point", fields: ["Region"], toggle: false }, // Single select //
        bind: "legend", // Click legend //
        clear: "dblclick" // Double-click to reset //
      }, // End regionPick //
      { // Hover outline //
        name: "hoverSeg", // Name //
        select: { type: "point", fields: ["Platform","Region"], on: "mouseover", clear: "mouseout" } // Hover segment //
      } // End hoverSeg //
    ], // End params //
    transform: [ // Prepare data //
      { fold: ["NA_Sales","EU_Sales","JP_Sales","Other_Sales"], as: ["Region","Sales"] }, // Turn columns into rows //
      { aggregate: [{ op: "sum", field: "Sales", as: "Total_Sales" }], groupby: ["Platform","Region"] }, // Sum by platform+region //
      { // Keep chart readable within height 420: show only top 12 platforms by total //
        joinaggregate: [{ op: "sum", field: "Total_Sales", as: "Platform_Total" }], // Compute platform totals //
        groupby: ["Platform"] // Group by platform //
      }, // End joinaggregate //
      { window: [{ op: "rank", as: "platform_rank" }], sort: [{ field: "Platform_Total", order: "descending" }] }, // Rank platforms //
      { filter: "datum.platform_rank <= 12" } // Keep top 12 platforms //
    ], // End transform //
    mark: "bar", // Bar chart //
    encoding: { // Encodings //
      y: { field: "Platform", type: "nominal", title: "Platform", sort: "-x" }, // Platforms //
      x: { field: "Total_Sales", type: "quantitative", title: "Total Sales" }, // Sales //
      color: { field: "Region", type: "nominal", title: "Region" }, // Stack by region //
      opacity: { condition: { param: "regionPick", value: 1 }, value: 0.25 }, // Fade unselected regions //
      stroke: { condition: { param: "hoverSeg", value: "#111" }, value: null }, // Outline on hover //
      strokeWidth: { condition: { param: "hoverSeg", value: 1.5 }, value: 0 }, // Thicker outline on hover //
      tooltip: [ // Tooltip details //
        { field: "Platform", type: "nominal" }, // Platform //
        { field: "Region", type: "nominal" }, // Region //
        { field: "Total_Sales", type: "quantitative", format: ".2f" } // Sales //
      ] // End tooltip //
    } // End encoding //
  }; // End spec3 //

  /* ============================================================ */
  /* VIS 4: Visual Story (Scatter: JP Share vs Global Sales)        */
  /* - Mouse: hover tooltip                                          */
  /* - Interaction: brush selection + zoom/pan                        */
  /* - Size: same width behavior + fixed height                       */
  /* ============================================================ */
  const spec4 = { // Vega-Lite spec for Vis 4 //
    $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite version //
    data: { url: dataUrl }, // Load CSV //
    width: "container", // Same width behavior as Vis 1 //
    height: 420, // Same height for consistency //
    autosize: { type: "fit", contains: "padding" }, // Fit nicely //
    params: [ // Interactivity //
      { name: "brush", select: { type: "interval" } }, // Drag to select points //
      { name: "zoomPan", select: { type: "interval", bind: "scales" } }, // Zoom/pan by dragging //
      { // Hover highlight //
        name: "hoverDot",
        select: { type: "point", on: "mouseover", clear: "mouseout" }
      }
    ], // End params //
    transform: [ // Prepare data //
      { calculate: "datum.Global_Sales > 0 ? datum.JP_Sales / datum.Global_Sales : null", as: "JP_Share" }, // Compute JP share //
      { filter: "isValid(datum.JP_Share)" }, // Keep valid //
      { filter: "datum.Global_Sales >= 0.5" } // Reduce noise //
    ], // End transform //
    mark: { type: "circle", size: 70 }, // Points //
    encoding: { // Encodings //
      x: { field: "Global_Sales", type: "quantitative", title: "Global Sales" }, // X axis //
      y: { field: "JP_Share", type: "quantitative", title: "Japan Share (JP / Global)", scale: { domain: [0, 1] } }, // Y axis //
      color: { field: "Genre", type: "nominal", title: "Genre" }, // Color by genre //
      opacity: { condition: { param: "brush", value: 1 }, value: 0.15 }, // Brush highlights selected points //
      stroke: { condition: { param: "hoverDot", value: "#111" }, value: null }, // Outline on hover //
      strokeWidth: { condition: { param: "hoverDot", value: 1.5 }, value: 0 }, // Thicker outline on hover //
      tooltip: [ // Tooltip //
        { field: "Name", type: "nominal" }, // Game name //
        { field: "Platform", type: "nominal" }, // Platform //
        { field: "Genre", type: "nominal" }, // Genre //
        { field: "Publisher", type: "nominal" }, // Publisher //
        { field: "Global_Sales", type: "quantitative", format: ".2f" }, // Global sales //
        { field: "JP_Share", type: "quantitative", format: ".0%" } // JP share //
      ] // End tooltip //
    } // End encoding //
  }; // End spec4 //

  /* ---------- Render charts (with fade-in) ---------- */
  try { // Try rendering Vis 1 //
    await vegaEmbed("#vis1", spec1, embedOptions); // Render Vis 1 into #vis1 //
    showChart("#vis1"); // Fade in Vis 1 //
  } catch (e) { // If Vis 1 fails //
    showError("#vis1", e); // Show error //
  }

  try { // Try rendering Vis 2 //
    await vegaEmbed("#vis2", spec2, embedOptions); // Render Vis 2 into #vis2 //
    showChart("#vis2"); // Fade in Vis 2 //
  } catch (e) { // If Vis 2 fails //
    showError("#vis2", e); // Show error //
  }

  try { // Try rendering Vis 3 //
    await vegaEmbed("#vis3", spec3, embedOptions); // Render Vis 3 into #vis3 //
    showChart("#vis3"); // Fade in Vis 3 //
  } catch (e) { // If Vis 3 fails //
    showError("#vis3", e); // Show error //
  }

  try { // Try rendering Vis 4 //
    await vegaEmbed("#vis4", spec4, embedOptions); // Render Vis 4 into #vis4 //
    showChart("#vis4"); // Fade in Vis 4 //
  } catch (e) { // If Vis 4 fails //
    showError("#vis4", e); // Show error //
  }

}); // End load event //
