class AuthManager {
  constructor() {
    this.currentUser = null
    this.init()
  }

  init() {
    const savedUser = localStorage.getItem("echoPulseUser")
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser)
      if (
        window.location.pathname.includes("index.html") ||
        window.location.pathname === "/" ||
        window.location.pathname === ""
      ) {
        window.location.href = "dashboard.html"
      }
    }
  }

  login(username) {
    if (!username || username.trim().length < 2) {
      throw new Error("Username must be at least 2 characters long")
    }
    const userData = this.loadUserData(username) || this.createNewUser(username)
    this.currentUser = userData
    localStorage.setItem("echoPulseUser", JSON.stringify(userData))
    return userData
  }

  createNewUser(username) {
    const newUser = {
      username: username.trim(),
      createdAt: Date.now(),
      lastLogin: Date.now(),
      stats: { levelsCompleted: 0, totalStars: 0, gamesPlayed: 0, bestTimes: {}, totalEchoPulses: 0 },
      progress: { currentLevel: 1, unlockedLevels: [1], levelStars: {} },
      settings: { colorTheme: "neon" },
    }
    localStorage.setItem(`echoPulseUser_${username}`, JSON.stringify(newUser))
    return newUser
  }

  loadUserData(username) {
    const userData = localStorage.getItem(`echoPulseUser_${username}`)
    if (userData) {
      const user = JSON.parse(userData)
      user.lastLogin = Date.now()
      localStorage.setItem(`echoPulseUser_${username}`, JSON.stringify(user))
      return user
    }
    return null
  }

  updateUserData(updates) {
    if (!this.currentUser) return
    this.currentUser = { ...this.currentUser, ...updates }
    localStorage.setItem("echoPulseUser", JSON.stringify(this.currentUser))
    localStorage.setItem(`echoPulseUser_${this.currentUser.username}`, JSON.stringify(this.currentUser))
  }

  completeLevel(levelId, stars, time, echoPulses) {
    if (!this.currentUser) return
    const currentStars = this.currentUser.progress.levelStars[levelId] || 0
    const newStars = Math.max(currentStars, stars)
    this.currentUser.progress.levelStars[levelId] = newStars

    const nextLevel = levelId + 1
    if (nextLevel <= 20 && !this.currentUser.progress.unlockedLevels.includes(nextLevel)) {
      this.currentUser.progress.unlockedLevels.push(nextLevel)
    }

    this.currentUser.progress.currentLevel = Math.max(this.currentUser.progress.currentLevel, levelId + 1)
    const completedLevels = Object.keys(this.currentUser.progress.levelStars).length
    const totalStars = Object.values(this.currentUser.progress.levelStars).reduce((sum, stars) => sum + stars, 0)

    this.currentUser.stats = {
      ...this.currentUser.stats,
      levelsCompleted: completedLevels,
      totalStars: totalStars,
      gamesPlayed: this.currentUser.stats.gamesPlayed + 1,
      totalEchoPulses: this.currentUser.stats.totalEchoPulses + echoPulses,
    }

    const currentBest = this.currentUser.stats.bestTimes[levelId]
    if (!currentBest || time < currentBest) {
      this.currentUser.stats.bestTimes[levelId] = time
    }
    this.updateUserData(this.currentUser)
  }

  updateSettings(settingsUpdates) {
    if (!this.currentUser) return
    this.currentUser.settings = { ...this.currentUser.settings, ...settingsUpdates }
    this.updateUserData({ settings: this.currentUser.settings })
  }

  logout() {
    this.currentUser = null
    localStorage.removeItem("echoPulseUser")
    window.location.href = "index.html"
  }

  resetProgress() {
    if (!this.currentUser) return
    const resetData = {
      stats: { levelsCompleted: 0, totalStars: 0, gamesPlayed: 0, bestTimes: {}, totalEchoPulses: 0 },
      progress: { currentLevel: 1, unlockedLevels: [1], levelStars: {} },
    }
    this.updateUserData(resetData)
  }

  getCurrentUser() {
    return this.currentUser
  }
  isLoggedIn() {
    return this.currentUser !== null
  }
}

window.authManager = new AuthManager()

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")
  const usernameInput = document.getElementById("username")

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const username = usernameInput.value.trim()
      try {
        window.authManager.login(username)
        const button = loginForm.querySelector(".btn-primary")
        button.innerHTML = "<span>Welcome, " + username + "!</span>"
        setTimeout(() => {
          window.location.href = "dashboard.html"
        }, 1000)
      } catch (error) {
        alert(error.message)
      }
    })
  }
})
