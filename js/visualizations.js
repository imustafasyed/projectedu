/* ========================================================================== */
/* VIDEO GAME SALES VISUALIZATIONS                                            */
/* Interactive charts using Vega-Lite library                                 */
/* Created by: Mustafa                                                        */
/* Each visualization is fully commented for easy understanding               */
/* ========================================================================== */

// ==========================
// CONFIGURATION VARIABLES
// ==========================

// Path to your CSV data file (make sure this matches your actual file location)
const dataUrl = "data/videogames_wide.csv";

// Settings for how Vega-Lite embeds the charts into the page
const embedOptions = {
  actions: false, // Hide the "..." menu button (keeps interface clean)
  renderer: "svg" // Use SVG rendering (crisp, scalable graphics)
};

// ==========================
// ERROR HANDLING FUNCTION
// ==========================

// This function displays user-friendly error messages if a chart fails to load
function showError(targetId, err) {
  const el = document.querySelector(targetId); // Find the container where chart should appear
  if (el) { // If container exists
    el.innerHTML = `
      <div style="color:#b00020; font-weight:700; font-size:1.1rem; margin-bottom:1rem;">
        ⚠️ Chart Failed to Load
      </div>
      <div style="background:#fff3cd; padding:1rem; border-radius:8px; border:1px solid #ffc107;">
        <strong>Possible reasons:</strong><br>
        • Data file not found (check if videogames_wide.csv exists in data/ folder)<br>
        • Network connection issue<br>
        • Browser compatibility problem<br><br>
        <strong>Technical details:</strong><br>
        <code style="display:block; white-space:pre-wrap; font-size:0.85rem; color:#856404;">${String(err)}</code>
      </div>
    `; // Display helpful error message
  }
  console.error("Visualization Error:", err); // Also log to browser console for debugging
}

// ==========================
// MAIN RENDERING FUNCTION
// ==========================

// Wait for page and all libraries to fully load before creating charts
window.addEventListener("load", async () => {

  // Remove loading indicators from all chart containers
  document.querySelectorAll('.vis-loading').forEach(el => el.remove());

  /* ========================================================================== */
  /* VISUALIZATION 1: HEATMAP - Global Sales by Genre and Platform              */
  /* ========================================================================== */
  /* Research Questions:                                                        */
  /* 1. Which genre-platform combinations generate the highest global sales?   */
  /* 2. Are certain platforms dominated by specific genres?                    */
  /* ========================================================================== */

  const spec1 = {
    // Specify which version of Vega-Lite we're using
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    
    // Load the data from CSV file
    data: { url: dataUrl },
    
    // Make chart width match container (responsive design)
    width: "container",
    
    // Set fixed height for consistent appearance
    height: 420,
    
    // Auto-sizing behavior - fit within container with padding
    autosize: { type: "fit", contains: "padding" },
    
    // Data transformation pipeline
    transform: [
      {
        // Combine all games by Genre + Platform, summing their Global Sales
        aggregate: [
          { op: "sum", field: "Global_Sales", as: "Total_Global_Sales" } // Add up all sales
        ],
        groupby: ["Genre", "Platform"] // Create one row per Genre-Platform pair
      }
    ],
    
    // Use rectangles to create heatmap cells
    mark: "rect",
    
    // Visual encoding - how data maps to visual properties
    encoding: {
      // X-axis: Platform names
      x: { 
        field: "Platform", // Use Platform column
        type: "nominal", // Categorical data (not numbers)
        title: "Platform", // Axis label
        axis: { labelAngle: -40 } // Rotate labels to prevent overlap
      },
      
      // Y-axis: Genre names
      y: { 
        field: "Genre", // Use Genre column
        type: "nominal", // Categorical data
        title: "Genre" // Axis label
      },
      
      // Color intensity: Total sales amount
      color: { 
        field: "Total_Global_Sales", // Use our calculated total
        type: "quantitative", // Numeric data
        title: "Total Global Sales (millions)", // Legend title
        scale: { 
          scheme: "blues", // Color palette (light to dark blue)
          domainMin: 0 // Start color scale at 0
        }
      },
      
      // Hover tooltip: Show details on mouse-over
      tooltip: [
        { field: "Genre", type: "nominal", title: "Genre" }, // Show genre name
        { field: "Platform", type: "nominal", title: "Platform" }, // Show platform name
        { 
          field: "Total_Global_Sales", 
          type: "quantitative", 
          title: "Total Sales (millions)",
          format: ".2f" // Show 2 decimal places (e.g., 123.45)
        }
      ]
    }
  };

  /* ========================================================================== */
  /* VISUALIZATION 2: LINE CHART - Sales Over Time by Platform                 */
  /* ========================================================================== */
  /* Research Questions:                                                        */
  /* 1. How have video game sales evolved across platforms over the years?     */
  /* 2. Which platforms experienced dramatic rise or decline in sales?         */
  /* ========================================================================== */

  const spec2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: "container",
    height: 450,
    autosize: { type: "fit", contains: "padding" },
    
    // Top-level interactive parameters
    params: [
      {
        // Dropdown menu to filter by genre
        name: "pickGenre", // Variable name for selected genre
        value: "Action", // Default selection when page loads
        bind: {
          input: "select", // Create dropdown menu
          options: [
            "Action", "Sports", "Shooter", "Role-Playing", "Platform", 
            "Racing", "Misc", "Fighting", "Simulation", "Puzzle", 
            "Adventure", "Strategy"
          ], // Available genre options
          name: "Select Genre: " // Label for dropdown
        }
      }
    ],
    
    // Clean and prepare the data
    transform: [
      // Remove rows with missing or invalid year data
      { filter: "datum.Year != null && datum.Year != 'N/A'" },
      
      // Convert year from text to number for proper sorting
      { calculate: "toNumber(datum.Year)", as: "YearNum" },
      
      // Keep only games matching the selected genre
      { filter: "datum.Genre === pickGenre" },
      
      // Sum sales by year and platform
      {
        aggregate: [
          { op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }
        ],
        groupby: ["YearNum", "Platform"] // One row per Year-Platform combination
      }
    ],
    
    // Use multiple layers for complex interactivity
    layer: [
      // LAYER 1: Line chart with selection controls
      {
        // Interactive selections (defined here to avoid duplicate signals)
        params: [
          {
            // Click legend to select/highlight one platform
            name: "platformPick",
            select: { 
              type: "point", // Click-based selection
              fields: ["Platform"], // Select based on platform
              toggle: false // Clicking different platform replaces selection (no multi-select)
            },
            bind: "legend", // Clicking legend item triggers selection
            clear: "dblclick" // Double-click anywhere to clear selection
          },
          {
            // Hover to show tooltip
            name: "hoverPoint",
            select: { 
              type: "point", // Point-based selection
              fields: ["Platform"],
              nearest: true, // Select nearest point to mouse
              on: "mouseover", // Trigger on hover
              clear: "mouseout" // Clear when mouse leaves
            }
          },
          {
            // Drag to zoom, scroll to pan
            name: "zoomPan",
            select: { 
              type: "interval", // Rectangular selection
              bind: "scales" // Bind to axis scales for zoom/pan
            }
          }
        ],
        
        // Draw lines connecting data points
        mark: { 
          type: "line", 
          strokeWidth: 2.5, // Line thickness
          point: false // Don't show dots at every point (too cluttered)
        },
        
        encoding: {
          x: { 
            field: "YearNum", 
            type: "quantitative", 
            title: "Year",
            axis: { 
              format: "d", // Display as integer (no decimals)
              tickCount: 10 // Show approximately 10 year labels
            }
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
            scale: { scheme: "category20" } // Use colorful palette with 20 colors
          },
          // Conditional opacity: selected platform at full opacity, others faded
          opacity: { 
            condition: { param: "platformPick", value: 1 }, // Selected = 100% opacity
            value: 0.12 // Unselected = 12% opacity (very faded)
          }
        }
      },
      
      // LAYER 2: Points that appear on hover for tooltips
      {
        mark: { 
          type: "point", 
          filled: true, // Solid circles
          size: 100 // Medium-sized points
        },
        
        encoding: {
          x: { field: "YearNum", type: "quantitative" }, // Same X as lines
          y: { field: "Total_Global_Sales", type: "quantitative" }, // Same Y as lines
          color: { field: "Platform", type: "nominal" }, // Same colors as lines
          
          // Only show points when hovering
          opacity: { 
            condition: { param: "hoverPoint", value: 1 }, // Show on hover
            value: 0 // Otherwise invisible
          },
          
          // Tooltip with detailed information
          tooltip: [
            { field: "Platform", type: "nominal", title: "Platform" },
            { field: "YearNum", type: "quantitative", title: "Year" },
            { 
              field: "Total_Global_Sales", 
              type: "quantitative", 
              title: "Sales (millions)",
              format: ".2f" // Two decimal places
            }
          ]
        }
      }
    ]
  };

  /* ========================================================================== */
  /* VISUALIZATION 3: STACKED BAR CHART - Regional Sales by Platform           */
  /* ========================================================================== */
  /* Research Questions:                                                        */
  /* 1. Do platforms show different popularity across regions?                 */
  /* 2. Which regions contribute most to each platform's total sales?          */
  /* ========================================================================== */

  const spec3 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: "container",
    height: 580, // Taller to accommodate many platforms
    autosize: { type: "fit", contains: "padding" },
    
    // Interactive parameters
    params: [
      {
        // Click legend to select/highlight one region
        name: "regionPick",
        select: { 
          type: "point", 
          fields: ["Region"], 
          toggle: false // Single selection only
        },
        bind: "legend", // Bind to legend clicks
        clear: "dblclick" // Double-click to clear
      },
      {
        // Hover to highlight individual bar segments
        name: "hoverSeg",
        select: { 
          type: "point", 
          fields: ["Platform", "Region"], // Select by both dimensions
          on: "mouseover", 
          clear: "mouseout" 
        }
      }
    ],
    
    // Data transformation: convert wide format to long format
    transform: [
      {
        // Take regional sales columns and stack them into rows
        fold: [
          "NA_Sales",    // North America
          "EU_Sales",    // Europe
          "JP_Sales",    // Japan
          "Other_Sales"  // Rest of world
        ],
        as: ["Region", "Sales"] // Create new columns: Region (name) and Sales (value)
      },
      {
        // Sum up sales for each Platform-Region combination
        aggregate: [
          { op: "sum", field: "Sales", as: "Total_Sales" }
        ],
        groupby: ["Platform", "Region"]
      }
    ],
    
    // Use bars for chart
    mark: "bar",
    
    encoding: {
      // Y-axis: Platform names (horizontal bars)
      y: { 
        field: "Platform", 
        type: "nominal", 
        title: "Platform",
        sort: "-x", // Sort platforms by total sales (descending)
        axis: { labelLimit: 100 } // Allow longer labels without truncation
      },
      
      // X-axis: Sales amounts (bars extend horizontally)
      x: { 
        field: "Total_Sales", 
        type: "quantitative", 
        title: "Total Sales (millions)",
        stack: true // Stack regions within each platform
      },
      
      // Color: Different color for each region
      color: { 
        field: "Region", 
        type: "nominal", 
        title: "Region",
        scale: { 
          domain: ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"], // Order regions
          range: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"] // Custom colors for each region
        },
        legend: { 
          title: "Region",
          labelExpr: "replace(datum.label, '_Sales', '')" // Remove "_Sales" from labels (show "NA" not "NA_Sales")
        }
      },
      
      // Conditional opacity based on selection
      opacity: { 
        condition: { param: "regionPick", value: 1 }, // Selected region = full opacity
        value: 0.25 // Other regions = 25% opacity (faded)
      },
      
      // Outline on hover for emphasis
      stroke: { 
        condition: { param: "hoverSeg", value: "#000" }, // Black outline on hover
        value: null // No outline otherwise
      },
      strokeWidth: { 
        condition: { param: "hoverSeg", value: 2 }, // Thick outline on hover
        value: 0 // No outline otherwise
      },
      
      // Tooltip with detailed information
      tooltip: [
        { field: "Platform", type: "nominal", title: "Platform" },
        { 
          field: "Region", 
          type: "nominal", 
          title: "Region",
          format: "replace(datum.value, '_Sales', '')" // Clean region name
        },
        { 
          field: "Total_Sales", 
          type: "quantitative", 
          title: "Sales (millions)",
          format: ".2f" 
        }
      ]
    }
  };

  /* ========================================================================== */
  /* VISUALIZATION 4: SCATTER PLOT - Japan Share vs Global Sales               */
  /* ========================================================================== */
  /* Research Questions:                                                        */
  /* 1. Which games have high sales in Japan compared to global performance?   */
  /* 2. What genres/publishers create "Japan-centric" games?                   */
  /* ========================================================================== */

  const spec4 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { url: dataUrl },
    width: "container",
    height: 480,
    autosize: { type: "fit", contains: "padding" },
    
    // Interactive parameters
    params: [
      {
        // Drag to select rectangular area of points
        name: "brush",
        select: { type: "interval" } // Rectangular selection
      },
      {
        // Scroll/pinch to zoom, drag to pan
        name: "zoomPan",
        select: { 
          type: "interval", 
          bind: "scales" // Zoom/pan affects axis scales
        }
      }
    ],
    
    // Calculate Japan's share of global sales
    transform: [
      {
        // Calculate: Japan Sales divided by Global Sales
        calculate: "datum.Global_Sales > 0 ? datum.JP_Sales / datum.Global_Sales : null",
        as: "JP_Share" // Create new field called JP_Share
      },
      {
        // Remove rows where calculation failed (invalid or null)
        filter: "isValid(datum.JP_Share)"
      },
      {
        // Filter out very small games (reduce noise/clutter)
        filter: "datum.Global_Sales >= 0.5" // Keep only games with 0.5M+ sales
      }
    ],
    
    // Use circles for scatter plot
    mark: { 
      type: "circle", 
      opacity: 0.7, // Semi-transparent (see overlapping points)
      size: 80 // Medium-sized circles
    },
    
    encoding: {
      // X-axis: Total global sales (logarithmic scale to see patterns better)
      x: { 
        field: "Global_Sales", 
        type: "quantitative", 
        title: "Global Sales (millions)",
        scale: { 
          type: "log", // Logarithmic scale (compresses large values)
          domain: [0.5, 100] // Set reasonable range
        }
      },
      
      // Y-axis: Japan's share of global sales (0 to 1 = 0% to 100%)
      y: { 
        field: "JP_Share", 
        type: "quantitative", 
        title: "Japan Sales Share (JP / Global)",
        scale: { 
          domain: [0, 1] // Range from 0 (0%) to 1 (100%)
        },
        axis: {
          format: ".0%" // Display as percentage (e.g., "50%" instead of "0.5")
        }
      },
      
      // Color: Different color for each genre
      color: { 
        field: "Genre", 
        type: "nominal", 
        title: "Genre",
        scale: { scheme: "tableau20" } // Use Tableau's 20-color palette
      },
      
      // Conditional opacity: highlighted by brush selection
      opacity: { 
        condition: { param: "brush", value: 0.9 }, // Selected points = 90% opacity
        value: 0.15 // Unselected points = 15% opacity (very faded)
      },
      
      // Detailed tooltip on hover
      tooltip: [
        { field: "Name", type: "nominal", title: "Game Title" },
        { field: "Platform", type: "nominal", title: "Platform" },
        { field: "Genre", type: "nominal", title: "Genre" },
        { field: "Publisher", type: "nominal", title: "Publisher" },
        { field: "Year", type: "ordinal", title: "Year" },
        { 
          field: "Global_Sales", 
          type: "quantitative", 
          title: "Global Sales (millions)",
          format: ".2f" 
        },
        { 
          field: "JP_Sales", 
          type: "quantitative", 
          title: "Japan Sales (millions)",
          format: ".2f" 
        },
        { 
          field: "JP_Share", 
          type: "quantitative", 
          title: "Japan Share",
          format: ".1%" // Show as percentage with 1 decimal (e.g., "23.4%")
        }
      ]
    }
  };

  /* ========================================================================== */
  /* RENDER ALL VISUALIZATIONS                                                 */
  /* ========================================================================== */
  /* Each chart is rendered independently with error handling                  */
  /* ========================================================================== */

  // Render Visualization 1 (Heatmap)
  try {
    await vegaEmbed("#vis1", spec1, embedOptions); // Embed chart into #vis1 container
    console.log("✅ Visualization 1 loaded successfully"); // Log success
  } catch (error) {
    showError("#vis1", error); // Show error message if chart fails
  }

  // Render Visualization 2 (Line Chart)
  try {
    await vegaEmbed("#vis2", spec2, embedOptions);
    console.log("✅ Visualization 2 loaded successfully");
  } catch (error) {
    showError("#vis2", error);
  }

  // Render Visualization 3 (Stacked Bar Chart)
  try {
    await vegaEmbed("#vis3", spec3, embedOptions);
    console.log("✅ Visualization 3 loaded successfully");
  } catch (error) {
    showError("#vis3", error);
  }

  // Render Visualization 4 (Scatter Plot)
  try {
    await vegaEmbed("#vis4", spec4, embedOptions);
    console.log("✅ Visualization 4 loaded successfully");
  } catch (error) {
    showError("#vis4", error);
  }

  // Log completion message
  console.log("🎉 All visualizations have been processed!");

}); // End of window load event listener

/* ========================================================================== */
/* END OF VISUALIZATION CODE                                                  */
/* ========================================================================== */

/*
SUMMARY OF INTERACTIVE FEATURES:

Visualization 1 (Heatmap):
- Hover over cells to see exact sales numbers
- Color intensity shows sales volume

Visualization 2 (Line Chart):
- Dropdown to filter by genre
- Click legend to highlight specific platform
- Double-click to reset selection
- Hover over lines to see exact values
- Drag to zoom into time periods
- Scroll to pan left/right

Visualization 3 (Stacked Bars):
- Click legend to highlight specific region
- Double-click to reset selection
- Hover over bar segments for details

Visualization 4 (Scatter Plot):
- Drag to select rectangular area of points
- Scroll/pinch to zoom in/out
- Drag to pan around
- Hover over points for game details
- Colors show different genres

All charts are responsive and will adjust to container width!
*/
