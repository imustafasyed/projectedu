/* ========================================= */
/* VIDEO GAME SALES VISUALIZATIONS          */
/* All charts use width:"container"         */
/* Every line is commented for clarity      */
/* ========================================= */

const dataUrl = "data/videogames_wide.csv"; // Path to CSV data file

const embedOptions = { // Options for Vega-Embed
  actions: false, // Hide download/edit buttons
  renderer: "svg" // Use SVG for crisp graphics
};

function showError(targetId, err) { // Display errors if chart fails
  const el = document.querySelector(targetId); // Find the chart container
  if (el) { // If container exists
    el.innerHTML = `
      <div style="color:#b00020;font-weight:700;">Chart failed to load</div>
      <pre style="white-space:pre-wrap;">${String(err)}</pre>
    `; // Show error message
  }
  console.error(err); // Log error to console
}

window.addEventListener("load", async () => { // Wait for page to load completely

  /* ========================= */
  /* Visualization 1 (Heatmap) */
  /* ========================= */
  const spec1 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite version
    data: { url: dataUrl }, // Load data from CSV
    width: "container", // Responsive width
    height: 420, // Fixed height
    transform: [ // Process the data
      { 
        aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }], // Sum sales
        groupby: ["Genre", "Platform"] // Group by Genre and Platform
      }
    ],
    mark: "rect", // Use rectangles for heatmap
    encoding: { // Map data to visual properties
      x: { field: "Platform", type: "nominal", title: "Platform", axis: { labelAngle: -40 } }, // X-axis
      y: { field: "Genre", type: "nominal", title: "Genre" }, // Y-axis
      color: { // Color encoding
        field: "Total_Global_Sales", 
        type: "quantitative", 
        title: "Total Global Sales", 
        scale: { scheme: "blues" } // Blue color scheme
      },
      tooltip: [ // Tooltip on hover
        { field: "Genre", type: "nominal" },
        { field: "Platform", type: "nominal" },
        { field: "Total_Global_Sales", type: "quantitative", format: ".2f" }
      ]
    }
  };

  /* ========================================= */
  /* Visualization 2 (Line Chart)             */
  /* ========================================= */
  const spec2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: "container",
    height: 420,
    params: [ // Interactive parameters
      {
        name: "pickGenre", // Genre dropdown
        value: "Action", // Default value
        bind: {
          input: "select", // Dropdown input
          options: ["Action","Sports","Shooter","Role-Playing","Platform","Racing","Misc","Fighting","Simulation","Puzzle","Adventure","Strategy"],
          name: "Choose Genre: "
        }
      }
    ],
    transform: [ // Data transformations
      { filter: "datum.Year != null && datum.Year != 'N/A'" }, // Remove null years
      { calculate: "toNumber(datum.Year)", as: "YearNum" }, // Convert year to number
      { filter: "datum.Genre === pickGenre" }, // Filter by selected genre
      { 
        aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }], 
        groupby: ["YearNum","Platform"] 
      }
    ],
    layer: [ // Multiple layers for interaction
      {
        params: [ // Selection parameters
          {
            name: "platformPick", // Click legend to select platform
            select: { type: "point", fields: ["Platform"], toggle: false },
            bind: "legend",
            clear: "dblclick"
          },
          {
            name: "hoverPoint", // Hover to show tooltip
            select: { type: "point", fields: ["Platform"], nearest: true, on: "mouseover", clear: "mouseout" }
          },
          {
            name: "zoomPan", // Drag to zoom/pan
            select: { type: "interval", bind: "scales" }
          }
        ],
        mark: { type: "line", strokeWidth: 2 }, // Line chart
        encoding: {
          x: { field: "YearNum", type: "quantitative", title: "Year" },
          y: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales" },
          color: { field: "Platform", type: "nominal", title: "Platform" },
          opacity: { // Fade unselected platforms
            condition: { param: "platformPick", value: 1 },
            value: 0.12
          }
        }
      },
      {
        mark: { type: "point", filled: true, size: 70 }, // Points for tooltip
        encoding: {
          x: { field: "YearNum", type: "quantitative" },
          y: { field: "Total_Global_Sales", type: "quantitative" },
          color: { field: "Platform", type: "nominal" },
          opacity: { // Show only on hover
            condition: { param: "hoverPoint", value: 1 },
            value: 0
          },
          tooltip: [
            { field: "Platform", type: "nominal" },
            { field: "YearNum", type: "quantitative", title: "Year" },
            { field: "Total_Global_Sales", type: "quantitative", format: ".2f" }
          ]
        }
      }
    ]
  };

  /* ========================================== */
  /* Visualization 3 (Stacked Bars)            */
  /* ========================================== */
  const spec3 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: "container",
    height: 560, // Taller for many platforms
    params: [
      {
        name: "regionPick", // Click legend to select region
        select: { type: "point", fields: ["Region"], toggle: false },
        bind: "legend",
        clear: "dblclick"
      },
      {
        name: "hoverSeg", // Hover to highlight
        select: { type: "point", fields: ["Platform","Region"], on: "mouseover", clear: "mouseout" }
      }
    ],
    transform: [ // Convert wide to long format
      { 
        fold: ["NA_Sales","EU_Sales","JP_Sales","Other_Sales"], 
        as: ["Region","Sales"] 
      },
      { 
        aggregate: [{ op: "sum", field: "Sales", as: "Total_Sales" }], 
        groupby: ["Platform","Region"] 
      }
    ],
    mark: "bar", // Bar chart
    encoding: {
      y: { field: "Platform", type: "nominal", title: "Platform", sort: "-x" }, // Y-axis
      x: { field: "Total_Sales", type: "quantitative", title: "Total Sales" }, // X-axis
      color: { field: "Region", type: "nominal", title: "Region" }, // Color by region
      opacity: { // Fade unselected
        condition: { param: "regionPick", value: 1 },
        value: 0.25
      },
      stroke: { // Border on hover
        condition: { param: "hoverSeg", value: "#111" },
        value: null
      },
      strokeWidth: {
        condition: { param: "hoverSeg", value: 1.5 },
        value: 0
      },
      tooltip: [
        { field: "Platform", type: "nominal" },
        { field: "Region", type: "nominal" },
        { field: "Total_Sales", type: "quantitative", format: ".2f" }
      ]
    }
  };

  /* ============================================= */
  /* Visualization 4 (Scatter Plot)               */
  /* ============================================= */
  const spec4 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: "container",
    height: 460,
    params: [
      { name: "brush", select: { type: "interval" } }, // Brush selection
      { name: "zoomPan", select: { type: "interval", bind: "scales" } } // Zoom/pan
    ],
    transform: [ // Calculate Japan share
      { 
        calculate: "datum.Global_Sales > 0 ? datum.JP_Sales / datum.Global_Sales : null", 
        as: "JP_Share" 
      },
      { filter: "isValid(datum.JP_Share)" }, // Remove invalid
      { filter: "datum.Global_Sales >= 0.5" } // Minimum sales threshold
    ],
    mark: { type: "circle", opacity: 0.75, size: 70 }, // Scatter points
    encoding: {
      x: { field: "Global_Sales", type: "quantitative", title: "Global Sales" },
      y: { 
        field: "JP_Share", 
        type: "quantitative", 
        title: "Japan Share (JP / Global)", 
        scale: { domain: [0, 1] } 
      },
      color: { field: "Genre", type: "nominal", title: "Genre" },
      opacity: { // Highlight brushed area
        condition: { param: "brush", value: 1 },
        value: 0.15
      },
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

  /* ========================= */
  /* Render all charts         */
  /* ========================= */
  try { await vegaEmbed("#vis1", spec1, embedOptions); } catch (e) { showError("#vis1", e); }
  try { await vegaEmbed("#vis2", spec2, embedOptions); } catch (e) { showError("#vis2", e); }
  try { await vegaEmbed("#vis3", spec3, embedOptions); } catch (e) { showError("#vis3", e); }
  try { await vegaEmbed("#vis4", spec4, embedOptions); } catch (e) { showError("#vis4", e); }

});
