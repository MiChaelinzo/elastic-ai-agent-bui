import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Book, 
  MagnifyingGlass, 
  Sparkle, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Lightning,
  ChartBar,
  Tag,
  Calendar,
  FunnelSimple,
  CheckCircle
} from '@phosphor-icons/react'
import { formatDate } from '@/lib/utils'
import { 
  type KnowledgeArticle, 
  getKnowledgeBaseStats,
  searchKnowledgeBase 
} from '@/lib/knowledge-base'
import type { IncidentSeverity } from '@/lib/types'

interface KnowledgeBaseProps {
  articles: KnowledgeArticle[]
  onArticleSelect: (article: KnowledgeArticle) => void
  onViewArticle: (articleId: string) => void
  onRateArticle: (articleId: string, helpful: boolean) => void
  onGenerateFromIncident?: () => void
  isGenerating?: boolean
}

export function KnowledgeBase({
  articles,
  onArticleSelect,
  onViewArticle,
  onRateArticle,
  onGenerateFromIncident,
  isGenerating = false
}: KnowledgeBaseProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | 'all'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'views' | 'helpful'>('recent')

  const stats = useMemo(() => getKnowledgeBaseStats(articles), [articles])

  const filteredArticles = useMemo(() => {
    const filters = {
      category: filterCategory !== 'all' ? filterCategory : undefined,
      severity: filterSeverity !== 'all' ? filterSeverity : undefined
    }

    let results = searchKnowledgeBase(articles, searchQuery, filters)

    switch (sortBy) {
      case 'views':
        results.sort((a, b) => b.views - a.views)
        break
      case 'helpful':
        results.sort((a, b) => {
          const aScore = a.helpful / Math.max(1, a.helpful + a.notHelpful)
          const bScore = b.helpful / Math.max(1, b.helpful + b.notHelpful)
          return bScore - aScore
        })
        break
      case 'recent':
      default:
        results.sort((a, b) => b.createdAt - a.createdAt)
        break
    }

    return results
  }, [articles, searchQuery, filterCategory, filterSeverity, sortBy])

  const hasActiveFilters = searchQuery !== '' || filterCategory !== 'all' || filterSeverity !== 'all'

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilterCategory('all')
    setFilterSeverity('all')
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'incident': return 'bg-destructive text-destructive-foreground'
      case 'solution': return 'bg-success text-success-foreground'
      case 'procedure': return 'bg-primary text-primary-foreground'
      case 'troubleshooting': return 'bg-warning text-warning-foreground'
      case 'best-practice': return 'bg-accent text-accent-foreground'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground'
      case 'high': return 'bg-warning text-warning-foreground'
      case 'medium': return 'bg-primary text-primary-foreground'
      case 'low': return 'bg-muted text-muted-foreground'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Book size={28} weight="duotone" className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Knowledge Base</h2>
            <p className="text-sm text-muted-foreground">
              AI-generated articles from resolved incidents
            </p>
          </div>
        </div>
        {onGenerateFromIncident && (
          <Button 
            onClick={onGenerateFromIncident}
            disabled={isGenerating}
            size="lg"
          >
            <Sparkle size={20} className="mr-2" weight="bold" />
            {isGenerating ? 'Generating...' : 'Generate from Incident'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Articles</CardDescription>
            <CardTitle className="text-3xl">{stats.totalArticles}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Auto-generated:</span>
                <span className="font-semibold">{stats.autoGeneratedArticles}</span>
              </div>
              <div className="flex justify-between">
                <span>Manual:</span>
                <span className="font-semibold">{stats.manualArticles}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Views</CardDescription>
            <CardTitle className="text-3xl">{stats.totalViews.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Average: {Math.round(stats.totalViews / Math.max(1, stats.totalArticles))} per article
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Helpfulness Rating</CardDescription>
            <CardTitle className="text-3xl">
              {Math.round(stats.averageHelpfulness)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.averageHelpfulness} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Top Category</CardDescription>
            <CardTitle className="text-xl">
              {Object.entries(stats.articlesByCategory).length > 0 
                ? Object.entries(stats.articlesByCategory)
                    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'
                : 'N/A'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {Object.entries(stats.articlesByCategory).length} categories
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBar size={20} weight="duotone" />
            Articles by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.articlesByCategory).map(([category, count]) => {
              const percentage = (count / stats.totalArticles) * 100
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{category.replace('-', ' ')}</span>
                    <span className="font-semibold">{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlass 
              size={18} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
            />
            <Input
              placeholder="Search articles by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <FunnelSimple size={16} className="mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="incident">Incident</SelectItem>
            <SelectItem value="solution">Solution</SelectItem>
            <SelectItem value="procedure">Procedure</SelectItem>
            <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
            <SelectItem value="best-practice">Best Practice</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={(value) => setFilterSeverity(value as IncidentSeverity | 'all')}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Lightning size={16} className="mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'views' | 'helpful')}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="views">Most Viewed</SelectItem>
            <SelectItem value="helpful">Most Helpful</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          {filteredArticles.length === 0 ? (
            <Alert>
              <Book size={20} />
              <AlertDescription>
                {hasActiveFilters 
                  ? 'No articles match your search criteria.'
                  : 'No articles yet. Generate articles from resolved incidents to build your knowledge base.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArticles.map((article) => {
                const helpfulnessRating = article.helpful + article.notHelpful > 0
                  ? Math.round((article.helpful / (article.helpful + article.notHelpful)) * 100)
                  : null

                return (
                  <Card 
                    key={article.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => onArticleSelect(article)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge className={getCategoryColor(article.category)}>
                          {article.category.replace('-', ' ')}
                        </Badge>
                        {article.autoGenerated && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Sparkle size={12} />
                            AI
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg line-clamp-2">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {article.summary}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {article.severity && (
                          <Badge variant="outline" className={getSeverityColor(article.severity)}>
                            {article.severity}
                          </Badge>
                        )}
                        {article.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Tag size={12} className="mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {article.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{article.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between pt-0">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          {article.views}
                        </div>
                        {helpfulnessRating !== null && (
                          <div className="flex items-center gap-1">
                            <ThumbsUp size={14} />
                            {helpfulnessRating}%
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            onViewArticle(article.id)
                            onRateArticle(article.id, true)
                          }}
                        >
                          <ThumbsUp size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRateArticle(article.id, false)
                          }}
                        >
                          <ThumbsDown size={16} />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-3">
          {filteredArticles.length === 0 ? (
            <Alert>
              <Book size={20} />
              <AlertDescription>
                {hasActiveFilters 
                  ? 'No articles match your search criteria.'
                  : 'No articles yet. Generate articles from resolved incidents to build your knowledge base.'}
              </AlertDescription>
            </Alert>
          ) : (
            filteredArticles.map((article) => {
              const helpfulnessRating = article.helpful + article.notHelpful > 0
                ? Math.round((article.helpful / (article.helpful + article.notHelpful)) * 100)
                : null

              return (
                <Card 
                  key={article.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onArticleSelect(article)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getCategoryColor(article.category)}>
                                {article.category.replace('-', ' ')}
                              </Badge>
                              {article.severity && (
                                <Badge variant="outline" className={getSeverityColor(article.severity)}>
                                  {article.severity}
                                </Badge>
                              )}
                              {article.autoGenerated && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Sparkle size={12} />
                                  AI-Generated
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold">{article.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {article.summary}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye size={14} />
                            {article.views} views
                          </div>
                          {helpfulnessRating !== null && (
                            <div className="flex items-center gap-1">
                              <ThumbsUp size={14} />
                              {helpfulnessRating}% helpful
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(article.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle size={14} />
                            {article.createdBy}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {article.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onViewArticle(article.id)
                            onRateArticle(article.id, true)
                          }}
                        >
                          <ThumbsUp size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRateArticle(article.id, false)
                          }}
                        >
                          <ThumbsDown size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
