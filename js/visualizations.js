const dataUrl = "data/videogames_wide.csv"; // This is where the dataset lives on your website //

// ------------------------------ //
// Visualization 1: Heatmap       //
// ------------------------------ //

const spec1 = { // Chart 1 settings start here //
  $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite schema version //
  description: "Global sales heatmap by genre and platform", // What the chart is about //
  data: { url: dataUrl }, // Load the CSV file //
  transform: [ // Prepare the data before drawing //
    { // Start transform rule //
      aggregate: [ // We want to add numbers together //
        { op: "sum", field: "Global_Sales", as: "Total_Global_Sales" } // Sum global sales //
      ], // End aggregate //
      groupby: ["Genre", "Platform"] // Group by Genre and Platform //
    } // End transform rule //
  ], // End transform list //
  mark: "rect", // Draw rectangles (heatmap squares) //
  encoding: { // Map data to axes and color //
    x: { field: "Platform", type: "nominal", title: "Platform", axis: { labelAngle: -40 } }, // Platforms on the x-axis //
    y: { field: "Genre", type: "nominal", title: "Genre" }, // Genres on the y-axis //
    color: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales", scale: { scheme: "blues" } }, // Color = sales amount //
    tooltip: [ // What shows when you hover //
      { field: "Genre", type: "nominal" }, // Show genre //
      { field: "Platform", type: "nominal" }, // Show platform //
      { field: "Total_Global_Sales", type: "quantitative", format: ".2f" } // Show total sales //
    ] // End tooltip //
  } // End encoding //
}; // End spec1 //

// ------------------------------ //
// Visualization 2: Line chart    //
// ------------------------------ //

const spec2 = { // Chart 2 settings //
  $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite schema //
  description: "Sales over time by platform, filtered by genre", // Chart meaning //
  data: { url: dataUrl }, // Load CSV //
  params: [ // Create dropdown filter //
    { // Start dropdown //
      name: "pickGenre", // Variable name //
      value: "Action", // Default selection //
      bind: { // Dropdown UI //
        input: "select", // Makes a dropdown //
        options: ["Action","Sports","Shooter","Role-Playing","Platform","Racing","Misc","Fighting","Simulation","Puzzle","Adventure","Strategy"], // Dropdown options //
        name: "Choose Genre: " // Label next to dropdown //
      } // End bind //
    } // End dropdown //
  ], // End params //
  transform: [ // Clean and group data //
    { filter: "datum.Year != null && datum.Year != 'N/A'" }, // Remove missing years //
    { calculate: "toNumber(datum.Year)", as: "YearNum" }, // Convert Year to number //
    { filter: "datum.Genre === pickGenre" }, // Keep only selected genre //
    { aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }], groupby: ["YearNum", "Platform"] } // Sum sales by year+platform //
  ], // End transform //
  mark: { type: "line", point: true }, // Draw line with dots //
  encoding: { // Map to axes //
    x: { field: "YearNum", type: "quantitative", title: "Year" }, // Year on x-axis //
    y: { field: "Total_Global_Sales", type: "quantitative", title: "Total Global Sales" }, // Sales on y-axis //
    color: { field: "Platform", type: "nominal", title: "Platform" }, // Color lines by platform //
    tooltip: [ // Hover info //
      { field: "YearNum", type: "quantitative", title: "Year" }, // Show year //
      { field: "Platform", type: "nominal" }, // Show platform //
      { field: "Total_Global_Sales", type: "quantitative", format: ".2f" } // Show sales //
    ] // End tooltip //
  } // End encoding //
}; // End spec2 //

// ------------------------------ //
// Visualization 3: Stacked bars  //
// ------------------------------ //

const spec3 = { // Chart 3 settings //
  $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite schema //
  description: "Regional sales mix by platform", // Chart meaning //
  data: { url: dataUrl }, // Load CSV //
  transform: [ // Prepare data //
    { fold: ["NA_Sales","EU_Sales","JP_Sales","Other_Sales"], as: ["Region","Sales"] }, // Turn 4 columns into 2 columns //
    { aggregate: [{ op: "sum", field: "Sales", as: "Total_Sales" }], groupby: ["Platform","Region"] } // Sum sales per platform+region //
  ], // End transform //
  mark: "bar", // Bars //
  encoding: { // Map to chart //
    y: { field: "Platform", type: "nominal", title: "Platform", sort: "-x" }, // Platforms listed vertically //
    x: { field: "Total_Sales", type: "quantitative", title: "Total Sales" }, // Sales length //
    color: { field: "Region", type: "nominal", title: "Region" }, // Stack by region //
    tooltip: [ // Hover info //
      { field: "Platform", type: "nominal" }, // Platform //
      { field: "Region", type: "nominal" }, // Region //
      { field: "Total_Sales", type: "quantitative", format: ".2f" } // Sales //
    ] // End tooltip //
  } // End encoding //
}; // End spec3 //

// ------------------------------ //
// Visualization 4: Scatter story //
// ------------------------------ //

const spec4 = { // Chart 4 settings //
  $schema: "https://vega.github.io/schema/vega-lite/v5.json", // Vega-Lite schema //
  description: "Japan share vs Global sales", // Chart meaning //
  data: { url: dataUrl }, // Load CSV //
  transform: [ // Prepare data //
    { calculate: "datum.Global_Sales > 0 ? datum.JP_Sales / datum.Global_Sales : null", as: "JP_Share" }, // Create JP_Share //
    { filter: "isValid(datum.JP_Share)" }, // Keep valid rows //
    { filter: "datum.Global_Sales >= 0.5" } // Keep bigger games for clarity //
  ], // End transform //
  mark: { type: "circle", opacity: 0.6 }, // Scatter points //
  encoding: { // Map to chart //
    x: { field: "Global_Sales", type: "quantitative", title: "Global Sales" }, // Global sales //
    y: { field: "JP_Share", type: "quantitative", title: "Japan Share (JP / Global)", scale: { domain: [0, 1] } }, // JP share 0 to 1 //
    color: { field: "Genre", type: "nominal", title: "Genre" }, // Color by genre //
    tooltip: [ // Hover info //
      { field: "Name", type: "nominal" }, // Game name //
      { field: "Platform", type: "nominal" }, // Platform //
      { field: "Genre", type: "nominal" }, // Genre //
      { field: "Publisher", type: "nominal" }, // Publisher //
      { field: "Global_Sales", type: "quantitative", format: ".2f" }, // Global sales //
      { field: "JP_Share", type: "quantitative", format: ".0%" } // JP share as percent //
    ] // End tooltip //
  } // End encoding //
}; // End spec4 //

// ------------------------------ //
// Render all charts into the page //
// ------------------------------ //

vegaEmbed("#vis1", spec1, { actions: false }); // Draw chart 1 inside <div id="vis1"> //
vegaEmbed("#vis2", spec2, { actions: false }); // Draw chart 2 inside <div id="vis2"> //
vegaEmbed("#vis3", spec3, { actions: false }); // Draw chart 3 inside <div id="vis3"> //
vegaEmbed("#vis4", spec4, { actions: false }); // Draw chart 4 inside <div id="vis4"> //
