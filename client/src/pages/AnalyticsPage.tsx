import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Users, MessageSquare, TrendingUp, DollarSign, Globe, Clock } from "lucide-react";
import { Link } from "wouter";

interface AnalyticsData {
  leads: {
    total: number;
    budgetDistribution: Record<string, number>;
    experienceDistribution: Record<string, number>;
    locationDistribution: Record<string, number>;
    timelineDistribution: Record<string, number>;
  };
  conversations: {
    totalSessions: number;
    totalMessages: number;
    avgMessagesPerSession: number;
    conversionRate: number;
  };
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif font-semibold text-xl">Analytics Dashboard</h1>
              <p className="text-xs text-muted-foreground">Lead & conversation insights</p>
            </div>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* Overview Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.leads.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Qualified prospects captured
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.conversations.totalSessions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.conversations.totalMessages} total messages
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.conversations.conversionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sessions to leads
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.conversations.avgMessagesPerSession}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Messages per session
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Budget Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Distribution
              </CardTitle>
              <CardDescription>Investment budgets of captured leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.leads.budgetDistribution).map(([budget, count]) => {
                  const percentage = analytics.leads.total > 0 
                    ? (count / analytics.leads.total) * 100 
                    : 0;
                  return (
                    <div key={budget} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{budget}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{count} leads</span>
                          <Badge variant="secondary">{Math.round(percentage)}%</Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Investment Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Investment Experience
                </CardTitle>
                <CardDescription>Lead experience levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.leads.experienceDistribution).map(([exp, count]) => (
                    <div key={exp} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{exp.replace('-', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location Preference */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Location Preferences
                </CardTitle>
                <CardDescription>Where leads want to invest</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.leads.locationDistribution).map(([location, count]) => (
                    <div key={location} className="flex items-center justify-between">
                      <span className="text-sm">{location}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Timeline Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Investment Timelines
                </CardTitle>
                <CardDescription>When leads plan to invest</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.leads.timelineDistribution).map(([timeline, count]) => (
                    <div key={timeline} className="flex items-center justify-between">
                      <span className="text-sm">{timeline}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights & Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
              <CardDescription>Data-driven recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.conversations.conversionRate > 20 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Strong Conversion Rate
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Your {analytics.conversations.conversionRate}% conversion rate is excellent. Continue focusing on high-intent visitors.
                    </p>
                  </div>
                </div>
              )}

              {analytics.conversations.avgMessagesPerSession > 5 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      High Engagement
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Users are highly engaged with {analytics.conversations.avgMessagesPerSession} messages per session on average.
                    </p>
                  </div>
                </div>
              )}

              {Object.keys(analytics.leads.budgetDistribution).length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                  <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      Budget Diversity
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      You're attracting investors across {Object.keys(analytics.leads.budgetDistribution).length} different budget ranges.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
