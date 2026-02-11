/* =============================== */
/*  Mustafa - Vega-Lite Charts     */
/*  File: js/visualizations.js     */
/* =============================== */

/* ---------- 1) DATA PATH ---------- */
const dataUrl = "data/videogames_wide.csv"; // Path to your CSV file on GitHub Pages //

/* ---------- 2) EMBED OPTIONS ---------- */
const embedOptions = { actions: false }; // Hides the Vega action buttons (download/view source) //

/* ========================================================= */
/* Visualization 1: Global Sales by Genre and Platform (Heatmap) */
/* ========================================================= */

const spec1 = { // Vega-Lite spec starts for chart 1 //
  $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite schema version //
  description: "Global sales heatmap by genre and platform", // Short description //
  data: { url: dataUrl }, // Load dataset from dataUrl //
  width: "container", // Use available container width (responsive) //
  height: 420, // Chart height (you said Vis 1 is fine) //
  autosize: { type: "fit", contains: "padding" }, // Fit nicely inside the container //

  params: [ // Interactivity parameters //
    { // Hover highlight parameter //
      name: "hoverCell", // Name of hover selection //
      select: { type: "point", on: "mouseover", clear: "mouseout" } // Highlight cell on hover //
    } // End hoverCell //
  ], // End params //

  transform: [ // Data preparation steps //
    { // Aggregate step //
      aggregate: [ // We will sum values //
        { op: "sum", field: "Global_Sales", as: "Total_Global_Sales" } // Sum Global_Sales //
      ], // End aggregate list //
      groupby: ["Genre", "Platform"] // Group by Genre and Platform //
    } // End transform step //
  ], // End transform //

  mark: { type: "rect" }, // Heatmap rectangles //
  encoding: { // Chart mappings //
    x: { field: "Platform", type: "nominal", title: "Platform", axis: { labelAngle: -40 } }, // Platforms on x-axis //
    y: { field: "Genre", type: "nominal", title: "Genre" }, // Genres on y-axis //
    color: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales", scale: { scheme: "blues" } }, // Color intensity = sales //
    stroke: { condition: { param: "hoverCell", value: "#111" }, value: null }, // Outline cell on hover //
    strokeWidth: { condition: { param: "hoverCell", value: 1.5 }, value: 0 }, // Thicker outline on hover //
    tooltip: [ // Tooltip fields //
      { field: "Genre", type: "nominal" }, // Show genre //
      { field: "Platform", type: "nominal" }, // Show platform //
      { field: "Total_Global_Sales", type: "quantitative", format: ".2f" } // Show summed sales //
    ] // End tooltip //
  } // End encoding //
}; // End spec1 //

/* ========================================================= */
/* Visualization 2: Sales Over Time (Single-select + Hover + Zoom/Pan) */
/* ========================================================= */

const spec2 = { // Vega-Lite spec starts for chart 2 //
  $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite schema version //
  description: "Sales over time by platform, filtered by genre (single-select interactive)", // Description //
  data: { url: dataUrl }, // Load dataset //
  width: "container", // Fill container width (works great with your wide card layout) //
  height: 420, // Height for readability //
  autosize: { type: "fit", contains: "padding" }, // Fit inside container //

  params: [ // Interactivity controls //
    { // Genre dropdown parameter //
      name: "pickGenre", // Dropdown variable name //
      value: "Action", // Default selected genre //
      bind: { // Dropdown UI settings //
        input: "select", // Make it a dropdown //
        options: ["Action","Sports","Shooter","Role-Playing","Platform","Racing","Misc","Fighting","Simulation","Puzzle","Adventure","Strategy"], // Genre options //
        name: "Choose Genre: " // Label text //
      } // End bind //
    }, // End pickGenre //

    { // Platform selection (SINGLE-select via legend) //
      name: "platformPick", // Selection name //
      select: { type: "point", fields: ["Platform"], toggle: false }, // toggle:false = only one platform at a time //
      bind: "legend", // Clicking legend selects platform //
      clear: "dblclick" // Double-click anywhere clears selection //
    }, // End platformPick //

    { // Hover nearest point for tooltips //
      name: "hoverPoint", // Hover selection name //
      select: { type: "point", fields: ["Platform"], nearest: true, on: "mouseover", clear: "mouseout" } // Nearest point hover //
    }, // End hoverPoint //

    { // Zoom/pan interaction //
      name: "zoomPan", // Name of zoom selection //
      select: { type: "interval", bind: "scales" } // Drag to zoom, pan with axis drag //
    } // End zoomPan //
  ], // End params //

  transform: [ // Data cleaning //
    { filter: "datum.Year != null && datum.Year != 'N/A'" }, // Remove missing years //
    { calculate: "toNumber(datum.Year)", as: "YearNum" }, // Convert year to number //
    { filter: "datum.Genre === pickGenre" }, // Keep chosen genre only //
    { aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }], groupby: ["YearNum","Platform"] } // Sum sales by year+platform //
  ], // End transform //

  layer: [ // Layered chart for better interaction //
    { // Layer 1: Lines //
      mark: { type: "line", strokeWidth: 2 }, // Draw thicker lines //
      encoding: { // Line encodings //
        x: { field: "YearNum", type: "quantitative", title: "Year" }, // X = year //
        y: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales" }, // Y = sales //
        color: { field: "Platform", type: "nominal", title: "Platform" }, // Color by platform //
        opacity: { // Fade unselected platforms //
          condition: { param: "platformPick", value: 1 }, // Selected platform fully visible //
          value: 0.12 // Others faint //
        } // End opacity //
      } // End encoding //
    }, // End layer 1 //

    { // Layer 2: Hover points (only show when hovering) //
      mark: { type: "point", filled: true, size: 70 }, // Dots to support hovering //
      encoding: { // Point encodings //
        x: { field: "YearNum", type: "quantitative" }, // Same X //
        y: { field: "Total_Global_Sales", type: "quantitative" }, // Same Y //
        color: { field: "Platform", type: "nominal" }, // Same color //
        opacity: { condition: { param: "hoverPoint", value: 1 }, value: 0 }, // Show only when hovering //
        tooltip: [ // Tooltip info //
          { field: "Platform", type: "nominal" }, // Platform //
          { field: "YearNum", type: "quantitative", title: "Year" }, // Year //
          { field: "Total_Global_Sales", type: "quantitative", format: ".2f" } // Sales //
        ] // End tooltip //
      } // End encoding //
    } // End layer 2 //
  ] // End layer //
}; // End spec2 //

/* ========================================================= */
/* Visualization 3: Regional Sales vs Platform (Legend focus + Hover) */
/* ========================================================= */

const spec3 = { // Vega-Lite spec starts for chart 3 //
  $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite schema version //
  description: "Regional sales mix by platform (interactive)", // Description //
  data: { url: dataUrl }, // Load dataset //
  width: "container", // Wide responsive width //
  height: 520, // Taller because there are many platforms //
  autosize: { type: "fit", contains: "padding" }, // Fit inside container //

  params: [ // Interactivity //
    { // Region selection (click legend) //
      name: "regionPick", // Name of selection //
      select: { type: "point", fields: ["Region"], toggle: false }, // Single region at a time //
      bind: "legend", // Click legend to select //
      clear: "dblclick" // Double-click to clear selection //
    }, // End regionPick //
    { // Hover highlight for bar segments //
      name: "hoverRegion", // Name of hover selection //
      select: { type: "point", fields: ["Platform","Region"], on: "mouseover", clear: "mouseout" } // Hover to highlight //
    } // End hoverRegion //
  ], // End params //

  transform: [ // Prepare regions //
    { fold: ["NA_Sales","EU_Sales","JP_Sales","Other_Sales"], as: ["Region","Sales"] }, // Convert 4 columns into Region + Sales //
    { aggregate: [{ op: "sum", field: "Sales", as: "Total_Sales" }], groupby: ["Platform","Region"] } // Sum sales by platform+region //
  ], // End transform //

  mark: "bar", // Bar chart //
  encoding: { // Encodings //
    y: { field: "Platform", type: "nominal", title: "Platform", sort: "-x" }, // Platforms on Y //
    x: { field: "Total_Sales", type: "quantitative", title: "Total Sales" }, // Sales on X //
    color: { field: "Region", type: "nominal", title: "Region" }, // Stack color by region //
    opacity: { // Fade non-selected regions //
      condition: { param: "regionPick", value: 1 }, // Selected region full strength //
      value: 0.25 // Others faint //
    }, // End opacity //
    stroke: { condition: { param: "hoverRegion", value: "#111" }, value: null }, // Outline on hover //
    strokeWidth: { condition: { param: "hoverRegion", value: 1.5 }, value: 0 }, // Outline thickness //
    tooltip: [ // Tooltip //
      { field: "Platform", type: "nominal" }, // Platform //
      { field: "Region", type: "nominal" }, // Region //
      { field: "Total_Sales", type: "quantitative", format: ".2f" } // Sales //
    ] // End tooltip //
  } // End encoding //
}; // End spec3 //

/* ========================================================= */
/* Visualization 4: Japan Share vs Global Sales (Brush + Zoom/Pan) */
/* ========================================================= */

const spec4 = { // Vega-Lite spec starts for chart 4 //
  $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite schema version //
  description: "Japan share vs Global sales (interactive story)", // Description //
  data: { url: dataUrl }, // Load dataset //
  width: "container", // Wide responsive width //
  height: 460, // Good height for scatter plot //
  autosize: { type: "fit", contains: "padding" }, // Fit inside container //

  params: [ // Interactivity //
    { name: "brush", select: { type: "interval" } }, // Brush: drag a rectangle to select points //
    { name: "zoomPan", select: { type: "interval", bind: "scales" } } // Zoom/pan with bound scales //
  ], // End params //

  transform: [ // Create Japan share //
    { calculate: "datum.Global_Sales > 0 ? datum.JP_Sales / datum.Global_Sales : null", as: "JP_Share" }, // JP_Share = JP / Global //
    { filter: "isValid(datum.JP_Share)" }, // Keep valid rows //
    { filter: "datum.Global_Sales >= 0.5" } // Reduce noise for readability //
  ], // End transform //

  mark: { type: "circle", opacity: 0.7, size: 70 }, // Scatter circles //
  encoding: { // Encodings //
    x: { field: "Global_Sales", type: "quantitative", title: "Global Sales" }, // X-axis //
    y: { field: "JP_Share", type: "quantitative", title: "Japan Share (JP / Global)", scale: { domain: [0, 1] } }, // Y-axis //
    color: { field: "Genre", type: "nominal", title: "Genre" }, // Color by genre //
    opacity: { condition: { param: "brush", value: 1 }, value: 0.15 }, // Brush highlights selected points //
    tooltip: [ // Tooltip info //
      { field: "Name", type: "nominal" }, // Game name //
      { field: "Platform", type: "nominal" }, // Platform //
      { field: "Genre", type: "nominal" }, // Genre //
      { field: "Publisher", type: "nominal" }, // Publisher //
      { field: "Global_Sales", type: "quantitative", format: ".2f" }, // Global sales //
      { field: "JP_Share", type: "quantitative", format: ".0%" } // JP share //
    ] // End tooltip //
  } // End encoding //
}; // End spec4 //

/* ========================================================= */
/* Render all charts into your HTML divs (#vis1, #vis2, #vis3, #vis4) */
/* ========================================================= */

vegaEmbed("#vis1", spec1, embedOptions); // Draw chart 1 into <div id="vis1"></div> //
vegaEmbed("#vis2", spec2, embedOptions); // Draw chart 2 into <div id="vis2"></div> //
vegaEmbed("#vis3", spec3, embedOptions); // Draw chart 3 into <div id="vis3"></div> //
vegaEmbed("#vis4", spec4, embedOptions); // Draw chart 4 into <div id="vis4"></div> //
