/* visualizations.js
   Goal:
   - Ensure Vis 1 renders the SAME size/location as Vis 2–4
   - Embed ALL charts into the inner wrapper: #visX .vis-inner
   - Force consistent width (1200) so Vis 1 can’t appear smaller
*/

document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // SPEC SOURCES (EDIT THESE)
  // =========================
  // Option 1 (most common): point to your Vega/Vega-Lite JSON spec files
  // Replace these paths with YOUR actual spec paths used in your project.
  const VIS1_SPEC = "specs/vis1.json"; // <-- CHANGE to your real path OR replace with inline spec object
  const VIS2_SPEC = "specs/vis2.json"; // <-- CHANGE
  const VIS3_SPEC = "specs/vis3.json"; // <-- CHANGE
  const VIS4_SPEC = "specs/vis4.json"; // <-- CHANGE

  // Option 2: If you used inline spec objects before, replace VIS1_SPEC etc with the objects:
  // const VIS1_SPEC = { ...your Vega-Lite spec... };

  // =========================
  // GLOBAL EMBED SETTINGS
  // =========================
  const EMBED_OPTS = {
    actions: false,          // hides Vega-Embed action links
    renderer: "canvas"       // consistent rendering
  };

  // =========================
  // SIZE SETTINGS (CONSISTENT)
  // =========================
  const WIDE_WIDTH = 1200;   // matches .vis-inner { min-width: 1200px; }
  const WIDE_HEIGHT = 520;   // visually fits well inside .vis-box-wide { min-height: 620px; }

  // =========================
  // HELPERS
  // =========================

  // Always embed into the inner wrapper if it exists; fallback to the container itself.
  function targetSelector(visId) {
    const inner = document.querySelector(`#${visId} .vis-inner`);
    return inner ? `#${visId} .vis-inner` : `#${visId}`;
  }

  // Force size consistently AFTER embed (works even when spec comes from URL)
  function forceSize(result, width = WIDE_WIDTH, height = WIDE_HEIGHT) {
    try {
      result.view.width(width);
      result.view.height(height);
      result.view.resize();
      result.view.run();
    } catch (e) {
      console.warn("Could not force chart size:", e);
    }
  }

  // Embed one chart and force consistent size
  function embedVis(visId, spec) {
    return vegaEmbed(targetSelector(visId), spec, EMBED_OPTS)
      .then((result) => {
        forceSize(result);
        return result;
      })
      .catch((err) => console.error(`Error embedding ${visId}:`, err));
  }

  // =========================
  // EMBED ALL 4 VISUALIZATIONS
  // =========================
  embedVis("vis1", VIS1_SPEC); // Vis 1 now renders into the SAME inner wrapper as others
  embedVis("vis2", VIS2_SPEC);
  embedVis("vis3", VIS3_SPEC);
  embedVis("vis4", VIS4_SPEC);
});
