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

    const animate = () => {
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      trailPointsRef.current = trailPointsRef.current.filter(point => {
        point.age += 1
        return point.age < 60
      })

      trailPointsRef.current.forEach((point, index) => {
        const nextPoint = trailPointsRef.current[index + 1]
        
        if (nextPoint) {
          const dx = nextPoint.x - point.x
          const dy = nextPoint.y - point.y
          
          ctx.beginPath()
          ctx.moveTo(point.x, point.y)
          ctx.lineTo(nextPoint.x, nextPoint.y)
          
          const opacity = (1 - point.age / 60) * 0.6
          const gradient = ctx.createLinearGradient(point.x, point.y, nextPoint.x, nextPoint.y)
          
          gradient.addColorStop(0, `rgba(139, 170, 240, ${opacity})`)
          gradient.addColorStop(1, `rgba(67, 207, 124, ${opacity * 0.8})`)
          
          ctx.strokeStyle = gradient
          ctx.lineWidth = 3 * (1 - point.age / 60)
          ctx.lineCap = 'round'
          ctx.stroke()
        }

        const size = 4 * (1 - point.age / 60)
        const opacity = (1 - point.age / 60) * 0.8
        
        ctx.beginPath()
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
        
        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size)
        gradient.addColorStop(0, `rgba(139, 170, 240, ${opacity})`)
        gradient.addColorStop(0.5, `rgba(103, 189, 170, ${opacity * 0.7})`)
        gradient.addColorStop(1, `rgba(67, 207, 124, ${opacity * 0.3})`)
        
        ctx.fillStyle = gradient
        ctx.shadowBlur = 10
        ctx.shadowColor = `rgba(139, 170, 240, ${opacity})`
        ctx.fill()
        ctx.shadowBlur = 0

        if (index % 8 === 0) {
          ctx.beginPath()
          ctx.arc(point.x, point.y, size * 2 + 5, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(139, 170, 240, ${opacity * 0.3})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      })

      if (trailPointsRef.current.length > 2) {
        const recentPoints = trailPointsRef.current.slice(-8)
        
        for (let i = 0; i < recentPoints.length - 1; i++) {
          for (let j = i + 2; j < recentPoints.length; j++) {
            const p1 = recentPoints[i]
            const p2 = recentPoints[j]
            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 50) {
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              const opacity = (1 - distance / 50) * 0.15 * (1 - p1.age / 60)
              ctx.strokeStyle = `rgba(139, 170, 240, ${opacity})`
              ctx.lineWidth = 1
              ctx.stroke()
            }
          }
        }
      }

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
