import { useEffect, useRef, useState } from 'react'
import { Agent, AgentType, ReasoningStep } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DataPacket {
  id: string
  fromAgent: AgentType | 'start'
  toAgent: AgentType
  progress: number
  data: string
  color: string
}

interface AgentCollaborationGraphProps {
  agents: Agent[]
  activeAgent?: AgentType | null
  reasoningSteps: ReasoningStep[]
  className?: string
}

const agentPositions: Record<AgentType | 'start', { x: number; y: number }> = {
  start: { x: 50, y: 250 },
  detector: { x: 250, y: 150 },
  analyzer: { x: 450, y: 150 },
  resolver: { x: 650, y: 150 },
  verifier: { x: 850, y: 150 }
}

const agentColors: Record<AgentType, string> = {
  detector: '#3b82f6',
  analyzer: '#8b5cf6',
  resolver: '#10b981',
  verifier: '#f59e0b'
}

export function AgentCollaborationGraph({
  agents,
  activeAgent,
  reasoningSteps,
  className
}: AgentCollaborationGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataPackets, setDataPackets] = useState<DataPacket[]>([])
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastStepCountRef = useRef(0)

  useEffect(() => {
    if (reasoningSteps.length > lastStepCountRef.current) {
      const latestStep = reasoningSteps[reasoningSteps.length - 1]
      const agentSequence: AgentType[] = ['detector', 'analyzer', 'resolver', 'verifier']
      const currentIndex = agentSequence.indexOf(latestStep.agentType)
      
      const newPacket: DataPacket = {
        id: `packet-${Date.now()}-${Math.random()}`,
        fromAgent: currentIndex === 0 ? 'start' : agentSequence[currentIndex - 1],
        toAgent: latestStep.agentType,
        progress: 0,
        data: latestStep.thought.length > 30 ? latestStep.thought.substring(0, 30) + '...' : latestStep.thought,
        color: agentColors[latestStep.agentType]
      }
      
      setDataPackets(prev => [...prev, newPacket])
      lastStepCountRef.current = reasoningSteps.length
    }
  }, [reasoningSteps])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    
    ctx.scale(dpr, dpr)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const animate = () => {
      ctx.clearRect(0, 0, rect.width, rect.height)

      drawConnections(ctx, agents, activeAgent)
      drawAgentNodes(ctx, agents, activeAgent)
      drawDataPackets(ctx, dataPackets, setDataPackets)

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [agents, activeAgent, dataPackets])

  return (
    <div className={cn("relative w-full h-[300px] bg-card rounded-lg border border-border overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      
      <div className="absolute top-4 left-4 space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Agent Collaboration Flow
        </div>
        <div className="flex items-center gap-4 text-xs">
          {agents.map(agent => (
            <div key={agent.id} className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: agentColors[agent.type] }}
              />
              <span className={cn(
                "capitalize transition-colors",
                agent.status === 'thinking' && "text-foreground font-semibold",
                agent.status === 'complete' && "text-muted-foreground",
                agent.status === 'idle' && "text-muted-foreground/50"
              )}>
                {agent.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
        {dataPackets.length > 0 && (
          <span>{dataPackets.length} data packets in transit</span>
        )}
      </div>
    </div>
  )
}

function drawConnections(
  ctx: CanvasRenderingContext2D,
  agents: Agent[],
  activeAgent?: AgentType | null
) {
  const agentSequence: AgentType[] = ['detector', 'analyzer', 'resolver', 'verifier']
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])

  for (let i = 0; i < agentSequence.length; i++) {
    const fromAgent = i === 0 ? 'start' : agentSequence[i - 1]
    const toAgent = agentSequence[i]
    
    const from = agentPositions[fromAgent]
    const to = agentPositions[toAgent]
    
    const agent = agents.find(a => a.type === toAgent)
    const isActive = agent?.status === 'thinking' || activeAgent === toAgent
    
    if (isActive) {
      ctx.strokeStyle = agentColors[toAgent]
      ctx.globalAlpha = 0.6
      ctx.lineWidth = 3
      ctx.setLineDash([])
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.globalAlpha = 1
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
    }

    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }
  
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

function drawAgentNodes(
  ctx: CanvasRenderingContext2D,
  agents: Agent[],
  activeAgent?: AgentType | null
) {
  const startPos = agentPositions['start']
  ctx.fillStyle = 'rgba(100, 100, 100, 0.5)'
  ctx.beginPath()
  ctx.arc(startPos.x, startPos.y, 15, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('START', startPos.x, startPos.y)

  agents.forEach(agent => {
    const pos = agentPositions[agent.type]
    const isActive = agent.status === 'thinking' || activeAgent === agent.type
    const isComplete = agent.status === 'complete'
    
    if (isActive) {
      const pulseRadius = 35 + Math.sin(Date.now() / 200) * 5
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 20, pos.x, pos.y, pulseRadius)
      gradient.addColorStop(0, `${agentColors[agent.type]}00`)
      gradient.addColorStop(0.5, `${agentColors[agent.type]}40`)
      gradient.addColorStop(1, `${agentColors[agent.type]}00`)
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, pulseRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = agentColors[agent.type]
    ctx.globalAlpha = isActive ? 1 : isComplete ? 0.7 : 0.3
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2)
    ctx.fill()
    
    if (isComplete && agent.confidence) {
      ctx.strokeStyle = agent.confidence >= 80 ? '#10b981' : '#f59e0b'
      ctx.lineWidth = 3
      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 28, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.fillStyle = '#ffffff'
    ctx.globalAlpha = 1
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const shortName = agent.type.substring(0, 3).toUpperCase()
    ctx.fillText(shortName, pos.x, pos.y - 3)
    
    if (agent.confidence) {
      ctx.font = '8px sans-serif'
      ctx.fillText(`${agent.confidence}%`, pos.x, pos.y + 8)
    }

    if (isActive) {
      ctx.fillStyle = agentColors[agent.type]
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('PROCESSING...', pos.x, pos.y + 45)
    }
  })
}

function drawDataPackets(
  ctx: CanvasRenderingContext2D,
  dataPackets: DataPacket[],
  setDataPackets: React.Dispatch<React.SetStateAction<DataPacket[]>>
) {
  const updatedPackets: DataPacket[] = []

  dataPackets.forEach(packet => {
    const from = agentPositions[packet.fromAgent]
    const to = agentPositions[packet.toAgent]
    
    const x = from.x + (to.x - from.x) * packet.progress
    const y = from.y + (to.y - from.y) * packet.progress
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8)
    gradient.addColorStop(0, packet.color)
    gradient.addColorStop(0.5, packet.color + '80')
    gradient.addColorStop(1, packet.color + '00')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = packet.color
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()

    const trailLength = 15
    for (let i = 1; i <= trailLength; i++) {
      const trailProgress = Math.max(0, packet.progress - i * 0.02)
      const trailX = from.x + (to.x - from.x) * trailProgress
      const trailY = from.y + (to.y - from.y) * trailProgress
      const trailAlpha = (1 - i / trailLength) * 0.3
      
      ctx.fillStyle = packet.color + Math.floor(trailAlpha * 255).toString(16).padStart(2, '0')
      ctx.beginPath()
      ctx.arc(trailX, trailY, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    packet.progress += 0.015

    if (packet.progress < 1) {
      updatedPackets.push(packet)
    }
  })

  if (updatedPackets.length !== dataPackets.length) {
    setDataPackets(updatedPackets)
  }
}
