import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightning, Sparkle, ChartLine, Brain, Database, Play, Gear, Rocket } from '@phosphor-icons/react'

interface WelcomeScreenProps {
  onSelectMode: (mode: 'demo' | 'api') => void
}

const ANIMATION_DELAY = {
  logo: 0.1,
  title: 0.2,
  subtitle: 0.3,
  features: 0.4,
  cards: 0.6
}

export function WelcomeScreen({ onSelectMode }: WelcomeScreenProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const features = [
    {
      icon: Brain,
      title: 'Multi-Agent AI System',
      description: 'Intelligent agents collaborate to detect, analyze, and resolve incidents autonomously'
    },
    {
      icon: ChartLine,
      title: 'Predictive Analytics',
      description: 'ML-powered insights predict future incidents before they impact your systems'
    },
    {
      icon: Lightning,
      title: 'Automated Resolution',
      description: 'Execute workflows automatically with confidence-based human approval gates'
    },
    {
      icon: Sparkle,
      title: 'Real-Time Collaboration',
      description: 'Team chat, comments, and activity feeds for seamless incident coordination'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.45_0.20_200_/_0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,oklch(0.60_0.20_145_/_0.10),transparent_50%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl w-full relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: ANIMATION_DELAY.logo, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl mb-4 shadow-xl shadow-primary/30"
          >
            <Lightning size={48} weight="duotone" className="text-primary-foreground" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ANIMATION_DELAY.title }}
            className="text-5xl font-bold mb-3 bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent"
          >
            Welcome to Elastic Agent Orchestrator
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: ANIMATION_DELAY.subtitle }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-1"
          >
            AI-Powered DevOps Incident Response with Multi-Agent Intelligence
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: ANIMATION_DELAY.subtitle + 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-sm text-accent font-medium mt-2"
          >
            <Rocket size={16} weight="fill" />
            Get started in seconds
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ANIMATION_DELAY.features + index * 0.08 }}
            >
              <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <feature.icon size={24} weight="duotone" className="text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-sm">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: ANIMATION_DELAY.cards - 0.1 }}
          className="text-center mb-4"
        >
          <h2 className="text-2xl font-bold mb-2">Choose Your Starting Point</h2>
          <p className="text-muted-foreground text-sm">Select how you want to explore the platform</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAY.cards }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Card
            className={`cursor-pointer transition-all duration-300 bg-gradient-to-br from-card to-card/50 backdrop-blur border-2 ${
              hoveredCard === 'demo' 
                ? 'border-primary shadow-2xl shadow-primary/20 scale-105' 
                : 'border-border hover:border-primary/50'
            }`}
            onMouseEnter={() => setHoveredCard('demo')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onSelectMode('demo')}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Play size={28} weight="duotone" className="text-primary" />
                </div>
                <CardTitle className="text-2xl">Demo Mode</CardTitle>
              </div>
              <CardDescription className="text-base">
                Explore with sample data and simulated incidents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Sparkle size={16} weight="fill" className="text-accent mt-0.5 flex-shrink-0" />
                  <span>Pre-loaded sample incidents with historical data</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkle size={16} weight="fill" className="text-accent mt-0.5 flex-shrink-0" />
                  <span>Full access to all features and capabilities</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkle size={16} weight="fill" className="text-accent mt-0.5 flex-shrink-0" />
                  <span>No configuration required - start immediately</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkle size={16} weight="fill" className="text-accent mt-0.5 flex-shrink-0" />
                  <span>Perfect for learning and evaluation</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectMode('demo')
                }}
              >
                <Play size={20} weight="fill" className="mr-2" />
                Start Demo
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-300 bg-gradient-to-br from-card to-card/50 backdrop-blur border-2 ${
              hoveredCard === 'api' 
                ? 'border-accent shadow-2xl shadow-accent/20 scale-105' 
                : 'border-border hover:border-accent/50'
            }`}
            onMouseEnter={() => setHoveredCard('api')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onSelectMode('api')}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Database size={28} weight="duotone" className="text-accent" />
                </div>
                <CardTitle className="text-2xl">Connect Your Data</CardTitle>
              </div>
              <CardDescription className="text-base">
                Integrate with your Elasticsearch cluster
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Gear size={16} weight="fill" className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Connect to your Elasticsearch deployment</span>
                </div>
                <div className="flex items-start gap-2">
                  <Gear size={16} weight="fill" className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Work with real production incidents and metrics</span>
                </div>
                <div className="flex items-start gap-2">
                  <Gear size={16} weight="fill" className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Configure integrations (Slack, email, webhooks)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Gear size={16} weight="fill" className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Full control over your data and workflows</span>
                </div>
              </div>
              <Button 
                variant="outline"
                className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground" 
                size="lg"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectMode('api')
                }}
              >
                <Gear size={20} weight="duotone" className="mr-2" />
                Configure API
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: ANIMATION_DELAY.cards + 0.5 }}
          className="text-center mt-6 space-y-2"
        >
          <p className="text-sm text-muted-foreground">
            💡 You can switch between modes anytime from Settings
          </p>
          <p className="text-xs text-muted-foreground/70">
            No account required • Full feature access • Data stored locally
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
