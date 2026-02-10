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
