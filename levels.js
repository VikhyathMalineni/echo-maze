class LevelManager {
  constructor() {
    this.levels = this.generateLevels()
  }

  generateLevels() {
    const levels = {}
    const configs = [
      { size: 15, complexity: 0.3, starCount: 2 },
      { size: 17, complexity: 0.35, starCount: 2 },
      { size: 19, complexity: 0.4, starCount: 3 },
      { size: 21, complexity: 0.45, starCount: 3 },
      { size: 23, complexity: 0.5, starCount: 3 },
      { size: 25, complexity: 0.55, starCount: 3 },
      { size: 27, complexity: 0.6, starCount: 4 },
      { size: 29, complexity: 0.65, starCount: 4 },
      { size: 31, complexity: 0.7, starCount: 4 },
      { size: 33, complexity: 0.75, starCount: 5 },
      { size: 35, complexity: 0.8, starCount: 5 },
      { size: 37, complexity: 0.82, starCount: 5 },
      { size: 39, complexity: 0.84, starCount: 6 },
      { size: 41, complexity: 0.86, starCount: 6 },
      { size: 43, complexity: 0.88, starCount: 6 },
      { size: 45, complexity: 0.9, starCount: 7 },
      { size: 47, complexity: 0.91, starCount: 7 },
      { size: 49, complexity: 0.92, starCount: 8 },
      { size: 51, complexity: 0.93, starCount: 8 },
      { size: 53, complexity: 0.94, starCount: 9 },
    ]

    for (let i = 1; i <= 20; i++) {
      levels[i] = this.createLevel(i, configs[i - 1])
    }
    return levels
  }

  createLevel(levelId, config) {
    const { size, complexity, starCount } = config
    const startPositions = [
      { x: 1, y: 1 },
      { x: 1, y: size - 2 },
      { x: size - 2, y: 1 },
      { x: Math.floor(size / 4), y: 1 },
      { x: 1, y: Math.floor(size / 4) },
      { x: Math.floor(size / 2), y: 1 },
      { x: 1, y: Math.floor(size / 2) },
      { x: Math.floor((size * 3) / 4), y: 1 },
      { x: 1, y: Math.floor((size * 3) / 4) },
      { x: size - 2, y: Math.floor(size / 4) },
    ]
    const endPositions = [
      { x: size - 2, y: size - 2 },
      { x: size - 2, y: 1 },
      { x: 1, y: size - 2 },
      { x: Math.floor((size * 3) / 4), y: size - 2 },
      { x: size - 2, y: Math.floor((size * 3) / 4) },
      { x: Math.floor(size / 2), y: size - 2 },
      { x: size - 2, y: Math.floor(size / 2) },
      { x: Math.floor(size / 4), y: size - 2 },
      { x: size - 2, y: Math.floor(size / 4) },
      { x: Math.floor(size / 2), y: Math.floor(size / 2) },
    ]

    const start = startPositions[(levelId - 1) % startPositions.length]
    const end = endPositions[(levelId - 1) % endPositions.length]
    const maze = this.generateMaze(size, complexity, start, end, levelId)
    const stars = this.generateStars(size, starCount, maze, start, end, levelId)

    return {
      id: levelId,
      title: this.getLevelTitle(levelId),
      size: { width: size, height: size },
      playerStart: start,
      exit: end,
      stars: stars,
      maze: maze,
      difficulty: this.getDifficulty(levelId),
    }
  }

  generateMaze(size, complexity, start, end, seed) {
    const maze = Array(size)
      .fill()
      .map(() => Array(size).fill(1))
    const random = this.seededRandom(seed * 1000)
    const pathDensity = 0.3 + complexity * 0.4

    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        if (random() < pathDensity) maze[y][x] = 0
      }
    }

    maze[start.y][start.x] = 0
    maze[end.y][end.x] = 0

    if (seed % 3 === 0) this.createStraightPath(maze, start, end)
    else if (seed % 3 === 1) this.createZigzagPath(maze, start, end)
    else this.createSpiralPath(maze, start, end, size)

    for (let i = 0; i < size * complexity; i++) {
      const x = Math.floor(random() * (size - 2)) + 1
      const y = Math.floor(random() * (size - 2)) + 1
      maze[y][x] = 0
      if (x + 1 < size - 1) maze[y][x + 1] = 0
      if (y + 1 < size - 1) maze[y + 1][x] = 0
    }
    return maze
  }

  seededRandom(seed) {
    let x = Math.sin(seed) * 10000
    return () => {
      x = Math.sin(x) * 10000
      return x - Math.floor(x)
    }
  }

  createStraightPath(maze, start, end) {
    let x = start.x,
      y = start.y
    while (x !== end.x) {
      maze[y][x] = 0
      x += x < end.x ? 1 : -1
    }
    while (y !== end.y) {
      maze[y][x] = 0
      y += y < end.y ? 1 : -1
    }
    maze[end.y][end.x] = 0
  }

  createZigzagPath(maze, start, end) {
    let x = start.x,
      y = start.y,
      horizontal = true
    while (x !== end.x || y !== end.y) {
      maze[y][x] = 0
      if (horizontal && x !== end.x) {
        x += x < end.x ? 1 : -1
        if (Math.abs(x - end.x) % 5 === 0) horizontal = false
      } else if (!horizontal && y !== end.y) {
        y += y < end.y ? 1 : -1
        if (Math.abs(y - end.y) % 3 === 0) horizontal = true
      } else if (x !== end.x) {
        x += x < end.x ? 1 : -1
      } else if (y !== end.y) {
        y += y < end.y ? 1 : -1
      }
    }
    maze[end.y][end.x] = 0
  }

  createSpiralPath(maze, start, end, size) {
    const centerX = Math.floor(size / 2),
      centerY = Math.floor(size / 2)
    let x = start.x,
      y = start.y
    while (x !== centerX || y !== centerY) {
      maze[y][x] = 0
      if (x < centerX) x++
      else if (x > centerX) x--
      else if (y < centerY) y++
      else if (y > centerY) y--
    }
    while (x !== end.x || y !== end.y) {
      maze[y][x] = 0
      if (x < end.x) x++
      else if (x > end.x) x--
      else if (y < end.y) y++
      else if (y > end.y) y--
    }
    maze[end.y][end.x] = 0
  }

  generateStars(size, starCount, maze, start, end, seed) {
    const stars = []
    const random = this.seededRandom(seed * 2000)
    let attempts = 0

    while (stars.length < starCount && attempts < 1000) {
      const x = Math.floor(random() * (size - 2)) + 1
      const y = Math.floor(random() * (size - 2)) + 1

      if (
        maze[y][x] === 0 &&
        !(x === start.x && y === start.y) &&
        !(x === end.x && y === end.y) &&
        !stars.some((star) => Math.abs(star.x - x) < 3 && Math.abs(star.y - y) < 3)
      ) {
        if (this.isReachable(maze, start, { x, y }, size)) {
          stars.push({ x, y, collected: false })
        }
      }
      attempts++
    }
    return stars
  }

  isReachable(maze, start, target, size) {
    const visited = Array(size)
      .fill()
      .map(() => Array(size).fill(false))
    const queue = [start]
    visited[start.y][start.x] = true
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]

    while (queue.length > 0) {
      const current = queue.shift()
      if (current.x === target.x && current.y === target.y) return true

      for (const [dx, dy] of directions) {
        const newX = current.x + dx,
          newY = current.y + dy
        if (newX >= 0 && newX < size && newY >= 0 && newY < size && !visited[newY][newX] && maze[newY][newX] === 0) {
          visited[newY][newX] = true
          queue.push({ x: newX, y: newY })
        }
      }
    }
    return false
  }

  getLevelTitle(levelId) {
    if (levelId <= 5) return `Easy ${levelId}`
    if (levelId <= 10) return `Medium ${levelId - 5}`
    if (levelId <= 15) return `Hard ${levelId - 10}`
    return `Expert ${levelId - 15}`
  }

  getDifficulty(levelId) {
    if (levelId <= 5) return "easy"
    if (levelId <= 10) return "medium"
    if (levelId <= 15) return "hard"
    return "expert"
  }

  getLevel(levelId) {
    return this.levels[levelId]
  }
}

window.levelManager = new LevelManager()
