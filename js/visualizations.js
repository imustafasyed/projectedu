/* ========================================================================== */
/* VIDEO GAME SALES VISUALIZATIONS                                            */
/* Interactive charts using Vega-Lite library                                 */
/* Created by: Mustafa                                                        */
/* Each line is commented to explain what it does                             */
/* ========================================================================== */

// ==========================
// CONFIGURATION
// ==========================

// This is where your CSV data file is located
const dataUrl = "data/videogames_wide.csv";

// These are settings for how the charts appear on the page
const embedOptions = {
  actions: false, // Don't show the download/edit buttons (keeps it clean)
  renderer: "svg" // Use SVG for crisp, clear graphics
};

// ==========================
// ERROR HANDLING
// ==========================

// This function shows an error message if a chart doesn't load
function showError(targetId, err) {
  const el = document.querySelector(targetId); // Find where the chart should be
  if (el) { // If we found it
    el.innerHTML = `<div style="color:#b00020; padding:2rem; text-align:center;">
      <strong>Chart failed to load</strong><br>
      <small>Check console for details</small>
    </div>`; // Show error message
  }
  console.error("Chart Error:", err); // Print error details in browser console
}

// ==========================
// WAIT FOR PAGE TO LOAD
// ==========================

// Don't start creating charts until everything is loaded
window.addEventListener("load", async () => {

  /* ========================================================================== */
  /* VISUALIZATION 1: HEATMAP                                                   */
  /* Shows which Genre + Platform combinations sell the most games             */
  /* ========================================================================== */

  const spec1 = {
    // Tell Vega-Lite which version we're using
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    
    // Load data from CSV file
    data: { url: dataUrl },
    
    // Make width match the container it's in (responsive)
    width: "container",
    
    // Set a fixed height
    height: 420,
    
    // Make sure it fits nicely in the space
    autosize: { type: "fit", contains: "padding" },
    
    // TRANSFORM: Process the data before visualizing
    transform: [
      {
        // Add up (aggregate) all the Global_Sales values
        aggregate: [
          { op: "sum", field: "Global_Sales", as: "Total_Global_Sales" } // Sum sales for each combination
        ],
        // Group by Genre and Platform (so we get totals for each combo)
        groupby: ["Genre", "Platform"]
      }
    ],
    
    // Use rectangles to make a heatmap
    mark: "rect",
    
    // ENCODING: Map data to visual properties
    encoding: {
      // X-AXIS: Show platforms across the bottom
      x: { 
        field: "Platform", // Use Platform column from data
        type: "nominal", // It's a category (not a number)
        title: "Platform", // Label on the axis
        axis: { labelAngle: -40 } // Tilt labels so they don't overlap
      },
      
      // Y-AXIS: Show genres up the side
      y: { 
        field: "Genre", // Use Genre column from data
        type: "nominal", // It's a category
        title: "Genre" // Label on the axis
      },
      
      // COLOR: Darker blue = higher sales
      color: { 
        field: "Total_Global_Sales", // Use the total we calculated
        type: "quantitative", // It's a number
        title: "Total Global Sales (millions)", // Legend title
        scale: { 
          scheme: "blues", // Color scheme from light to dark blue
          domainMin: 0 // Start at 0
        }
      },
      
      // TOOLTIP: What shows when you hover
      tooltip: [
        { field: "Genre", type: "nominal", title: "Genre" },
        { field: "Platform", type: "nominal", title: "Platform" },
        { field: "Total_Global_Sales", type: "quantitative", title: "Sales (millions)", format: ".2f" }
      ]
    }
  };

  /* ========================================================================== */
  /* VISUALIZATION 2: LINE CHART                                                */
  /* Shows how sales changed over time for different platforms                 */
  /* Has dropdown to filter by genre + click legend to highlight               */
  /* ========================================================================== */

  const spec2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: "container",
    height: 450,
    autosize: { type: "fit", contains: "padding" },
    
    // PARAMETERS: Interactive controls
    params: [
      {
        // Dropdown menu to pick which genre to show
        name: "pickGenre",
        value: "Action", // Start with Action selected
        bind: {
          input: "select", // Make a dropdown
          options: ["Action", "Sports", "Shooter", "Role-Playing", "Platform", "Racing", 
                    "Misc", "Fighting", "Simulation", "Puzzle", "Adventure", "Strategy"],
          name: "Select Genre: " // Label for dropdown
        }
      }
    ],
    
    // TRANSFORM: Clean and prepare the data
    transform: [
      // Remove rows where Year is missing
      { filter: "datum.Year != null && datum.Year != 'N/A'" },
      
      // Convert Year from text to a number
      { calculate: "toNumber(datum.Year)", as: "YearNum" },
      
      // Only keep rows matching the selected genre
      { filter: "datum.Genre === pickGenre" },
      
      // Sum up sales for each Year + Platform combination
      {
        aggregate: [{ op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }],
        groupby: ["YearNum", "Platform"]
      }
    ],
    
    // LAYER: Use multiple layers for complex interactions
    layer: [
      // LAYER 1: The actual lines
      {
        // Interactive selections (put here to avoid conflicts)
        params: [
          {
            // Click legend to highlight one platform
            name: "platformPick",
            select: { 
              type: "point", // Select by clicking
              fields: ["Platform"], // Select platforms
              toggle: false // Clicking new platform replaces old selection
            },
            bind: "legend", // Clicking legend triggers this
            clear: "dblclick" // Double-click to clear selection
          },
          {
            // Hover over lines to see values
            name: "hoverPoint",
            select: { 
              type: "point",
              fields: ["Platform"],
              nearest: true, // Select closest point
              on: "mouseover", // Activate on hover
              clear: "mouseout" // Deactivate when mouse leaves
            }
          },
          {
            // Drag to zoom, scroll to pan
            name: "zoomPan",
            select: { 
              type: "interval", // Select a rectangular area
              bind: "scales" // Zoom/pan the axes
            }
          }
        ],
        
        // Draw lines
        mark: { 
          type: "line", 
          strokeWidth: 2.5 // Line thickness
        },
        
        encoding: {
          x: { 
            field: "YearNum", 
            type: "quantitative", 
            title: "Year",
            axis: { format: "d", tickCount: 10 } // Show as whole numbers
          },
          y: { 
            field: "Total_Global_Sales", 
            type: "quantitative", 
            title: "Total Global Sales (millions)" 
          },
          color: { 
            field: "Platform", 
            type: "nominal", 
            title: "Platform",
            scale: { scheme: "category20" } // Colorful palette
          },
          // Make unselected platforms very faded
          opacity: { 
            condition: { param: "platformPick", value: 1 }, // Selected = solid
            value: 0.12 // Unselected = very faded
          }
        }
      },
      
      // LAYER 2: Dots that appear when hovering (for tooltips)
      {
        mark: { type: "point", filled: true, size: 100 },
        encoding: {
          x: { field: "YearNum", type: "quantitative" },
          y: { field: "Total_Global_Sales", type: "quantitative" },
          color: { field: "Platform", type: "nominal" },
          
          // Only visible when hovering
          opacity: { 
            condition: { param: "hoverPoint", value: 1 }, // Show on hover
            value: 0 // Otherwise invisible
          },
          
          // Tooltip with details
          tooltip: [
            { field: "Platform", type: "nominal", title: "Platform" },
            { field: "YearNum", type: "quantitative", title: "Year" },
            { field: "Total_Global_Sales", type: "quantitative", title: "Sales (millions)", format: ".2f" }
          ]
        }
      }
    ]
  };

  /* ========================================================================== */
  /* VISUALIZATION 3: STACKED BAR CHART                                         */
  /* Shows regional breakdown of sales for each platform                       */
  /* ========================================================================== */

  const spec3 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: "container",
    height: 580, // Taller to fit all platforms
    autosize: { type: "fit", contains: "padding" },
    
    // PARAMETERS: Interactive controls
    params: [
      {
        // Click legend to highlight one region
        name: "regionPick",
        select: { 
          type: "point", 
          fields: ["Region"], 
          toggle: false // Single selection
        },
        bind: "legend",
        clear: "dblclick"
      },
      {
        // Hover over bar segments
        name: "hoverSeg",
        select: { 
          type: "point", 
          fields: ["Platform", "Region"],
          on: "mouseover", 
          clear: "mouseout" 
        }
      }
    ],
    
    // TRANSFORM: Reshape data from wide to long format
    transform: [
      {
        // Convert regional columns into rows
        fold: ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"],
        as: ["Region", "Sales"] // New columns
      },
      {
        // Sum sales for each Platform + Region
        aggregate: [{ op: "sum", field: "Sales", as: "Total_Sales" }],
        groupby: ["Platform", "Region"]
      }
    ],
    
    // Use bars
    mark: "bar",
    
    encoding: {
      // Y-AXIS: Platform names (horizontal bars)
      y: { 
        field: "Platform", 
        type: "nominal", 
        title: "Platform",
        sort: "-x", // Sort by total sales
        axis: { labelLimit: 100 }
      },
      
      // X-AXIS: Sales amounts
      x: { 
        field: "Total_Sales", 
        type: "quantitative", 
        title: "Total Sales (millions)",
        stack: true // Stack regions on top of each other
      },
      
      // COLOR: Different color for each region
      color: { 
        field: "Region", 
        type: "nominal", 
        title: "Region",
        scale: { 
          domain: ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"],
          range: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"] // Blue, Orange, Green, Red
        },
        legend: { 
          labelExpr: "replace(datum.label, '_Sales', '')" // Remove "_Sales" from labels
        }
      },
      
      // Fade unselected regions
      opacity: { 
        condition: { param: "regionPick", value: 1 },
        value: 0.25
      },
      
      // Add border on hover
      stroke: { 
        condition: { param: "hoverSeg", value: "#000" },
        value: null
      },
      strokeWidth: { 
        condition: { param: "hoverSeg", value: 2 },
        value: 0
      },
      
      // Tooltip
      tooltip: [
        { field: "Platform", type: "nominal", title: "Platform" },
        { field: "Region", type: "nominal", title: "Region" },
        { field: "Total_Sales", type: "quantitative", title: "Sales (millions)", format: ".2f" }
      ]
    }
  };

  /* ========================================================================== */
  /* VISUALIZATION 4: SCATTER PLOT                                              */
  /* Shows Japan's share of sales vs global sales                              */
  /* Reveals which games are popular specifically in Japan                     */
  /* ========================================================================== */

  const spec4 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: "container",
    height: 480,
    autosize: { type: "fit", contains: "padding" },
    
    // PARAMETERS: Interactive controls
    params: [
      {
        // Drag to select area of points
        name: "brush",
        select: { type: "interval" }
      },
      {
        // Zoom and pan
        name: "zoomPan",
        select: { 
          type: "interval", 
          bind: "scales" 
        }
      }
    ],
    
    // TRANSFORM: Calculate Japan's share
    transform: [
      {
        // Calculate: Japan Sales ÷ Global Sales = Share
        calculate: "datum.Global_Sales > 0 ? datum.JP_Sales / datum.Global_Sales : null",
        as: "JP_Share"
      },
      {
        // Remove invalid calculations
        filter: "isValid(datum.JP_Share)"
      },
      {
        // Only show games with at least 0.5 million sales (reduce clutter)
        filter: "datum.Global_Sales >= 0.5"
      }
    ],
    
    // Use circles for scatter plot
    mark: { 
      type: "circle", 
      opacity: 0.7, 
      size: 80 
    },
    
    encoding: {
      // X-AXIS: Total global sales (log scale to see patterns better)
      x: { 
        field: "Global_Sales", 
        type: "quantitative", 
        title: "Global Sales (millions)",
        scale: { 
          type: "log", // Logarithmic scale
          domain: [0.5, 100]
        }
      },
      
      // Y-AXIS: Japan's percentage of global sales
      y: { 
        field: "JP_Share", 
        type: "quantitative", 
        title: "Japan Sales Share",
        scale: { domain: [0, 1] }, // 0 to 1 = 0% to 100%
        axis: { format: ".0%" } // Show as percentage
      },
      
      // COLOR: Different color per genre
      color: { 
        field: "Genre", 
        type: "nominal", 
        title: "Genre",
        scale: { scheme: "tableau20" }
      },
      
      // Fade points not in brushed area
      opacity: { 
        condition: { param: "brush", value: 0.9 },
        value: 0.15
      },
      
      // Detailed tooltip
      tooltip: [
        { field: "Name", type: "nominal", title: "Game Title" },
        { field: "Platform", type: "nominal", title: "Platform" },
        { field: "Genre", type: "nominal", title: "Genre" },
        { field: "Publisher", type: "nominal", title: "Publisher" },
        { field: "Year", type: "ordinal", title: "Year" },
        { field: "Global_Sales", type: "quantitative", title: "Global Sales (millions)", format: ".2f" },
        { field: "JP_Sales", type: "quantitative", title: "Japan Sales (millions)", format: ".2f" },
        { field: "JP_Share", type: "quantitative", title: "Japan Share", format: ".1%" }
      ]
    }
  };

  /* ========================================================================== */
  /* RENDER ALL CHARTS                                                          */
  /* Try to create each chart, show error if it fails                          */
  /* ========================================================================== */

  // Chart 1: Heatmap
  try {
    await vegaEmbed("#vis1", spec1, embedOptions);
    console.log("✓ Chart 1 loaded");
  } catch (error) {
    showError("#vis1", error);
  }

  // Chart 2: Line Chart
  try {
    await vegaEmbed("#vis2", spec2, embedOptions);
    console.log("✓ Chart 2 loaded");
  } catch (error) {
    showError("#vis2", error);
  }

  // Chart 3: Stacked Bars
  try {
    await vegaEmbed("#vis3", spec3, embedOptions);
    console.log("✓ Chart 3 loaded");
  } catch (error) {
    showError("#vis3", error);
  }

  // Chart 4: Scatter Plot
  try {
    await vegaEmbed("#vis4", spec4, embedOptions);
    console.log("✓ Chart 4 loaded");
  } catch (error) {
    showError("#vis4", error);
  }

  console.log("All visualizations complete!");

}); // End of page load

/* ========================================================================== */
/* HOW TO USE THE INTERACTIVE FEATURES:                                       */
/*                                                                            */
/* Chart 1 (Heatmap):                                                         */
/* - Hover over any cell to see exact numbers                                */
/*                                                                            */
/* Chart 2 (Line Chart):                                                      */
/* - Use dropdown to change genre                                             */
/* - Click a platform in the legend to highlight it                          */
/* - Double-click anywhere to reset                                           */
/* - Hover over lines to see details                                          */
/* - Drag to zoom into a time period                                          */
/*                                                                            */
/* Chart 3 (Stacked Bars):                                                    */
/* - Click a region in the legend to highlight it                            */
/* - Double-click to reset                                                    */
/* - Hover over bar segments for details                                      */
/*                                                                            */
/* Chart 4 (Scatter Plot):                                                    */
/* - Drag to select a rectangular area                                        */
/* - Scroll/pinch to zoom                                                     */
/* - Hover over points for game details                                       */
/* ========================================================================== */
