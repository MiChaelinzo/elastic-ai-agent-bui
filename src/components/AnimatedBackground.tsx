import { useEffect, useRef } from 'react'
import type { BackgroundSettings } from '@/lib/types'

interface AnimatedBackgroundProps {
  settings: BackgroundSettings
}

export function AnimatedBackground({ settings }: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let particles: Particle[] = []
    let nodes: Node[] = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
      initNodes()
    }

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      hue: number

      constructor() {
        if (!canvas) {
          this.x = 0
          this.y = 0
          this.vx = 0
          this.vy = 0
          this.size = 1
          this.opacity = 0.2
          this.hue = 200
          return
        }
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        const speedMultiplier = settings.particleSpeed / 100
        this.vx = (Math.random() - 0.5) * 0.3 * speedMultiplier
        this.vy = (Math.random() - 0.5) * 0.3 * speedMultiplier
        this.size = Math.random() * 2 + 0.5
        this.opacity = Math.random() * 0.5 + 0.2
        this.hue = Math.random() * 60 + 160
      }

      update() {
        if (!canvas) return
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, ${this.opacity})`
        ctx.fill()
      }
    }

    class Node {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      type: 'detector' | 'analyzer' | 'resolver' | 'verifier'
      pulsePhase: number
      connections: Node[]

      constructor(type: 'detector' | 'analyzer' | 'resolver' | 'verifier') {
        if (!canvas) {
          this.x = 0
          this.y = 0
          this.vx = 0
          this.vy = 0
          this.size = 4
          this.type = type
          this.pulsePhase = 0
          this.connections = []
          return
        }
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        const speedMultiplier = settings.nodeSpeed / 100
        this.vx = (Math.random() - 0.5) * 0.15 * speedMultiplier
        this.vy = (Math.random() - 0.5) * 0.15 * speedMultiplier
        this.size = 4
        this.type = type
        this.pulsePhase = Math.random() * Math.PI * 2
        this.connections = []
      }

      update() {
        if (!canvas) return
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1

        this.pulsePhase += 0.03
      }

      draw(time: number) {
        if (!ctx) return
        
        const colors = {
          detector: 'oklch(0.55 0.20 200)',
          analyzer: 'oklch(0.70 0.20 145)',
          resolver: 'oklch(0.75 0.15 75)',
          verifier: 'oklch(0.55 0.22 25)'
        }

        const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5
        const size = this.size + pulse * 2

        ctx.beginPath()
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2)
        ctx.fillStyle = colors[this.type]
        ctx.shadowBlur = 10 + pulse * 10
        ctx.shadowColor = colors[this.type]
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    const initParticles = () => {
      if (!canvas) return
      particles = []
      const baseParticleCount = Math.min(Math.floor((canvas.width * canvas.height) / 25000), 60)
      const densityMultiplier = settings.particleDensity / 100
      const particleCount = Math.floor(baseParticleCount * densityMultiplier)
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }
    }

    const initNodes = () => {
      nodes = []
      const types: ('detector' | 'analyzer' | 'resolver' | 'verifier')[] = ['detector', 'analyzer', 'resolver', 'verifier']
      
      types.forEach(type => {
        for (let i = 0; i < 3; i++) {
          nodes.push(new Node(type))
        }
      })
    }

    const drawConnections = () => {
      if (!ctx || !settings.showConnections) return
      
      nodes.forEach((node, i) => {
        nodes.slice(i + 1).forEach(otherNode => {
          const dx = otherNode.x - node.x
          const dy = otherNode.y - node.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 250) {
            const opacity = (1 - distance / 250) * 0.15
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(otherNode.x, otherNode.y)
            ctx.strokeStyle = `rgba(139, 170, 240, ${opacity})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        })
      })
    }

    const drawDataFlows = (time: number) => {
      if (!ctx || !settings.showDataFlows) return
      
      nodes.forEach((node, i) => {
        if (i % 3 === 0 && nodes[i + 1]) {
          const target = nodes[i + 1]
          const progress = (Math.sin(time * 0.001 + i) + 1) / 2
          const x = node.x + (target.x - node.x) * progress
          const y = node.y + (target.y - node.y) * progress

          ctx.beginPath()
          ctx.arc(x, y, 2, 0, Math.PI * 2)
          ctx.fillStyle = 'oklch(0.55 0.20 200)'
          ctx.shadowBlur = 8
          ctx.shadowColor = 'oklch(0.55 0.20 200)'
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })
    }

    const drawGrid = () => {
      if (!ctx || !settings.showGrid) return
      
      ctx.strokeStyle = 'rgba(139, 170, 240, 0.03)'
      ctx.lineWidth = 1

      const gridSize = 50

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    let lastFrameTime = 0
    const targetFPS = 20 // Limit to 20 FPS for better performance
    const frameInterval = 1000 / targetFPS

    const animate = (time: number) => {
      if (!ctx) return

      // Throttle to target FPS
      if (time - lastFrameTime < frameInterval) {
        animationFrameId = requestAnimationFrame(animate)
        return
      }
      lastFrameTime = time

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      drawGrid()

      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      drawConnections()

      nodes.forEach(node => {
        node.update()
        node.draw(time)
      })

      drawDataFlows(time)

      animationFrameId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    animationFrameId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [settings])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
