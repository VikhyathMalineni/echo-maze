class EchoPulseGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas")
    this.ctx = this.canvas.getContext("2d")
    this.currentLevel = null
    this.player = { x: 0, y: 0 }
    this.gameState = "loading"
    this.echoActive = false
    this.echoUsesLeft = 3
    this.visibleTiles = new Set()
    this.footprints = []
    this.collectedStars = 0
    this.totalStars = 0
    this.startTime = 0
    this.echoPulseCount = 0
    this.lastEchoTime = 0
    this.keyPressed = {}
    this.init()
  }

  init() {
    if (!window.authManager || !window.authManager.isLoggedIn()) {
      window.location.href = "index.html"
      return
    }
    const selectedLevel = sessionStorage.getItem("selectedLevel")
    if (!selectedLevel) {
      window.location.href = "dashboard.html"
      return
    }
    this.loadLevel(Number.parseInt(selectedLevel))
    this.setupEventListeners()
    this.setupCanvas()
    this.gameLoop()
  }

  loadLevel(levelId) {
    this.currentLevel = window.levelManager.getLevel(levelId)
    if (!this.currentLevel) {
      alert("Level not found!")
      window.location.href = "dashboard.html"
      return
    }

    this.player = { ...this.currentLevel.playerStart }
    this.collectedStars = 0
    this.totalStars = this.currentLevel.stars.length
    this.startTime = Date.now()
    this.echoPulseCount = 0
    this.echoUsesLeft = 3
    this.footprints = []
    this.gameState = "playing"

    this.currentLevel.stars.forEach((star) => (star.collected = false))

    document.getElementById("currentLevel").textContent = levelId
    document.getElementById("levelTitle").textContent = this.currentLevel.title
    document.getElementById("starsCollected").textContent = this.collectedStars
    document.getElementById("totalStars").textContent = this.totalStars
    document.getElementById("echoUsesLeft").textContent = this.echoUsesLeft

    this.updateVisibleTiles()
    this.addFootprint()
  }

  setupCanvas() {
    const resizeCanvas = () => {
      const container = this.canvas.parentElement
      const maxWidth = Math.min(800, container.clientWidth - 40)
      const maxHeight = Math.min(600, container.clientHeight - 40)
      this.canvas.width = maxWidth
      this.canvas.height = maxHeight
      this.canvas.style.width = maxWidth + "px"
      this.canvas.style.height = maxHeight + "px"
      this.scaledTileSize = Math.min(maxWidth / this.currentLevel.size.width, maxHeight / this.currentLevel.size.height)
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase()
      if (!this.keyPressed[key]) {
        this.keyPressed[key] = true
        if (key === "w" || key === "arrowup") this.movePlayer(0, -1)
        else if (key === "s" || key === "arrowdown") this.movePlayer(0, 1)
        else if (key === "a" || key === "arrowleft") this.movePlayer(-1, 0)
        else if (key === "d" || key === "arrowright") this.movePlayer(1, 0)
        else if (key === " " || key === "spacebar") {
          e.preventDefault()
          this.sendEchoPulse()
        } else if (key === "escape") this.togglePause()
      }
    })

    document.addEventListener("keyup", (e) => {
      this.keyPressed[e.key.toLowerCase()] = false
    })

    const echoPulseBtn = document.getElementById("echoPulseBtn")
    const mobileEchoBtn = document.getElementById("mobileEchoBtn")
    echoPulseBtn?.addEventListener("click", () => this.sendEchoPulse())
    mobileEchoBtn?.addEventListener("click", () => this.sendEchoPulse())

    const dpadButtons = document.querySelectorAll(".dpad-btn")
    dpadButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        const direction = btn.dataset.direction
        this.handleMobileMovement(direction)
      })
    })

    document.getElementById("pauseBtn")?.addEventListener("click", () => this.togglePause())
    document.getElementById("resumeBtn")?.addEventListener("click", () => this.togglePause())
    document.getElementById("restartLevelBtn")?.addEventListener("click", () => this.restartLevel())
    document.getElementById("backToDashboardBtn")?.addEventListener("click", () => {
      window.location.href = "dashboard.html"
    })
    document.getElementById("nextLevelBtn")?.addEventListener("click", () => this.loadNextLevel())
    document.getElementById("replayLevelBtn")?.addEventListener("click", () => this.restartLevel())
    document.getElementById("backToDashboard2Btn")?.addEventListener("click", () => {
      window.location.href = "dashboard.html"
    })
  }

  movePlayer(dx, dy) {
    if (this.gameState !== "playing") return
    const newX = this.player.x + dx
    const newY = this.player.y + dy
    if (this.isValidMove(newX, newY)) {
      this.player.x = newX
      this.player.y = newY
      this.addFootprint()
      this.updateVisibleTiles()
    }
  }

  handleMobileMovement(direction) {
    switch (direction) {
      case "up":
        this.movePlayer(0, -1)
        break
      case "down":
        this.movePlayer(0, 1)
        break
      case "left":
        this.movePlayer(-1, 0)
        break
      case "right":
        this.movePlayer(1, 0)
        break
    }
  }

  addFootprint() {
    this.footprints.push({ x: this.player.x, y: this.player.y, age: 0 })
    if (this.footprints.length > 10) this.footprints.shift()
  }

  gameLoop() {
    if (this.gameState === "playing") {
      this.update()
      this.render()
    }
    requestAnimationFrame(() => this.gameLoop())
  }

  update() {
    this.footprints.forEach((footprint) => footprint.age++)
    if (this.echoActive) {
      if (Date.now() - this.lastEchoTime > 3000) {
        this.echoActive = false
        this.updateVisibleTiles()
      }
    }
    this.checkStarCollection()
    this.checkLevelCompletion()
  }

  isValidMove(x, y) {
    if (x < 0 || x >= this.currentLevel.size.width || y < 0 || y >= this.currentLevel.size.height) return false
    if (this.currentLevel.maze[y][x] === 1) return false
    return true
  }

  sendEchoPulse() {
    if (this.echoUsesLeft <= 0 || this.gameState !== "playing") return
    this.echoUsesLeft--
    this.echoActive = true
    this.lastEchoTime = Date.now()
    this.echoPulseCount++

    document.getElementById("echoUsesLeft").textContent = this.echoUsesLeft
    const echoBtn = document.getElementById("echoPulseBtn")
    const mobileEchoBtn = document.getElementById("mobileEchoBtn")
    echoBtn?.classList.add("pulsing")
    mobileEchoBtn?.classList.add("pulsing")

    setTimeout(() => {
      echoBtn?.classList.remove("pulsing")
      mobileEchoBtn?.classList.remove("pulsing")
    }, 600)

    this.updateVisibleTiles(true)
  }

  updateVisibleTiles(isEcho = false) {
    this.visibleTiles.clear()
    const echoRange = isEcho ? 15 : 2

    for (let dy = -echoRange; dy <= echoRange; dy++) {
      for (let dx = -echoRange; dx <= echoRange; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance <= echoRange) {
          const tileX = this.player.x + dx
          const tileY = this.player.y + dy
          if (
            tileX >= 0 &&
            tileX < this.currentLevel.size.width &&
            tileY >= 0 &&
            tileY < this.currentLevel.size.height
          ) {
            this.visibleTiles.add(`${tileX},${tileY}`)
          }
        }
      }
    }
  }

  checkStarCollection() {
    for (const star of this.currentLevel.stars) {
      if (!star.collected && star.x === this.player.x && star.y === this.player.y) {
        star.collected = true
        this.collectedStars++
        document.getElementById("starsCollected").textContent = this.collectedStars
      }
    }
  }

  checkLevelCompletion() {
    if (this.player.x === this.currentLevel.exit.x && this.player.y === this.currentLevel.exit.y) {
      this.completeLevel()
    }
  }

  completeLevel() {
    this.gameState = "completed"
    const completionTime = Date.now() - this.startTime
    const stars = this.calculateStars()
    window.authManager.completeLevel(
      this.currentLevel.id,
      stars,
      Math.floor(completionTime / 1000),
      this.echoPulseCount,
    )
    this.showLevelCompleteModal(stars, completionTime)
  }

  calculateStars() {
    let stars = 1
    if (this.collectedStars === this.totalStars) stars++
    if (this.echoUsesLeft > 0) stars++
    return Math.min(stars, 3)
  }

  showLevelCompleteModal(stars, completionTime) {
    const modal = document.getElementById("levelCompleteModal")
    const starDisplay = "⭐".repeat(stars) + "☆".repeat(3 - stars)
    document.getElementById("completionStars").textContent = `${stars}/3 ${starDisplay}`
    document.getElementById("completionTime").textContent = this.formatTime(completionTime)
    document.getElementById("completionPulses").textContent = this.echoPulseCount

    const storyElement = document.getElementById("storySnippet")
    storyElement.innerHTML = `<h4>Level ${this.currentLevel.id} Complete!</h4><p>You've successfully navigated through the maze. ${stars === 3 ? "Perfect performance!" : stars === 2 ? "Great job!" : "Well done!"}</p>`
    storyElement.style.display = "block"

    const nextLevelBtn = document.getElementById("nextLevelBtn")
    if (this.currentLevel.id < 20) {
      nextLevelBtn.style.display = "block"
      nextLevelBtn.textContent = "Next Level"
    } else {
      nextLevelBtn.style.display = "block"
      nextLevelBtn.textContent = "Game Complete!"
      nextLevelBtn.onclick = () => {
        alert("Congratulations! You've completed all 20 levels of Echo Maze!")
        window.location.href = "dashboard.html"
      }
    }
    modal.classList.add("active")
  }

  render() {
    this.ctx.fillStyle = "#121212"
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.renderMaze()
    this.renderFootprints()
    this.renderStars()
    this.renderPlayer()
    this.renderExit()
    if (this.echoActive) this.renderEchoEffect()
  }

  renderMaze() {
    const maze = this.currentLevel.maze
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        const isVisible = this.visibleTiles.has(`${x},${y}`) || this.echoActive
        if (isVisible) {
          const screenX = x * this.scaledTileSize
          const screenY = y * this.scaledTileSize
          if (maze[y][x] === 1) {
            this.ctx.fillStyle = this.echoActive ? "#00FFE0" : "#333333"
            this.ctx.fillRect(screenX, screenY, this.scaledTileSize, this.scaledTileSize)
            this.ctx.strokeStyle = this.echoActive ? "#00FFFF" : "#555555"
            this.ctx.lineWidth = 1
            this.ctx.strokeRect(screenX, screenY, this.scaledTileSize, this.scaledTileSize)
          } else {
            this.ctx.fillStyle = this.echoActive ? "rgba(0, 255, 224, 0.1)" : "rgba(255, 255, 255, 0.05)"
            this.ctx.fillRect(screenX, screenY, this.scaledTileSize, this.scaledTileSize)
          }
        }
      }
    }
  }

  renderFootprints() {
    this.footprints.forEach((footprint) => {
      if (footprint.x === this.player.x && footprint.y === this.player.y) return
      const alpha = Math.max(0.1, 1 - footprint.age / 10)
      const screenX = footprint.x * this.scaledTileSize + this.scaledTileSize / 2
      const screenY = footprint.y * this.scaledTileSize + this.scaledTileSize / 2
      this.ctx.fillStyle = `rgba(0, 255, 224, ${alpha * 0.5})`
      this.ctx.beginPath()
      this.ctx.arc(screenX, screenY, this.scaledTileSize * 0.15, 0, Math.PI * 2)
      this.ctx.fill()
    })
  }

  renderStars() {
    for (const star of this.currentLevel.stars) {
      if (!star.collected) {
        const isVisible = this.visibleTiles.has(`${star.x},${star.y}`) || this.echoActive
        if (isVisible) {
          const screenX = star.x * this.scaledTileSize + this.scaledTileSize / 2
          const screenY = star.y * this.scaledTileSize + this.scaledTileSize / 2
          this.ctx.fillStyle = "#FFD700"
          this.ctx.font = `${this.scaledTileSize * 0.6}px Arial`
          this.ctx.textAlign = "center"
          this.ctx.textBaseline = "middle"
          this.ctx.fillText("⭐", screenX, screenY)
        }
      }
    }
  }

  renderPlayer() {
    const screenX = this.player.x * this.scaledTileSize + this.scaledTileSize / 2
    const screenY = this.player.y * this.scaledTileSize + this.scaledTileSize / 2
    this.ctx.fillStyle = "#00FFE0"
    this.ctx.beginPath()
    this.ctx.arc(screenX, screenY, this.scaledTileSize * 0.3, 0, Math.PI * 2)
    this.ctx.fill()
  }

  renderExit() {
    const exit = this.currentLevel.exit
    const isVisible = this.visibleTiles.has(`${exit.x},${exit.y}`) || this.echoActive
    if (isVisible) {
      const screenX = exit.x * this.scaledTileSize
      const screenY = exit.y * this.scaledTileSize
      this.ctx.fillStyle = "#FF4E8B"
      this.ctx.fillRect(screenX, screenY, this.scaledTileSize, this.scaledTileSize)
      const centerX = screenX + this.scaledTileSize / 2
      const centerY = screenY + this.scaledTileSize / 2
      this.ctx.strokeStyle = "#FFFFFF"
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.arc(centerX, centerY, this.scaledTileSize * 0.3, 0, Math.PI * 2)
      this.ctx.stroke()
    }
  }

  renderEchoEffect() {
    const centerX = this.player.x * this.scaledTileSize + this.scaledTileSize / 2
    const centerY = this.player.y * this.scaledTileSize + this.scaledTileSize / 2
    const elapsed = Date.now() - this.lastEchoTime
    const progress = elapsed / 3000
    if (progress < 1) {
      const maxRadius = 15 * this.scaledTileSize
      const currentRadius = maxRadius * progress
      this.ctx.strokeStyle = `rgba(0, 255, 224, ${1 - progress})`
      this.ctx.lineWidth = 3
      this.ctx.beginPath()
      this.ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2)
      this.ctx.stroke()
    }
  }

  togglePause() {
    if (this.gameState === "playing") {
      this.gameState = "paused"
      document.getElementById("pauseModal").classList.add("active")
    } else if (this.gameState === "paused") {
      this.gameState = "playing"
      document.getElementById("pauseModal").classList.remove("active")
    }
  }

  restartLevel() {
    document.getElementById("pauseModal").classList.remove("active")
    document.getElementById("levelCompleteModal").classList.remove("active")
    this.loadLevel(this.currentLevel.id)
  }

  loadNextLevel() {
    const nextLevelId = this.currentLevel.id + 1
    if (nextLevelId <= 20) {
      document.getElementById("levelCompleteModal").classList.remove("active")
      sessionStorage.setItem("selectedLevel", nextLevelId)
      this.loadLevel(nextLevelId)
    }
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.game = new EchoPulseGame()
})
