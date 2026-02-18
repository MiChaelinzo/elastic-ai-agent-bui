import { useEffect, useRef } from 'react'

interface TrailPoint {
  x: number
  y: number
  age: number
  vx: number
  vy: number
}

export function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const trailPointsRef = useRef<TrailPoint[]>([])
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const lastUpdateRef = useRef(Date.now())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY }
      
      const now = Date.now()
      if (now - lastUpdateRef.current > 16) {
        trailPointsRef.current.push({
          x: e.clientX,
          y: e.clientY,
          age: 0,
          vx: 0,
          vy: 0
        })
        lastUpdateRef.current = now
      }
    }

    let lastFrameTime = 0
    const targetFPS = 30 // Limit to 30 FPS for better performance
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

      trailPointsRef.current = trailPointsRef.current.filter(point => {
        point.age += 1
        return point.age < 40 // Reduce trail length for performance
      })

      // Limit max trail points
      if (trailPointsRef.current.length > 40) {
        trailPointsRef.current = trailPointsRef.current.slice(-40)
      }

      trailPointsRef.current.forEach((point, index) => {
        const nextPoint = trailPointsRef.current[index + 1]
        
        if (nextPoint) {
          ctx.beginPath()
          ctx.moveTo(point.x, point.y)
          ctx.lineTo(nextPoint.x, nextPoint.y)
          
          const opacity = (1 - point.age / 40) * 0.5
          
          ctx.strokeStyle = `rgba(139, 170, 240, ${opacity})`
          ctx.lineWidth = 2 * (1 - point.age / 40)
          ctx.lineCap = 'round'
          ctx.stroke()
        }

        const size = 3 * (1 - point.age / 40)
        const opacity = (1 - point.age / 40) * 0.6
        
        ctx.beginPath()
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
        
        ctx.fillStyle = `rgba(139, 170, 240, ${opacity})`
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('mousemove', handleMouseMove)
    animationFrameId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  )
}
