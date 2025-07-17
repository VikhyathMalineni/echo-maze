class Dashboard {
  constructor() {
    this.currentPage = 1
    this.levelsPerPage = 9
    this.totalLevels = 20
    this.totalPages = Math.ceil(this.totalLevels / this.levelsPerPage)
    this.init()
  }

  init() {
    if (!window.authManager || !window.authManager.isLoggedIn()) {
      window.location.href = "index.html"
      return
    }
    this.loadUserData()
    this.setupEventListeners()
    this.renderLevelGrid()
  }

  loadUserData() {
    const user = window.authManager.getCurrentUser()
    if (!user) {
      window.location.href = "index.html"
      return
    }
    document.getElementById("username").textContent = user.username
    document.getElementById("userInitial").textContent = user.username.charAt(0).toUpperCase()
    document.getElementById("totalStars").textContent = user.stats.totalStars || 0
    document.getElementById("levelsCompleted").textContent = user.stats.levelsCompleted || 0
  }

  setupEventListeners() {
    const sidebarToggle = document.getElementById("sidebarToggle")
    const sidebar = document.getElementById("sidebar")
    sidebarToggle?.addEventListener("click", () => sidebar.classList.toggle("active"))

    document.getElementById("prevPage")?.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--
        this.renderLevelGrid()
        this.updatePagination()
      }
    })

    document.getElementById("nextPage")?.addEventListener("click", () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        this.renderLevelGrid()
        this.updatePagination()
      }
    })

    const settingsBtn = document.getElementById("settingsBtn")
    const settingsModal = document.getElementById("settingsModal")
    const closeSettings = document.getElementById("closeSettings")
    settingsBtn?.addEventListener("click", () => this.openSettingsModal())
    closeSettings?.addEventListener("click", () => settingsModal.classList.remove("active"))

    const howToPlayBtn = document.getElementById("howToPlayBtn")
    const howToPlayModal = document.getElementById("howToPlayModal")
    const closeHowToPlay = document.getElementById("closeHowToPlay")
    howToPlayBtn?.addEventListener("click", () => howToPlayModal.classList.add("active"))
    closeHowToPlay?.addEventListener("click", () => howToPlayModal.classList.remove("active"))

    this.setupSettingsControls()

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      if (confirm("Are you sure you want to logout?")) window.authManager.logout()
    })

    document.addEventListener("click", (e) => {
      const modals = document.querySelectorAll(".modal")
      modals.forEach((modal) => {
        if (e.target === modal) modal.classList.remove("active")
      })
    })
  }

  setupSettingsControls() {
    const user = window.authManager.getCurrentUser()
    const colorTheme = document.getElementById("colorTheme")
    if (colorTheme) {
      colorTheme.value = user.settings.colorTheme
      colorTheme.addEventListener("change", () => {
        window.authManager.updateSettings({ colorTheme: colorTheme.value })
        this.applyColorTheme(colorTheme.value)
      })
    }

    document.getElementById("resetProgress")?.addEventListener("click", () => {
      if (confirm("Are you sure you want to reset all progress? This cannot be undone!")) {
        window.authManager.resetProgress()
        this.loadUserData()
        this.renderLevelGrid()
        document.getElementById("settingsModal").classList.remove("active")
      }
    })
  }

  openSettingsModal() {
    const user = window.authManager.getCurrentUser()
    document.getElementById("colorTheme").value = user.settings.colorTheme
    document.getElementById("settingsModal").classList.add("active")
  }

  applyColorTheme(theme) {
    const root = document.documentElement
    switch (theme) {
      case "classic":
        root.style.setProperty("--accent-cyan", "#4A90E2")
        root.style.setProperty("--accent-pink", "#7B68EE")
        break
      case "forest":
        root.style.setProperty("--accent-cyan", "#10B981")
        root.style.setProperty("--accent-pink", "#34D399")
        break
      default:
        root.style.setProperty("--accent-cyan", "#00FFE0")
        root.style.setProperty("--accent-pink", "#FF4E8B")
    }
  }

  renderLevelGrid() {
    const levelGrid = document.getElementById("levelGrid")
    const user = window.authManager.getCurrentUser()
    if (!levelGrid || !user) return

    levelGrid.innerHTML = ""
    const startLevel = (this.currentPage - 1) * this.levelsPerPage + 1
    const endLevel = Math.min(startLevel + this.levelsPerPage - 1, this.totalLevels)

    for (let i = startLevel; i <= endLevel; i++) {
      const levelCard = this.createLevelCard(i, user)
      levelGrid.appendChild(levelCard)
    }
    this.updatePagination()
  }

  createLevelCard(levelId, user) {
    const isUnlocked = user.progress.unlockedLevels.includes(levelId)
    const stars = user.progress.levelStars[levelId] || 0
    const isCompleted = stars > 0
    const totalStars = window.levelManager.getLevel(levelId).stars.length

    const card = document.createElement("div")
    card.className = `level-card ${isUnlocked ? (isCompleted ? "completed" : "") : "locked"}`

    card.innerHTML = `
      <span class="level-number">${levelId}</span>
      <h3 class="level-title">${this.getLevelTitle(levelId)}</h3>
      <div class="level-stars">
        ${this.renderStars(stars, totalStars)}
      </div>
      <div class="level-status ${isCompleted ? "completed" : isUnlocked ? "available" : "locked"}">
        ${isCompleted ? `${stars}/${totalStars} Stars` : isUnlocked ? "Available" : "Locked"}
      </div>
    `

    if (isUnlocked) {
      card.style.cursor = "pointer"
      card.addEventListener("click", () => this.startLevel(levelId))
    }
    return card
  }

  renderStars(earned, total) {
    let starsHtml = ""
    for (let i = 1; i <= total; i++) {
      starsHtml += `<span class="star ${i <= earned ? "earned" : ""}">⭐</span>`
    }
    return starsHtml
  }

  getLevelTitle(levelId) {
    return window.levelManager.getLevelTitle(levelId)
  }

  updatePagination() {
    document.getElementById("currentPage").textContent = this.currentPage
    document.getElementById("totalPages").textContent = this.totalPages
    const prevBtn = document.getElementById("prevPage")
    const nextBtn = document.getElementById("nextPage")
    if (prevBtn) prevBtn.disabled = this.currentPage === 1
    if (nextBtn) nextBtn.disabled = this.currentPage === this.totalPages
  }

  startLevel(levelId) {
    sessionStorage.setItem("selectedLevel", levelId)
    window.location.href = "game.html"
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new Dashboard()
})
