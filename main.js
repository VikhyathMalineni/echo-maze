// Main initialization script
document.addEventListener("DOMContentLoaded", () => {
  // Ensure global managers are available
  const authManager = window.authManager // Declare authManager
  const levelManager = window.levelManager // Declare levelManager

  if (authManager) {
    window.authManager = authManager
  }

  if (levelManager) {
    window.levelManager = levelManager
  }

  // Add debugging for level display
  console.log("Echo Pulse Game Initialized")

  // Fix any display issues on dashboard
  if (window.location.pathname.includes("dashboard.html")) {
    setTimeout(() => {
      const levelGrid = document.getElementById("levelGrid")
      if (levelGrid && levelGrid.children.length === 0) {
        console.log("Refreshing level grid...")
        if (window.dashboard) {
          window.dashboard.renderLevelGrid()
        }
      }
    }, 500)
  }
})

// Add global error handling
window.addEventListener("error", (e) => {
  console.error("Game Error:", e.error)
})

// Ensure proper canvas sizing
function resizeGameCanvas() {
  const canvas = document.getElementById("gameCanvas")
  if (canvas) {
    const container = canvas.parentElement
    const rect = container.getBoundingClientRect()

    // Set canvas size
    canvas.width = Math.min(800, rect.width - 40)
    canvas.height = Math.min(600, rect.height - 40)

    // Update canvas style
    canvas.style.width = canvas.width + "px"
    canvas.style.height = canvas.height + "px"
  }
}

// Call resize on load and window resize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", resizeGameCanvas)
} else {
  resizeGameCanvas()
}

window.addEventListener("resize", resizeGameCanvas)
