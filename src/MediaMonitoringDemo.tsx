import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from "recharts";
import { AlertTriangle, Bell, Download, FileText, Filter, Globe2, Layers, ListFilter, Search, Share2, Users, Plus, X, Settings, Save, Play, TrendingUp, TrendingDown, Hash, Eye, Clock, Target, Zap, Brain, Lightbulb, CheckCircle, AlertCircle, BarChart3, PieChart as PieChartIcon, Calendar, Loader2, ArrowRight, Minus, Shield, Siren, MapPin, UserCheck, Timer, Phone, Mail, MessageSquare, Activity, Flame, Star, Award, DollarSign, ThumbsUp, Heart, Instagram, Linkedin, Youtube, Video } from "lucide-react";

// ------------------------------
// TYPES & INTERFACES
// ------------------------------
interface QueryCondition {
  id: string;
  type: 'keyword' | 'phrase' | 'exclude' | 'domain' | 'author';
  operator: 'AND' | 'OR' | 'NOT';
  value: string;
}

interface AlertRule {
  id: string;
  name: string;
  tracker_id: string;
  condition: 'volume_spike' | 'sentiment_drop' | 'new_influencer' | 'keyword_trend';
  threshold: number;
  timeframe: '15m' | '1h' | '3h' | '24h';
  severity: 'low' | 'medium' | 'high';
  channels: ('email' | 'slack' | 'webhook')[];
  enabled: boolean;
}

interface Topic {
  id: string;
  name: string;
  keywords: string[];
  mentions_7d: number;
  change_7d: number; // percentage change
  sentiment_score: number;
  trending: 'up' | 'down' | 'stable';
  category: 'product' | 'service' | 'brand' | 'crisis' | 'campaign' | 'competitor';
}

interface TopicTimeline {
  date: string;
  [topicId: string]: string | number;
}

interface TrendingKeyword {
  keyword: string;
  mentions_24h: number;
  change_24h: number;
  sentiment: 'pos' | 'neu' | 'neg';
  first_seen: string;
  peak_hour: string;
}

interface EmergingTopic {
  id: string;
  name: string;
  keywords: string[];
  first_detected: string;
  mentions_count: number;
  growth_rate: number; // mentions per hour
  related_to: string[]; // related existing topics
  confidence_score: number; // 0-1, how confident we are this is a real trend
}

interface AutoBrief {
  id: string;
  period: string; // e.g., "2025-08-13 to 2025-08-19"
  generated_at: string;
  tracker_id: string;
  summary: {
    total_mentions: number;
    sentiment_shift: number;
    top_topics: string[];
    crisis_level: 'low' | 'medium' | 'high';
  };
  insights: {
    id: string;
    category: 'positive' | 'negative' | 'neutral' | 'opportunity' | 'risk';
    title: string;
    description: string;
    confidence: number;
    impact_level: 'low' | 'medium' | 'high';
  }[];
  recommendations: {
    id: string;
    priority: 'high' | 'medium' | 'low';
    action: string;
    description: string;
    estimated_effort: string;
    expected_impact: string;
  }[];
  key_metrics: {
    mentions_change: number;
    sentiment_change: number;
    reach_change: number;
    engagement_change: number;
  };
}

interface CrisisEvent {
  id: string;
  title: string;
  description: string;
  detected_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'monitoring' | 'resolved' | 'escalated';
  crisis_score: number; // 0-100
  tracker_id: string;
  triggers: {
    volume_spike: boolean;
    sentiment_drop: boolean;
    negative_keywords: boolean;
    influencer_amplification: boolean;
    geographic_spread: boolean;
  };
  metrics: {
    mentions_1h: number;
    mentions_24h: number;
    sentiment_score: number;
    reach_estimate: number;
    engagement_rate: number;
  };
  timeline: {
    timestamp: string;
    event: string;
    type: 'detection' | 'escalation' | 'response' | 'resolution';
    details: string;
  }[];
  assigned_to?: string;
  response_actions: {
    id: string;
    action: string;
    status: 'pending' | 'in_progress' | 'completed';
    assigned_to: string;
    due_date: string;
  }[];
}

interface CrisisPlaybook {
  id: string;
  name: string;
  crisis_type: 'product_issue' | 'service_failure' | 'pr_incident' | 'competitor_attack' | 'regulatory_issue';
  severity_threshold: number;
  response_team: string[];
  communication_templates: {
    internal: string;
    external: string;
    social_media: string;
    press_release: string;
  };
  escalation_rules: {
    level: number;
    threshold_score: number;
    notify: string[];
    timeline: string;
  }[];
}

interface Competitor {
  id: string;
  name: string;
  brand: string;
  category: string;
  website: string;
  social_handles: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
  market_position: 'leader' | 'challenger' | 'follower' | 'niche';
  is_tracked: boolean;
}

interface CompetitiveMetrics {
  competitor_id: string;
  timeframe: string;
  mentions: number;
  sentiment_score: number;
  share_of_voice: number;
  engagement_rate: number;
  reach_estimate: number;
  top_keywords: string[];
  trend_direction: 'up' | 'down' | 'stable';
  trend_percentage: number;
}

interface MarketInsight {
  id: string;
  title: string;
  type: 'opportunity' | 'threat' | 'trend' | 'gap';
  severity: 'high' | 'medium' | 'low';
  description: string;
  competitors_involved: string[];
  recommended_actions: string[];
  created_at: string;
}

interface ContentRecommendation {
  id: string;
  title: string;
  content_type: 'article' | 'video' | 'infographic' | 'social_post' | 'whitepaper' | 'case_study';
  recommended_platform: string[];
  target_audience: string;
  predicted_engagement: number;
  predicted_reach: number;
  confidence_score: number;
  topic_relevance: number;
  optimal_timing: {
    best_day: string;
    best_hour: string;
    timezone: string;
  };
  content_outline: string[];
  keywords_to_include: string[];
  hashtags_suggested: string[];
  tone: 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational';
  content_gaps_addressed: string[];
  generated_at: string;
}

interface ContentGap {
  id: string;
  gap_type: 'topic' | 'format' | 'audience' | 'platform' | 'timing';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  opportunity_score: number;
  competitor_coverage: {
    competitor_name: string;
    coverage_level: 'high' | 'medium' | 'low' | 'none';
  }[];
  recommended_action: string;
  potential_impact: string;
}

interface AudienceInsight {
  id: string;
  segment_name: string;
  demographic: {
    age_range: string;
    gender_split: { male: number; female: number; other: number };
    location: string[];
    interests: string[];
  };
  behavior_patterns: {
    active_hours: string[];
    preferred_platforms: string[];
    content_preferences: string[];
    engagement_style: string;
  };
  sentiment_towards_brand: number;
  influence_score: number;
  growth_potential: 'high' | 'medium' | 'low';
  content_suggestions: string[];
}

interface Influencer {
  id: string;
  name: string;
  username: string;
  profile_image: string;
  category: 'tech' | 'business' | 'lifestyle' | 'gaming' | 'beauty' | 'fitness' | 'food';
  tier: 'nano' | 'micro' | 'macro' | 'mega';
  platforms: {
    platform: string;
    handle: string;
    followers: number;
    engagement_rate: number;
    avg_likes: number;
    avg_comments: number;
  }[];
  demographics: {
    age_range: string;
    gender_split: { male: number; female: number; other: number };
    top_locations: string[];
  };
  content_metrics: {
    total_posts: number;
    avg_engagement_rate: number;
    reach_estimate: number;
    brand_mentions: number;
    sentiment_score: number;
  };
  brand_safety: {
    authenticity_score: number;
    controversy_risk: 'low' | 'medium' | 'high';
    content_quality: number;
    brand_alignment: number;
  };
  collaboration_history: {
    total_collaborations: number;
    brands_worked_with: string[];
    avg_campaign_performance: number;
    last_collaboration: string;
  };
  contact_info: {
    email?: string;
    manager?: string;
    rates: {
      post: number;
      story: number;
      reel: number;
    };
  };
  tracking_status: 'tracked' | 'potential' | 'contacted' | 'contracted';
}

interface InfluencerCampaign {
  id: string;
  name: string;
  campaign_type: 'product_launch' | 'brand_awareness' | 'user_acquisition' | 'engagement';
  status: 'planned' | 'active' | 'completed' | 'paused';
  start_date: string;
  end_date: string;
  budget: number;
  target_metrics: {
    impressions: number;
    engagement: number;
    conversions: number;
    reach: number;
  };
  actual_metrics: {
    impressions: number;
    engagement: number;
    conversions: number;
    reach: number;
    roi: number;
  };
  influencers: {
    influencer_id: string;
    agreed_rate: number;
    deliverables: string[];
    performance: {
      impressions: number;
      engagement: number;
      conversions: number;
      cost_per_engagement: number;
    };
  }[];
  content_requirements: {
    post_count: number;
    story_count: number;
    reel_count: number;
    required_hashtags: string[];
    brand_mentions: string[];
  };
}

interface InfluencerInsight {
  id: string;
  title: string;
  type: 'opportunity' | 'performance' | 'trend' | 'risk';
  severity: 'high' | 'medium' | 'low';
  description: string;
  influencer_involved: string[];
  recommended_actions: string[];
  potential_impact: string;
  created_at: string;
}

// ------------------------------
// DUMMY DATA (JSON) — demo-ready
// ------------------------------
export const demoData = {
  organization: { id: "org-001", name: "Contoso Brands", region: "ID" },
  trackers: [
    {
      id: "trk-001",
      name: "Brand Main — Indonesia",
      query: "(\"Contoso\" OR \"Contoso Brand\") AND lang:id NOT (lowongan)",
      filters: { type: ["news", "social", "video"], country: ["ID"], sentiment: "all" },
      kpi: { mentions_7d: 4821, alerts_24h: 4, sov_7d: 42.7, sentiment_score: 0.21 },
    },
    {
      id: "trk-002",
      name: "Competitor A — Indonesia",
      query: "(\"Fabrikam\" OR \"Fabrikam Corp\") AND lang:id",
      filters: { type: ["news", "social"], country: ["ID"], sentiment: "all" },
      kpi: { mentions_7d: 3980, alerts_24h: 2, sov_7d: 35.2, sentiment_score: -0.03 },
    },
    {
      id: "trk-003",
      name: "Crisis Watch — Supply Chain",
      query: "(\"Contoso\" AND (macet OR keterlambatan OR stok) ) AND lang:id",
      filters: { type: ["news", "forum"], country: ["ID"], sentiment: "neg" },
      kpi: { mentions_7d: 312, alerts_24h: 1, sov_7d: 22.1, sentiment_score: -0.35 },
    },
  ],
  volumeTimeline: [
    { date: "2025-08-06", contoso: 280, fabrikam: 210, northwind: 120 },
    { date: "2025-08-07", contoso: 320, fabrikam: 190, northwind: 150 },
    { date: "2025-08-08", contoso: 360, fabrikam: 200, northwind: 170 },
    { date: "2025-08-09", contoso: 410, fabrikam: 240, northwind: 160 },
    { date: "2025-08-10", contoso: 380, fabrikam: 260, northwind: 180 },
    { date: "2025-08-11", contoso: 420, fabrikam: 270, northwind: 190 },
    { date: "2025-08-12", contoso: 460, fabrikam: 300, northwind: 200 },
    { date: "2025-08-13", contoso: 430, fabrikam: 310, northwind: 210 },
    { date: "2025-08-14", contoso: 470, fabrikam: 320, northwind: 220 },
    { date: "2025-08-15", contoso: 490, fabrikam: 340, northwind: 230 },
    { date: "2025-08-16", contoso: 510, fabrikam: 360, northwind: 250 },
    { date: "2025-08-17", contoso: 540, fabrikam: 370, northwind: 260 },
    { date: "2025-08-18", contoso: 520, fabrikam: 380, northwind: 270 },
    { date: "2025-08-19", contoso: 628, fabrikam: 410, northwind: 295 },
  ],
  sentimentTimeline: [
    { date: "2025-08-06", pos: 32, neu: 51, neg: 17 },
    { date: "2025-08-07", pos: 29, neu: 56, neg: 15 },
    { date: "2025-08-08", pos: 34, neu: 50, neg: 16 },
    { date: "2025-08-09", pos: 37, neu: 48, neg: 15 },
    { date: "2025-08-10", pos: 35, neu: 49, neg: 16 },
    { date: "2025-08-11", pos: 38, neu: 47, neg: 15 },
    { date: "2025-08-12", pos: 40, neu: 45, neg: 15 },
    { date: "2025-08-13", pos: 39, neu: 46, neg: 15 },
    { date: "2025-08-14", pos: 41, neu: 44, neg: 15 },
    { date: "2025-08-15", pos: 42, neu: 43, neg: 15 },
    { date: "2025-08-16", pos: 44, neu: 42, neg: 14 },
    { date: "2025-08-17", pos: 46, neu: 40, neg: 14 },
    { date: "2025-08-18", pos: 45, neu: 41, neg: 14 },
    { date: "2025-08-19", pos: 48, neu: 38, neg: 14 },
  ],
  shareOfVoice7d: [
    { name: "Contoso", value: 42.7 },
    { name: "Fabrikam", value: 35.2 },
    { name: "Northwind", value: 22.1 },
  ],
  topDomains: [
    { domain: "kompas.com", mentions: 312 },
    { domain: "detik.com", mentions: 287 },
    { domain: "tempo.co", mentions: 198 },
    { domain: "cnbcindonesia.com", mentions: 160 },
    { domain: "kontan.co.id", mentions: 152 },
  ],
  topInfluencers: [
    { handle: "@techdailyID", platform: "X", er: 0.042, followers: 540000 },
    { handle: "@marketingnusantara", platform: "Instagram", er: 0.028, followers: 310000 },
    { handle: "@bisnisupdate", platform: "X", er: 0.031, followers: 420000 },
  ],
  alerts: [
    {
      id: "al-1001",
      type: "Spike",
      fired_at: "2025-08-19T07:42:00+07:00",
      tracker_id: "trk-001",
      rule: "count(mentions[60m]) > 3 * avg(mentions[7d same hour])",
      severity: "high",
      message: "Lonjakan penyebutan terkait kampanye #ContosoFestival",
    },
    {
      id: "al-1002",
      type: "SentimentDrop",
      fired_at: "2025-08-18T22:10:00+07:00",
      tracker_id: "trk-003",
      rule: "sentiment_mean[3h] - sentiment_mean[72h] < -0.25",
      severity: "medium",
      message: "Keluhan keterlambatan pengiriman meningkat di forum",
    },
    {
      id: "al-1003",
      type: "Influencer",
      fired_at: "2025-08-18T16:05:00+07:00",
      tracker_id: "trk-001",
      rule: "influencer_score > 0.85 AND brand_mention = true",
      severity: "low",
      message: "Influencer @techdailyID mengulas produk terbaru",
    },
  ],
  mentions: [
    {
      id: "m-0001",
      source_type: "news",
      domain: "kompas.com",
      url: "https://kompas.com/…",
      author: "Redaksi Kompas",
      title: "Contoso umumkan kemitraan logistik ramah lingkungan",
      content_snippet: "Inisiatif ini diprediksi mengurangi emisi dan mempercepat pengiriman…",
      posted_at: "2025-08-19T08:12:00+07:00",
      language: "id",
      sentiment: "pos",
      engagement: { shares: 180, comments: 76, likes: 420 },
    },
    {
      id: "m-0002",
      source_type: "social",
      domain: "twitter.com",
      url: "https://x.com/…",
      author: "@techdailyID",
      title: "Thread ulasan #ContosoPhone Pro",
      content_snippet: "Kamera lebih baik di low light, baterai tahan lama, harga kompetitif…",
      posted_at: "2025-08-19T07:55:00+07:00",
      language: "id",
      sentiment: "pos",
      engagement: { shares: 520, comments: 130, likes: 2200 },
    },
    {
      id: "m-0003",
      source_type: "forum",
      domain: "kaskus.co.id",
      url: "https://kaskus.co.id/…",
      author: "user12345",
      title: "Pengiriman Contoso telat seminggu, ada yang sama?",
      content_snippet: "Order tanggal 11 masih belum datang, CS responsnya lama…",
      posted_at: "2025-08-18T21:15:00+07:00",
      language: "id",
      sentiment: "neg",
      engagement: { shares: 3, comments: 24, likes: 11 },
    },
    {
      id: "m-0004",
      source_type: "video",
      domain: "youtube.com",
      url: "https://youtube.com/…",
      author: "Gadget Lokal",
      title: "Review jujur ContosoPhone Pro (Worth it?)",
      content_snippet: "Kelebihan: layar, baterai. Kekurangan: aksesori mahal…",
      posted_at: "2025-08-18T18:02:00+07:00",
      language: "id",
      sentiment: "neu",
      engagement: { shares: 90, comments: 210, likes: 3800 },
    },
    {
      id: "m-0005",
      source_type: "news",
      domain: "detik.com",
      url: "https://detik.com/…",
      author: "Redaksi Detik",
      title: "Promo #ContosoFestival dongkrak penjualan ritel",
      content_snippet: "Retailer melaporkan peningkatan 17% selama akhir pekan…",
      posted_at: "2025-08-17T10:30:00+07:00",
      language: "id",
      sentiment: "pos",
      engagement: { shares: 140, comments: 65, likes: 510 },
    },
  ],
  alertRules: [
    {
      id: "rule-001",
      name: "Volume Spike Detection",
      tracker_id: "trk-001",
      condition: "volume_spike",
      threshold: 300,
      timeframe: "1h",
      severity: "high",
      channels: ["email", "slack"],
      enabled: true,
    },
    {
      id: "rule-002", 
      name: "Sentiment Drop Alert",
      tracker_id: "trk-001",
      condition: "sentiment_drop",
      threshold: -0.3,
      timeframe: "3h",
      severity: "medium",
      channels: ["email"],
      enabled: true,
    },
    {
      id: "rule-003",
      name: "New Influencer Mention",
      tracker_id: "trk-001", 
      condition: "new_influencer",
      threshold: 50000,
      timeframe: "24h",
      severity: "low",
      channels: ["slack"],
      enabled: false,
    },
  ] as AlertRule[],
  
  // Topic Modeling & Trends Data
  topics: [
    {
      id: "topic-001",
      name: "Smartphone Camera",
      keywords: ["kamera", "foto", "low light", "night mode", "portrait"],
      mentions_7d: 1247,
      change_7d: 23.5,
      sentiment_score: 0.42,
      trending: "up",
      category: "product"
    },
    {
      id: "topic-002", 
      name: "Delivery Issues",
      keywords: ["pengiriman", "telat", "delay", "logistik", "ekspedisi"],
      mentions_7d: 892,
      change_7d: -15.2,
      sentiment_score: -0.67,
      trending: "down",
      category: "service"
    },
    {
      id: "topic-003",
      name: "Festival Campaign",
      keywords: ["festival", "promo", "diskon", "sale", "event"],
      mentions_7d: 2156,
      change_7d: 87.3,
      sentiment_score: 0.58,
      trending: "up",
      category: "campaign"
    },
    {
      id: "topic-004",
      name: "Battery Life",
      keywords: ["baterai", "battery", "tahan lama", "charging", "power"],
      mentions_7d: 734,
      change_7d: 5.8,
      sentiment_score: 0.31,
      trending: "stable",
      category: "product"
    },
    {
      id: "topic-005",
      name: "Customer Service",
      keywords: ["customer service", "cs", "bantuan", "support", "layanan"],
      mentions_7d: 567,
      change_7d: -8.3,
      sentiment_score: -0.23,
      trending: "down",
      category: "service"
    },
    {
      id: "topic-006",
      name: "Competitor Comparison",
      keywords: ["vs", "compare", "bandingkan", "competitor", "rival"],
      mentions_7d: 423,
      change_7d: 12.7,
      sentiment_score: 0.15,
      trending: "up",
      category: "competitor"
    }
  ] as Topic[],
  
  topicTimeline: [
    { date: "2025-08-13", "topic-001": 89, "topic-002": 134, "topic-003": 156, "topic-004": 67, "topic-005": 78, "topic-006": 45 },
    { date: "2025-08-14", "topic-001": 95, "topic-002": 128, "topic-003": 189, "topic-004": 71, "topic-005": 82, "topic-006": 48 },
    { date: "2025-08-15", "topic-001": 112, "topic-002": 115, "topic-003": 234, "topic-004": 89, "topic-005": 73, "topic-006": 56 },
    { date: "2025-08-16", "topic-001": 134, "topic-002": 98, "topic-003": 278, "topic-004": 92, "topic-005": 67, "topic-006": 61 },
    { date: "2025-08-17", "topic-001": 156, "topic-002": 89, "topic-003": 312, "topic-004": 98, "topic-005": 61, "topic-006": 67 },
    { date: "2025-08-18", "topic-001": 178, "topic-002": 76, "topic-003": 345, "topic-004": 103, "topic-005": 58, "topic-006": 72 },
    { date: "2025-08-19", "topic-001": 201, "topic-002": 71, "topic-003": 387, "topic-004": 108, "topic-005": 55, "topic-006": 78 }
  ] as TopicTimeline[],
  
  trendingKeywords: [
    {
      keyword: "#ContosoFestival",
      mentions_24h: 1547,
      change_24h: 234.5,
      sentiment: "pos",
      first_seen: "2025-08-19T06:30:00+07:00",
      peak_hour: "2025-08-19T14:00:00+07:00"
    },
    {
      keyword: "night mode",
      mentions_24h: 892,
      change_24h: 78.3,
      sentiment: "pos", 
      first_seen: "2025-08-18T20:15:00+07:00",
      peak_hour: "2025-08-19T09:00:00+07:00"
    },
    {
      keyword: "keterlambatan",
      mentions_24h: 634,
      change_24h: -23.7,
      sentiment: "neg",
      first_seen: "2025-08-18T15:45:00+07:00", 
      peak_hour: "2025-08-18T22:00:00+07:00"
    },
    {
      keyword: "wireless charging",
      mentions_24h: 445,
      change_24h: 156.8,
      sentiment: "pos",
      first_seen: "2025-08-19T08:20:00+07:00",
      peak_hour: "2025-08-19T13:30:00+07:00"
    },
    {
      keyword: "cashback",
      mentions_24h: 789,
      change_24h: 89.2,
      sentiment: "pos",
      first_seen: "2025-08-19T07:00:00+07:00",
      peak_hour: "2025-08-19T12:00:00+07:00"
    }
  ] as TrendingKeyword[],
  
  emergingTopics: [
    {
      id: "emerging-001",
      name: "AI Photography Features",
      keywords: ["AI foto", "smart camera", "auto enhance", "AI mode"],
      first_detected: "2025-08-19T10:15:00+07:00",
      mentions_count: 234,
      growth_rate: 12.5,
      related_to: ["Smartphone Camera"],
      confidence_score: 0.78
    },
    {
      id: "emerging-002", 
      name: "Environmental Packaging",
      keywords: ["eco packaging", "ramah lingkungan", "sustainable", "green"],
      first_detected: "2025-08-19T08:45:00+07:00",
      mentions_count: 167,
      growth_rate: 8.3,
      related_to: ["Festival Campaign"],
      confidence_score: 0.65
    },
    {
      id: "emerging-003",
      name: "Gaming Performance",
      keywords: ["gaming", "fps", "performance", "mobile gaming", "grafis"],
      first_detected: "2025-08-19T12:30:00+07:00", 
      mentions_count: 189,
      growth_rate: 15.7,
      related_to: ["Smartphone Camera", "Battery Life"],
      confidence_score: 0.82
    }
  ] as EmergingTopic[],
  
  // Auto Brief Data
  autoBriefs: [
    {
      id: "brief-001",
      period: "2025-08-13 to 2025-08-19",
      generated_at: "2025-08-19T14:30:00+07:00",
      tracker_id: "trk-001",
      summary: {
        total_mentions: 4821,
        sentiment_shift: 0.15,
        top_topics: ["Festival Campaign", "Smartphone Camera", "Delivery Issues"],
        crisis_level: "low"
      },
      insights: [
        {
          id: "insight-001",
          category: "positive",
          title: "Festival Campaign Driving Strong Engagement",
          description: "The #ContosoFestival campaign has generated 2,156 mentions with 87.3% growth week-over-week. User-generated content and cashback promotions are the main drivers of positive sentiment.",
          confidence: 0.92,
          impact_level: "high"
        },
        {
          id: "insight-002", 
          category: "opportunity",
          title: "AI Photography Features Gaining Traction",
          description: "Emerging conversations about AI photography features show 78% confidence as a new trending topic. Early adopters are sharing positive experiences with night mode improvements.",
          confidence: 0.78,
          impact_level: "medium"
        },
        {
          id: "insight-003",
          category: "negative",
          title: "Delivery Issues Impacting Customer Experience", 
          description: "Logistics-related complaints decreased by 15.2% but still represent 18% of total mentions. Forum discussions indicate ongoing frustration with delivery timeframes.",
          confidence: 0.85,
          impact_level: "medium"
        },
        {
          id: "insight-004",
          category: "risk",
          title: "Competitive Pressure Increasing",
          description: "Competitor mentions increased 12.7% with direct product comparisons becoming more frequent. Price sensitivity discussions are emerging in tech forums.",
          confidence: 0.73,
          impact_level: "medium"
        }
      ],
      recommendations: [
        {
          id: "rec-001",
          priority: "high",
          action: "Amplify Festival Campaign Success",
          description: "Leverage the positive momentum from #ContosoFestival by extending the campaign timeline and increasing user-generated content incentives.",
          estimated_effort: "1-2 weeks",
          expected_impact: "20-30% increase in positive mentions"
        },
        {
          id: "rec-002",
          priority: "high", 
          action: "Address Delivery Communication",
          description: "Implement proactive delivery status updates and compensation policy for delayed shipments to reduce negative sentiment.",
          estimated_effort: "2-3 weeks",
          expected_impact: "40-50% reduction in logistics complaints"
        },
        {
          id: "rec-003",
          priority: "medium",
          action: "Promote AI Photography Features",
          description: "Create educational content and influencer partnerships to showcase AI photography capabilities as a differentiator.",
          estimated_effort: "3-4 weeks", 
          expected_impact: "15-25% increase in product feature mentions"
        },
        {
          id: "rec-004",
          priority: "medium",
          action: "Competitive Response Strategy",
          description: "Develop comparison content highlighting unique value propositions and consider strategic pricing adjustments.",
          estimated_effort: "2-3 weeks",
          expected_impact: "10-15% improvement in competitive positioning"
        }
      ],
      key_metrics: {
        mentions_change: 23.5,
        sentiment_change: 15.3,
        reach_change: 18.7,
        engagement_change: 31.2
      }
    }
  ] as AutoBrief[],
  
  // Crisis Detection Data
  crisisEvents: [
    {
      id: "crisis-001",
      title: "Viral Negative Review Spreading",
      description: "A viral TikTok video criticizing product quality has gained significant traction with over 500K views in 6 hours. Influencers are starting to amplify the message.",
      detected_at: "2025-08-19T15:45:00+07:00",
      severity: "high",
      status: "active",
      crisis_score: 78,
      tracker_id: "trk-001",
      triggers: {
        volume_spike: true,
        sentiment_drop: true,
        negative_keywords: true,
        influencer_amplification: true,
        geographic_spread: false
      },
      metrics: {
        mentions_1h: 234,
        mentions_24h: 1247,
        sentiment_score: -0.67,
        reach_estimate: 2340000,
        engagement_rate: 8.4
      },
      timeline: [
        {
          timestamp: "2025-08-19T15:45:00+07:00",
          event: "Crisis Detected",
          type: "detection",
          details: "Automated system detected crisis score threshold breach (78/100)"
        },
        {
          timestamp: "2025-08-19T15:47:00+07:00", 
          event: "Team Notified",
          type: "escalation",
          details: "Emergency response team alerted via Slack and email"
        },
        {
          timestamp: "2025-08-19T16:15:00+07:00",
          event: "Initial Response",
          type: "response", 
          details: "PR team drafting response statement. Customer service team briefed."
        }
      ],
      assigned_to: "Sarah Chen (Crisis Manager)",
      response_actions: [
        {
          id: "action-001",
          action: "Draft Public Response Statement",
          status: "in_progress",
          assigned_to: "PR Team",
          due_date: "2025-08-19T17:00:00+07:00"
        },
        {
          id: "action-002",
          action: "Contact Original Poster",
          status: "pending",
          assigned_to: "Customer Relations",
          due_date: "2025-08-19T18:00:00+07:00"
        },
        {
          id: "action-003",
          action: "Prepare Media Statement",
          status: "pending",
          assigned_to: "Communications",
          due_date: "2025-08-19T20:00:00+07:00"
        }
      ]
    },
    {
      id: "crisis-002",
      title: "Supply Chain Delay Complaints",
      description: "Increasing customer complaints about product delivery delays during festival period. Multiple forum threads emerging.",
      detected_at: "2025-08-18T22:10:00+07:00",
      severity: "medium",
      status: "monitoring",
      crisis_score: 45,
      tracker_id: "trk-003",
      triggers: {
        volume_spike: true,
        sentiment_drop: true,
        negative_keywords: false,
        influencer_amplification: false,
        geographic_spread: true
      },
      metrics: {
        mentions_1h: 67,
        mentions_24h: 423,
        sentiment_score: -0.34,
        reach_estimate: 890000,
        engagement_rate: 3.2
      },
      timeline: [
        {
          timestamp: "2025-08-18T22:10:00+07:00",
          event: "Crisis Detected",
          type: "detection",
          details: "Medium severity crisis detected - monitoring initiated"
        },
        {
          timestamp: "2025-08-19T08:00:00+07:00",
          event: "Operations Team Briefed",
          type: "response",
          details: "Logistics team provided situation update and mitigation plan"
        }
      ],
      assigned_to: "Operations Team",
      response_actions: [
        {
          id: "action-004",
          action: "Update Delivery ETAs",
          status: "completed",
          assigned_to: "Logistics",
          due_date: "2025-08-19T10:00:00+07:00"
        },
        {
          id: "action-005",
          action: "Proactive Customer Communication",
          status: "in_progress",
          assigned_to: "Customer Service",
          due_date: "2025-08-19T12:00:00+07:00"
        }
      ]
    }
  ] as CrisisEvent[],
  
  crisisPlaybooks: [
    {
      id: "playbook-001",
      name: "Product Quality Issues",
      crisis_type: "product_issue",
      severity_threshold: 60,
      response_team: ["PR Manager", "Product Manager", "Customer Service Lead"],
      communication_templates: {
        internal: "URGENT: Product quality issue detected. All hands meeting in 30 minutes.",
        external: "We are aware of concerns regarding [PRODUCT] and are investigating immediately.",
        social_media: "We hear your concerns about [PRODUCT]. Our team is investigating and will provide updates soon.",
        press_release: "Contoso is committed to quality and is actively investigating customer feedback regarding [PRODUCT]."
      },
      escalation_rules: [
        {
          level: 1,
          threshold_score: 40,
          notify: ["PR Manager", "Customer Service Lead"],
          timeline: "Within 15 minutes"
        },
        {
          level: 2,
          threshold_score: 60,
          notify: ["VP Marketing", "VP Operations"],
          timeline: "Within 30 minutes"
        },
        {
          level: 3,
          threshold_score: 80,
          notify: ["CEO", "Board Members"],
          timeline: "Within 1 hour"
        }
      ]
    }
  ] as CrisisPlaybook[],

  // Competitive Intelligence Data
  competitors: [
    {
      id: "comp-001",
      name: "TechCorpID",
      brand: "TechCorp Indonesia",
      category: "Technology",
      website: "techcorp.id",
      social_handles: {
        twitter: "@techcorpid",
        instagram: "@techcorpindonesia",
        linkedin: "techcorp-indonesia"
      },
      market_position: "leader",
      is_tracked: true
    },
    {
      id: "comp-002", 
      name: "DigitalSolutionsJKT",
      brand: "Digital Solutions Jakarta",
      category: "Technology",
      website: "digitalsolutions.co.id",
      social_handles: {
        twitter: "@digitalsoljkt",
        instagram: "@digitalsolutionsjkt",
        facebook: "digitalsolutionsjakarta"
      },
      market_position: "challenger",
      is_tracked: true
    },
    {
      id: "comp-003",
      name: "InnovateTech", 
      brand: "Innovate Technology",
      category: "Technology",
      website: "innovatetech.id",
      social_handles: {
        twitter: "@innovatetech_id",
        linkedin: "innovate-technology-id"
      },
      market_position: "follower",
      is_tracked: true
    },
    {
      id: "comp-004",
      name: "NusaTechSolutions",
      brand: "Nusantara Tech Solutions", 
      category: "Technology",
      website: "nusatech.co.id",
      social_handles: {
        twitter: "@nusatechsol",
        instagram: "@nusatechsolutions"
      },
      market_position: "niche",
      is_tracked: false
    }
  ] as Competitor[],

  competitiveMetrics: [
    {
      competitor_id: "comp-001",
      timeframe: "7d",
      mentions: 2847,
      sentiment_score: 0.65,
      share_of_voice: 42.3,
      engagement_rate: 4.8,
      reach_estimate: 1250000,
      top_keywords: ["innovation", "digital transformation", "cloud solutions", "AI technology"],
      trend_direction: "up",
      trend_percentage: 12.5
    },
    {
      competitor_id: "comp-002",
      timeframe: "7d", 
      mentions: 1923,
      sentiment_score: 0.58,
      share_of_voice: 28.7,
      engagement_rate: 3.2,
      reach_estimate: 890000,
      top_keywords: ["digital solutions", "enterprise software", "automation"],
      trend_direction: "stable",
      trend_percentage: 1.2
    },
    {
      competitor_id: "comp-003",
      timeframe: "7d",
      mentions: 1234,
      sentiment_score: 0.52,
      share_of_voice: 18.4,
      engagement_rate: 2.9,
      reach_estimate: 560000,
      top_keywords: ["tech innovation", "startup ecosystem", "mobile apps"],
      trend_direction: "down",
      trend_percentage: -8.3
    },
    {
      competitor_id: "comp-004",
      timeframe: "7d",
      mentions: 687,
      sentiment_score: 0.61,
      share_of_voice: 10.6,
      engagement_rate: 5.1,
      reach_estimate: 320000,
      top_keywords: ["niche solutions", "specialized tech", "custom development"],
      trend_direction: "up",
      trend_percentage: 15.7
    }
  ] as CompetitiveMetrics[],

  marketInsights: [
    {
      id: "insight-001",
      title: "TechCorp Leading in AI Technology Discussion",
      type: "threat",
      severity: "high",
      description: "TechCorp Indonesia is dominating conversations around AI technology with 67% share of voice in AI-related discussions. Their recent AI product launch gained significant traction.",
      competitors_involved: ["comp-001"],
      recommended_actions: [
        "Develop counter-narrative around our AI capabilities",
        "Launch thought leadership campaign on AI innovation",
        "Partner with AI research institutions"
      ],
      created_at: "2024-08-15T10:30:00Z"
    },
    {
      id: "insight-002", 
      title: "Market Gap in SME Digital Solutions",
      type: "opportunity",
      severity: "medium",
      description: "Analysis shows limited competitor focus on SME digital transformation solutions. Current players are primarily targeting enterprise clients.",
      competitors_involved: ["comp-001", "comp-002"],
      recommended_actions: [
        "Develop SME-focused product line",
        "Create affordable pricing tiers",
        "Launch SME success story campaign"
      ],
      created_at: "2024-08-14T14:20:00Z"
    },
    {
      id: "insight-003",
      title: "Emerging Trend: Sustainability in Tech",
      type: "trend",
      severity: "medium", 
      description: "Growing conversation around sustainable technology practices. Competitors are starting to emphasize green technology initiatives.",
      competitors_involved: ["comp-001", "comp-003"],
      recommended_actions: [
        "Develop sustainability messaging strategy",
        "Highlight existing green initiatives",
        "Partner with environmental organizations"
      ],
      created_at: "2024-08-13T09:15:00Z"
    },
    {
      id: "insight-004",
      title: "Digital Solutions Jakarta Customer Service Issues",
      type: "opportunity",
      severity: "high",
      description: "Significant negative sentiment spike for Digital Solutions Jakarta related to customer service complaints and product delivery delays.",
      competitors_involved: ["comp-002"],
      recommended_actions: [
        "Highlight our superior customer service",
        "Target dissatisfied DSJ customers with retention offers",
        "Create case studies showcasing service excellence"
      ],
      created_at: "2024-08-12T16:45:00Z"
    }
  ] as MarketInsight[],

  // AI Content Recommendations Data
  contentRecommendations: [
    {
      id: "rec-001",
      title: "How AI is Transforming Indonesian Businesses: A Complete Guide",
      content_type: "article",
      recommended_platform: ["linkedin", "medium", "company_blog"],
      target_audience: "Business Decision Makers",
      predicted_engagement: 8.7,
      predicted_reach: 25000,
      confidence_score: 0.92,
      topic_relevance: 0.89,
      optimal_timing: {
        best_day: "Tuesday",
        best_hour: "09:00",
        timezone: "Asia/Jakarta"
      },
      content_outline: [
        "Introduction to AI adoption in Indonesia",
        "Case studies of successful AI implementations", 
        "Challenges and solutions for Indonesian businesses",
        "Future outlook and recommendations",
        "Call-to-action for consultation"
      ],
      keywords_to_include: ["AI transformation", "Indonesian business", "digital innovation", "automation"],
      hashtags_suggested: ["#AIIndonesia", "#DigitalTransformation", "#BusinessInnovation", "#TechLeadership"],
      tone: "professional",
      content_gaps_addressed: ["AI education content", "Local market focus"],
      generated_at: "2024-08-19T08:30:00Z"
    },
    {
      id: "rec-002", 
      title: "Behind the Scenes: Our Latest Product Development Process",
      content_type: "video",
      recommended_platform: ["instagram", "tiktok", "youtube"],
      target_audience: "Tech Enthusiasts & Customers",
      predicted_engagement: 9.2,
      predicted_reach: 45000,
      confidence_score: 0.87,
      topic_relevance: 0.94,
      optimal_timing: {
        best_day: "Friday",
        best_hour: "17:00", 
        timezone: "Asia/Jakarta"
      },
      content_outline: [
        "Opening: Team introduction",
        "Brainstorming session footage",
        "Development milestones",
        "User testing highlights",
        "Product launch preview"
      ],
      keywords_to_include: ["product development", "innovation process", "team collaboration"],
      hashtags_suggested: ["#BehindTheScenes", "#ProductDev", "#Innovation", "#TeamWork"],
      tone: "casual",
      content_gaps_addressed: ["Transparency content", "Process documentation"],
      generated_at: "2024-08-19T09:15:00Z"
    },
    {
      id: "rec-003",
      title: "5 Key Technology Trends Shaping Indonesia's Future",
      content_type: "infographic",
      recommended_platform: ["instagram", "linkedin", "twitter"],
      target_audience: "Industry Professionals",
      predicted_engagement: 7.8,
      predicted_reach: 18000,
      confidence_score: 0.84,
      topic_relevance: 0.91,
      optimal_timing: {
        best_day: "Wednesday",
        best_hour: "11:00",
        timezone: "Asia/Jakarta"
      },
      content_outline: [
        "Trend 1: AI & Machine Learning adoption",
        "Trend 2: IoT in smart cities",
        "Trend 3: Fintech revolution",
        "Trend 4: E-commerce evolution", 
        "Trend 5: Sustainable technology"
      ],
      keywords_to_include: ["technology trends", "Indonesia tech", "future technology", "digital economy"],
      hashtags_suggested: ["#TechTrends", "#DigitalIndonesia", "#FutureTech", "#Innovation"],
      tone: "educational",
      content_gaps_addressed: ["Visual content", "Trend analysis"],
      generated_at: "2024-08-19T10:45:00Z"
    },
    {
      id: "rec-004",
      title: "Customer Success Story: How PT ABC Increased Efficiency by 300%",
      content_type: "case_study",
      recommended_platform: ["linkedin", "company_blog", "email"],
      target_audience: "Potential Enterprise Clients",
      predicted_engagement: 6.9,
      predicted_reach: 12000,
      confidence_score: 0.91,
      topic_relevance: 0.88,
      optimal_timing: {
        best_day: "Thursday",
        best_hour: "14:00",
        timezone: "Asia/Jakarta"
      },
      content_outline: [
        "Client background and challenges",
        "Solution implementation process",
        "Results and metrics achieved",
        "Client testimonials",
        "How other businesses can achieve similar results"
      ],
      keywords_to_include: ["customer success", "efficiency improvement", "business transformation", "ROI"],
      hashtags_suggested: ["#CustomerSuccess", "#BusinessResults", "#Efficiency", "#ROI"],
      tone: "professional",
      content_gaps_addressed: ["Social proof content", "Success metrics"],
      generated_at: "2024-08-19T11:20:00Z"
    }
  ] as ContentRecommendation[],

  contentGaps: [
    {
      id: "gap-001",
      gap_type: "topic",
      title: "Sustainability & Green Technology Content Gap",
      description: "Limited content addressing environmental sustainability in technology solutions. Competitors are increasingly focusing on green tech messaging.",
      severity: "high",
      opportunity_score: 8.5,
      competitor_coverage: [
        { competitor_name: "TechCorp Indonesia", coverage_level: "high" },
        { competitor_name: "Digital Solutions Jakarta", coverage_level: "medium" },
        { competitor_name: "Innovate Technology", coverage_level: "low" },
        { competitor_name: "Nusantara Tech Solutions", coverage_level: "none" }
      ],
      recommended_action: "Develop comprehensive sustainability content strategy highlighting eco-friendly technology solutions",
      potential_impact: "Could increase brand affinity among environmentally conscious customers by 35%"
    },
    {
      id: "gap-002",
      gap_type: "audience",
      title: "SME Decision Makers Underserved",
      description: "Content primarily targets enterprise clients, missing opportunities with small-to-medium enterprises that represent 60% of the market.",
      severity: "high", 
      opportunity_score: 9.2,
      competitor_coverage: [
        { competitor_name: "TechCorp Indonesia", coverage_level: "low" },
        { competitor_name: "Digital Solutions Jakarta", coverage_level: "medium" },
        { competitor_name: "Innovate Technology", coverage_level: "high" },
        { competitor_name: "Nusantara Tech Solutions", coverage_level: "high" }
      ],
      recommended_action: "Create SME-focused content series with simplified language and budget-conscious solutions",
      potential_impact: "Potential to capture additional 25% market share in SME segment"
    },
    {
      id: "gap-003",
      gap_type: "format",
      title: "Video Content Deficit", 
      description: "Only 15% of content is video format, while audience engagement with video is 67% higher than text-based content.",
      severity: "medium",
      opportunity_score: 7.8,
      competitor_coverage: [
        { competitor_name: "TechCorp Indonesia", coverage_level: "high" },
        { competitor_name: "Digital Solutions Jakarta", coverage_level: "medium" },
        { competitor_name: "Innovate Technology", coverage_level: "medium" },
        { competitor_name: "Nusantara Tech Solutions", coverage_level: "low" }
      ],
      recommended_action: "Increase video content production to 40% of total content mix",
      potential_impact: "Could improve overall engagement rates by 45%"
    },
    {
      id: "gap-004",
      gap_type: "platform",
      title: "TikTok Presence Lagging",
      description: "Minimal presence on TikTok while target audience (25-40 years) increasingly consumes business content on this platform.",
      severity: "medium",
      opportunity_score: 6.9,
      competitor_coverage: [
        { competitor_name: "TechCorp Indonesia", coverage_level: "medium" },
        { competitor_name: "Digital Solutions Jakarta", coverage_level: "low" },
        { competitor_name: "Innovate Technology", coverage_level: "high" },
        { competitor_name: "Nusantara Tech Solutions", coverage_level: "none" }
      ],
      recommended_action: "Develop TikTok content strategy focusing on quick tech tips and behind-the-scenes content",
      potential_impact: "Access to 2.3M additional potential customers in target demographic"
    }
  ] as ContentGap[],

  audienceInsights: [
    {
      id: "audience-001",
      segment_name: "Tech-Savvy Executives",
      demographic: {
        age_range: "35-50",
        gender_split: { male: 65, female: 32, other: 3 },
        location: ["Jakarta", "Surabaya", "Bandung"],
        interests: ["Business Strategy", "Digital Transformation", "Leadership", "Innovation"]
      },
      behavior_patterns: {
        active_hours: ["08:00-10:00", "13:00-15:00", "19:00-21:00"],
        preferred_platforms: ["LinkedIn", "Twitter", "Email"],
        content_preferences: ["Industry Reports", "Case Studies", "Thought Leadership", "Webinars"],
        engagement_style: "Analytical and detail-oriented"
      },
      sentiment_towards_brand: 0.72,
      influence_score: 8.9,
      growth_potential: "high",
      content_suggestions: [
        "Executive-level whitepapers on digital transformation ROI",
        "Industry benchmark reports with actionable insights",
        "Leadership interviews and thought pieces"
      ]
    },
    {
      id: "audience-002", 
      segment_name: "Young Entrepreneurs",
      demographic: {
        age_range: "25-35",
        gender_split: { male: 58, female: 40, other: 2 },
        location: ["Jakarta", "Yogyakarta", "Bali"],
        interests: ["Startups", "Technology", "Innovation", "Networking", "Growth Hacking"]
      },
      behavior_patterns: {
        active_hours: ["09:00-11:00", "15:00-17:00", "21:00-23:00"],
        preferred_platforms: ["Instagram", "TikTok", "LinkedIn", "Twitter"],
        content_preferences: ["Quick Tips", "Success Stories", "Tutorials", "Behind-the-Scenes"],
        engagement_style: "Interactive and visual-focused"
      },
      sentiment_towards_brand: 0.68,
      influence_score: 7.4,
      growth_potential: "high",
      content_suggestions: [
        "Startup success story video series",
        "Quick tech tips for small businesses",
        "Entrepreneur networking event highlights"
      ]
    },
    {
      id: "audience-003",
      segment_name: "IT Professionals",
      demographic: {
        age_range: "28-45", 
        gender_split: { male: 75, female: 23, other: 2 },
        location: ["Jakarta", "Bandung", "Surabaya", "Medan"],
        interests: ["Programming", "DevOps", "Cloud Computing", "Cybersecurity", "AI/ML"]
      },
      behavior_patterns: {
        active_hours: ["07:00-09:00", "12:00-14:00", "20:00-22:00"],
        preferred_platforms: ["GitHub", "Stack Overflow", "LinkedIn", "Twitter", "YouTube"],
        content_preferences: ["Technical Tutorials", "Product Documentation", "Code Examples", "Best Practices"],
        engagement_style: "Technical and solution-focused"
      },
      sentiment_towards_brand: 0.75,
      influence_score: 6.8,
      growth_potential: "medium",
      content_suggestions: [
        "Technical deep-dive blog posts",
        "Code repository examples and templates",
        "Developer tool reviews and comparisons"
      ]
    }
  ] as AudienceInsight[],

  // Influencer & Brand Ambassador Data
  influencers: [
    {
      id: "inf-001",
      name: "Sarah Tech Reviewer",
      username: "@sarahtech_id",
      profile_image: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150",
      category: "tech",
      tier: "macro",
      platforms: [
        {
          platform: "Instagram",
          handle: "@sarahtech_id",
          followers: 245000,
          engagement_rate: 4.8,
          avg_likes: 8500,
          avg_comments: 320
        },
        {
          platform: "TikTok", 
          handle: "@sarahtech_id",
          followers: 180000,
          engagement_rate: 6.2,
          avg_likes: 12000,
          avg_comments: 280
        },
        {
          platform: "YouTube",
          handle: "Sarah Tech Reviews",
          followers: 95000,
          engagement_rate: 5.1,
          avg_likes: 4800,
          avg_comments: 145
        }
      ],
      demographics: {
        age_range: "18-34",
        gender_split: { male: 45, female: 52, other: 3 },
        top_locations: ["Jakarta", "Surabaya", "Bandung", "Medan"]
      },
      content_metrics: {
        total_posts: 1247,
        avg_engagement_rate: 5.4,
        reach_estimate: 520000,
        brand_mentions: 89,
        sentiment_score: 0.78
      },
      brand_safety: {
        authenticity_score: 0.89,
        controversy_risk: "low",
        content_quality: 8.7,
        brand_alignment: 0.85
      },
      collaboration_history: {
        total_collaborations: 23,
        brands_worked_with: ["TechCorp", "GadgetPro", "SmartDevice", "InnovateTech"],
        avg_campaign_performance: 8.2,
        last_collaboration: "2024-07-15"
      },
      contact_info: {
        email: "collaborate@sarahtech.com",
        manager: "Digital Talent Agency",
        rates: {
          post: 15000000,
          story: 5000000,
          reel: 20000000
        }
      },
      tracking_status: "contracted"
    },
    {
      id: "inf-002",
      name: "Business Mentor Jake",
      username: "@businessjake",
      profile_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      category: "business",
      tier: "micro",
      platforms: [
        {
          platform: "LinkedIn",
          handle: "jake-business-mentor",
          followers: 85000,
          engagement_rate: 7.8,
          avg_likes: 2100,
          avg_comments: 180
        },
        {
          platform: "Instagram",
          handle: "@businessjake",
          followers: 45000,
          engagement_rate: 5.2,
          avg_likes: 1800,
          avg_comments: 95
        }
      ],
      demographics: {
        age_range: "25-45",
        gender_split: { male: 68, female: 30, other: 2 },
        top_locations: ["Jakarta", "Singapore", "Kuala Lumpur", "Bangkok"]
      },
      content_metrics: {
        total_posts: 892,
        avg_engagement_rate: 6.5,
        reach_estimate: 130000,
        brand_mentions: 34,
        sentiment_score: 0.82
      },
      brand_safety: {
        authenticity_score: 0.92,
        controversy_risk: "low",
        content_quality: 9.1,
        brand_alignment: 0.88
      },
      collaboration_history: {
        total_collaborations: 12,
        brands_worked_with: ["StartupHub", "BusinessTools", "DigitalSolutions"],
        avg_campaign_performance: 7.8,
        last_collaboration: "2024-08-01"
      },
      contact_info: {
        email: "partnerships@businessjake.com",
        rates: {
          post: 8000000,
          story: 3000000,
          reel: 12000000
        }
      },
      tracking_status: "tracked"
    },
    {
      id: "inf-003",
      name: "Lifestyle Bella",
      username: "@bellastyle_id",
      profile_image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      category: "lifestyle",
      tier: "micro",
      platforms: [
        {
          platform: "Instagram",
          handle: "@bellastyle_id",
          followers: 67000,
          engagement_rate: 6.8,
          avg_likes: 3400,
          avg_comments: 125
        },
        {
          platform: "TikTok",
          handle: "@bellastyle_id", 
          followers: 89000,
          engagement_rate: 8.1,
          avg_likes: 5200,
          avg_comments: 210
        }
      ],
      demographics: {
        age_range: "18-35",
        gender_split: { male: 25, female: 72, other: 3 },
        top_locations: ["Jakarta", "Bali", "Yogyakarta", "Bandung"]
      },
      content_metrics: {
        total_posts: 1456,
        avg_engagement_rate: 7.4,
        reach_estimate: 156000,
        brand_mentions: 156,
        sentiment_score: 0.85
      },
      brand_safety: {
        authenticity_score: 0.86,
        controversy_risk: "low",
        content_quality: 8.3,
        brand_alignment: 0.79
      },
      collaboration_history: {
        total_collaborations: 45,
        brands_worked_with: ["BeautyBrand", "FashionCo", "LifestyleTech", "WellnessApp"],
        avg_campaign_performance: 8.5,
        last_collaboration: "2024-08-10"
      },
      contact_info: {
        email: "hello@bellastyle.com",
        manager: "Lifestyle Influencer Network",
        rates: {
          post: 6500000,
          story: 2500000,
          reel: 9500000
        }
      },
      tracking_status: "potential"
    },
    {
      id: "inf-004",
      name: "Gaming Pro Alex",
      username: "@alexgaming_pro",
      profile_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      category: "gaming",
      tier: "nano",
      platforms: [
        {
          platform: "Twitch",
          handle: "alexgaming_pro",
          followers: 12000,
          engagement_rate: 12.4,
          avg_likes: 850,
          avg_comments: 95
        },
        {
          platform: "YouTube",
          handle: "Alex Gaming Pro",
          followers: 8500,
          engagement_rate: 9.8,
          avg_likes: 650,
          avg_comments: 78
        }
      ],
      demographics: {
        age_range: "16-28",
        gender_split: { male: 78, female: 20, other: 2 },
        top_locations: ["Jakarta", "Surabaya", "Bandung", "Semarang"]
      },
      content_metrics: {
        total_posts: 234,
        avg_engagement_rate: 11.1,
        reach_estimate: 20500,
        brand_mentions: 8,
        sentiment_score: 0.91
      },
      brand_safety: {
        authenticity_score: 0.94,
        controversy_risk: "low",
        content_quality: 8.9,
        brand_alignment: 0.82
      },
      collaboration_history: {
        total_collaborations: 3,
        brands_worked_with: ["GamingGear", "TechAccessories"],
        avg_campaign_performance: 9.1,
        last_collaboration: "2024-07-28"
      },
      contact_info: {
        email: "business@alexgaming.com",
        rates: {
          post: 2000000,
          story: 800000,
          reel: 3500000
        }
      },
      tracking_status: "contacted"
    }
  ] as Influencer[],

  influencerCampaigns: [
    {
      id: "camp-001",
      name: "Tech Innovation Showcase 2024",
      campaign_type: "product_launch",
      status: "active",
      start_date: "2024-08-01",
      end_date: "2024-08-31",
      budget: 250000000,
      target_metrics: {
        impressions: 2000000,
        engagement: 150000,
        conversions: 5000,
        reach: 800000
      },
      actual_metrics: {
        impressions: 1678000,
        engagement: 127000,
        conversions: 3890,
        reach: 675000,
        roi: 2.8
      },
      influencers: [
        {
          influencer_id: "inf-001",
          agreed_rate: 120000000,
          deliverables: ["2 Instagram posts", "5 Instagram stories", "1 YouTube review"],
          performance: {
            impressions: 890000,
            engagement: 68000,
            conversions: 2100,
            cost_per_engagement: 1765
          }
        },
        {
          influencer_id: "inf-002",
          agreed_rate: 80000000,
          deliverables: ["3 LinkedIn posts", "1 Instagram reel", "2 LinkedIn articles"],
          performance: {
            impressions: 456000,
            engagement: 35000,
            conversions: 980,
            cost_per_engagement: 2286
          }
        }
      ],
      content_requirements: {
        post_count: 5,
        story_count: 5,
        reel_count: 1,
        required_hashtags: ["#TechInnovation2024", "#DigitalTransformation", "#FutureTech"],
        brand_mentions: ["@our_brand", "@tech_innovation"]
      }
    },
    {
      id: "camp-002",
      name: "Lifestyle Brand Awareness",
      campaign_type: "brand_awareness",
      status: "completed",
      start_date: "2024-07-01",
      end_date: "2024-07-31",
      budget: 180000000,
      target_metrics: {
        impressions: 1500000,
        engagement: 120000,
        conversions: 3000,
        reach: 600000
      },
      actual_metrics: {
        impressions: 1820000,
        engagement: 142000,
        conversions: 3450,
        reach: 720000,
        roi: 3.2
      },
      influencers: [
        {
          influencer_id: "inf-003",
          agreed_rate: 95000000,
          deliverables: ["4 Instagram posts", "8 Instagram stories", "2 TikTok videos"],
          performance: {
            impressions: 1100000,
            engagement: 89000,
            conversions: 2300,
            cost_per_engagement: 1067
          }
        },
        {
          influencer_id: "inf-004",
          agreed_rate: 45000000,
          deliverables: ["3 Twitch streams", "2 YouTube videos"],
          performance: {
            impressions: 720000,
            engagement: 53000,
            conversions: 1150,
            cost_per_engagement: 849
          }
        }
      ],
      content_requirements: {
        post_count: 4,
        story_count: 8,
        reel_count: 2,
        required_hashtags: ["#LifestyleTech", "#Innovation", "#SmartLiving"],
        brand_mentions: ["@our_lifestyle_brand"]
      }
    }
  ] as InfluencerCampaign[],

  influencerInsights: [
    {
      id: "insight-001",
      title: "Sarah Tech Reviewer Shows 85% Higher Engagement on Tech Content",
      type: "performance",
      severity: "high",
      description: "Sarah's tech-focused content consistently outperforms lifestyle content by 85% in engagement rates. Her audience shows strong purchase intent for tech products.",
      influencer_involved: ["inf-001"],
      recommended_actions: [
        "Increase tech-focused collaboration frequency",
        "Leverage her expertise for product deep-dive reviews",
        "Consider long-term brand ambassador partnership"
      ],
      potential_impact: "Could increase campaign ROI by 40% and drive 2.5x more conversions",
      created_at: "2024-08-15T14:30:00Z"
    },
    {
      id: "insight-002",
      title: "Emerging Micro-Influencer Opportunity in Gaming Sector",
      type: "opportunity",
      severity: "medium",
      description: "Gaming micro-influencers show 3x better cost-per-engagement compared to macro influencers, with higher audience authenticity scores.",
      influencer_involved: ["inf-004"],
      recommended_actions: [
        "Invest more in gaming micro-influencer partnerships",
        "Test nano-influencer campaigns in gaming vertical",
        "Develop gaming-specific product messaging"
      ],
      potential_impact: "Potential to reduce cost-per-acquisition by 60% while maintaining quality engagement",
      created_at: "2024-08-12T16:45:00Z"
    },
    {
      id: "insight-003",
      title: "Cross-Platform Content Strategy Drives 45% Better Results",
      type: "trend",
      severity: "medium",
      description: "Influencers who post consistent messaging across multiple platforms generate 45% more reach and 30% higher conversion rates.",
      influencer_involved: ["inf-001", "inf-003"],
      recommended_actions: [
        "Require multi-platform presence for major campaigns",
        "Develop platform-specific content guidelines",
        "Create cross-platform content templates"
      ],
      potential_impact: "Could improve overall campaign effectiveness by 35%",
      created_at: "2024-08-10T09:20:00Z"
    },
    {
      id: "insight-004",
      title: "LinkedIn B2B Influencer Performance Exceeds Expectations",
      type: "performance",
      severity: "high",
      description: "Business Mentor Jake's LinkedIn content drives 4x higher conversion rates for B2B products compared to other platforms and influencers.",
      influencer_involved: ["inf-002"],
      recommended_actions: [
        "Expand LinkedIn influencer strategy",
        "Develop B2B-specific collaboration packages",
        "Test thought leadership content formats"
      ],
      potential_impact: "B2B conversion rates could increase by 250% with proper LinkedIn strategy",
      created_at: "2024-08-08T11:15:00Z"
    }
  ] as InfluencerInsight[]
};

const fmt = new Intl.NumberFormat("id-ID");

const sentimentColor = (s: string) =>
  s === "pos"
    ? "bg-emerald-100 text-emerald-700"
    : s === "neg"
    ? "bg-rose-100 text-rose-700"
    : "bg-slate-100 text-slate-700";

const sentimentLabel = (s: string) => (s === "pos" ? "Positif" : s === "neg" ? "Negatif" : "Netral");

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#8dd1e1", "#d0ed57", "#a4de6c"];

// ------------------------------
// BOOLEAN QUERY BUILDER COMPONENT
// ------------------------------
function BooleanQueryBuilder({ 
  onClose, 
  initialQuery = "", 
  onSave 
}: { 
  onClose: () => void; 
  initialQuery?: string; 
  onSave: (query: string, conditions: QueryCondition[]) => void; 
}) {
  const [conditions, setConditions] = useState<QueryCondition[]>([
    { id: "1", type: "keyword", operator: "AND", value: "Contoso" }
  ]);
  const [preview, setPreview] = useState("");

  const addCondition = () => {
    const newCondition: QueryCondition = {
      id: Date.now().toString(),
      type: "keyword",
      operator: "AND", 
      value: ""
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (id: string, field: keyof QueryCondition, value: string) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const generateQuery = () => {
    const parts = conditions.map(c => {
      let part = "";
      if (c.type === "phrase") part = `"${c.value}"`;
      else if (c.type === "exclude") part = `NOT (${c.value})`;
      else if (c.type === "domain") part = `site:${c.value}`;
      else if (c.type === "author") part = `author:"${c.value}"`;
      else part = c.value;
      
      return c.operator === "NOT" ? `NOT (${part})` : part;
    });
    
    return parts.join(" " + conditions[1]?.operator + " " || "");
  };

  React.useEffect(() => {
    setPreview(generateQuery());
  }, [conditions]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Boolean Query Builder</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div key={condition.id} className="flex items-center gap-2 p-3 border rounded-lg">
                {index > 0 && (
                  <select 
                    value={condition.operator}
                    onChange={(e) => updateCondition(condition.id, "operator", e.target.value)}
                    className="border rounded px-2 py-1 text-sm w-16"
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                    <option value="NOT">NOT</option>
                  </select>
                )}
                
                <select
                  value={condition.type}
                  onChange={(e) => updateCondition(condition.id, "type", e.target.value)}
                  className="border rounded px-2 py-1 text-sm w-24"
                >
                  <option value="keyword">Keyword</option>
                  <option value="phrase">Phrase</option>
                  <option value="exclude">Exclude</option>
                  <option value="domain">Domain</option>
                  <option value="author">Author</option>
                </select>
                
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(condition.id, "value", e.target.value)}
                  placeholder={`Enter ${condition.type}...`}
                  className="border rounded px-2 py-1 text-sm flex-1"
                />
                
                <button
                  onClick={() => removeCondition(condition.id)}
                  className="p-1 hover:bg-red-100 rounded text-red-600"
                  disabled={conditions.length === 1}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={addCondition}
            className="mt-3 flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg hover:bg-gray-50 w-full justify-center"
          >
            <Plus className="h-4 w-4" />
            Add Condition
          </button>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium mb-2">Query Preview:</div>
            <code className="text-sm text-gray-800 break-all">{preview}</code>
          </div>
        </div>
        
        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(preview, conditions)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Query
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------
// ALERT RULES MANAGEMENT COMPONENT  
// ------------------------------
function AlertRulesManager({ 
  onClose, 
  trackerId 
}: { 
  onClose: () => void; 
  trackerId: string; 
}) {
  const [rules, setRules] = useState<AlertRule[]>(
    demoData.alertRules.filter(r => r.tracker_id === trackerId)
  );
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const createNewRule = () => {
    const newRule: AlertRule = {
      id: Date.now().toString(),
      name: "New Alert Rule",
      tracker_id: trackerId,
      condition: "volume_spike",
      threshold: 100,
      timeframe: "1h",
      severity: "medium",
      channels: ["email"],
      enabled: true,
    };
    setEditingRule(newRule);
    setIsCreating(true);
  };

  const saveRule = (rule: AlertRule) => {
    if (isCreating) {
      setRules([...rules, rule]);
      setIsCreating(false);
    } else {
      setRules(rules.map(r => r.id === rule.id ? rule : r));
    }
    setEditingRule(null);
  };

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Alert Rules Management</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              {rules.length} alert rules configured
            </div>
            <button
              onClick={createNewRule}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              New Rule
            </button>
          </div>
          
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleRule(rule.id)}
                      className="rounded"
                    />
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-gray-600">
                        {rule.condition.replace('_', ' ')} {'>'}  {rule.threshold} in {rule.timeframe}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      rule.severity === 'high' ? 'bg-red-100 text-red-700' :
                      rule.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {rule.severity}
                    </span>
                    
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <span>Channels:</span>
                  {rule.channels.map(channel => (
                    <span key={channel} className="px-2 py-0.5 bg-gray-100 rounded">
                      {channel}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
      
      {editingRule && (
        <AlertRuleEditor
          rule={editingRule}
          onSave={saveRule}
          onCancel={() => {
            setEditingRule(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}

// ------------------------------
// ALERT RULE EDITOR COMPONENT
// ------------------------------
function AlertRuleEditor({ 
  rule, 
  onSave, 
  onCancel 
}: { 
  rule: AlertRule; 
  onSave: (rule: AlertRule) => void; 
  onCancel: () => void; 
}) {
  const [editedRule, setEditedRule] = useState<AlertRule>({ ...rule });

  const updateRule = (field: keyof AlertRule, value: any) => {
    setEditedRule({ ...editedRule, [field]: value });
  };

  const toggleChannel = (channel: 'email' | 'slack' | 'webhook') => {
    const channels = editedRule.channels.includes(channel)
      ? editedRule.channels.filter(c => c !== channel)
      : [...editedRule.channels, channel];
    updateRule('channels', channels);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Alert Rule</h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Rule Name</label>
            <input
              type="text"
              value={editedRule.name}
              onChange={(e) => updateRule('name', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Condition</label>
              <select
                value={editedRule.condition}
                onChange={(e) => updateRule('condition', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="volume_spike">Volume Spike</option>
                <option value="sentiment_drop">Sentiment Drop</option>
                <option value="new_influencer">New Influencer</option>
                <option value="keyword_trend">Keyword Trending</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Timeframe</label>
              <select
                value={editedRule.timeframe}
                onChange={(e) => updateRule('timeframe', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="15m">15 minutes</option>
                <option value="1h">1 hour</option>
                <option value="3h">3 hours</option>
                <option value="24h">24 hours</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Threshold</label>
              <input
                type="number"
                value={editedRule.threshold}
                onChange={(e) => updateRule('threshold', Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select
                value={editedRule.severity}
                onChange={(e) => updateRule('severity', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Notification Channels</label>
            <div className="flex gap-3">
              {['email', 'slack', 'webhook'].map(channel => (
                <label key={channel} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editedRule.channels.includes(channel as any)}
                    onChange={() => toggleChannel(channel as any)}
                    className="rounded"
                  />
                  <span className="capitalize">{channel}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedRule)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------
// TOPIC ANALYSIS COMPONENT
// ------------------------------
function TopicAnalysisPanel({ 
  onClose 
}: { 
  onClose: () => void; 
}) {
  const [activeTab, setActiveTab] = useState<'topics' | 'trends' | 'emerging'>('topics');

  const getTrendIcon = (trending: string) => {
    switch (trending) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return 'text-green-600 bg-green-50';
    if (score < -0.2) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      product: 'bg-blue-100 text-blue-700',
      service: 'bg-purple-100 text-purple-700', 
      brand: 'bg-indigo-100 text-indigo-700',
      crisis: 'bg-red-100 text-red-700',
      campaign: 'bg-green-100 text-green-700',
      competitor: 'bg-orange-100 text-orange-700'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Topic Analysis & Trend Detection
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b">
          <div className="flex">
            {[
              { id: 'topics', label: 'Current Topics', icon: Target },
              { id: 'trends', label: 'Trending Keywords', icon: Hash },
              { id: 'emerging', label: 'Emerging Topics', icon: Zap }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-blue-500 text-blue-600 bg-blue-50' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {/* Current Topics Tab */}
          {activeTab === 'topics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Topics List */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Active Topics (7 days)</h3>
                  {demoData.topics.map((topic) => (
                    <div key={topic.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{topic.name}</h4>
                            {getTrendIcon(topic.trending)}
                            <span className={`px-2 py-0.5 rounded text-xs ${getCategoryColor(topic.category)}`}>
                              {topic.category}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {topic.keywords.slice(0, 3).map(keyword => (
                              <span key={keyword} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                {keyword}
                              </span>
                            ))}
                            {topic.keywords.length > 3 && (
                              <span className="text-xs text-gray-500">+{topic.keywords.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-gray-500 text-xs">Mentions</div>
                          <div className="font-semibold">{fmt.format(topic.mentions_7d)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Change 7d</div>
                          <div className={`font-semibold ${topic.change_7d > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {topic.change_7d > 0 ? '+' : ''}{topic.change_7d.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Sentiment</div>
                          <div className={`font-semibold px-2 py-0.5 rounded text-xs ${getSentimentColor(topic.sentiment_score)}`}>
                            {topic.sentiment_score.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Topic Timeline Chart */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Topic Trends (7 days)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={demoData.topicTimeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="topic-003" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Festival Campaign" />
                        <Area type="monotone" dataKey="topic-001" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Smartphone Camera" />
                        <Area type="monotone" dataKey="topic-002" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Delivery Issues" />
                        <Area type="monotone" dataKey="topic-004" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Battery Life" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Trending Keywords Tab */}
          {activeTab === 'trends' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Trending Keywords (24 hours)</h3>
                <div className="text-sm text-gray-500">Sorted by growth rate</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {demoData.trendingKeywords.map((keyword) => (
                  <div key={keyword.keyword} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Hash className="h-4 w-4 text-blue-500" />
                        {keyword.keyword}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        keyword.sentiment === 'pos' ? 'bg-green-100 text-green-700' :
                        keyword.sentiment === 'neg' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {keyword.sentiment === 'pos' ? 'Positive' : keyword.sentiment === 'neg' ? 'Negative' : 'Neutral'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mentions 24h:</span>
                        <span className="font-semibold">{fmt.format(keyword.mentions_24h)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Growth:</span>
                        <span className={`font-semibold ${keyword.change_24h > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {keyword.change_24h > 0 ? '+' : ''}{keyword.change_24h.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Peak Hour:</span>
                        <span className="text-xs">{new Date(keyword.peak_hour).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Emerging Topics Tab */}
          {activeTab === 'emerging' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Emerging Topics</h3>
                <div className="text-sm text-gray-500">AI-detected new conversation themes</div>
              </div>
              
              <div className="space-y-4">
                {demoData.emergingTopics.map((topic) => (
                  <div key={topic.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <h4 className="font-medium">{topic.name}</h4>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            Detected {new Date(topic.first_detected).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          {topic.keywords.map(keyword => (
                            <span key={keyword} className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          Related to: {topic.related_to.join(', ')}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded text-xs ${
                          topic.confidence_score > 0.8 ? 'bg-green-100 text-green-700' :
                          topic.confidence_score > 0.6 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {(topic.confidence_score * 100).toFixed(0)}% confidence
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs">Total Mentions</div>
                        <div className="font-semibold">{fmt.format(topic.mentions_count)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Growth Rate</div>
                        <div className="font-semibold text-green-600">+{topic.growth_rate}/hour</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Status</div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-blue-500" />
                          <span className="text-blue-600 text-xs">Monitoring</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------
// AUTO BRIEF GENERATOR COMPONENT
// ------------------------------
function AutoBriefGenerator({ 
  onClose,
  trackerId 
}: { 
  onClose: () => void;
  trackerId: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentBrief, setCurrentBrief] = useState<AutoBrief | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedTemplate, setSelectedTemplate] = useState('executive');

  // Simulate brief generation
  const generateBrief = async () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Use dummy data 
    setCurrentBrief(demoData.autoBriefs[0]);
    setIsGenerating(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'positive': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'negative': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Brain className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'positive': return 'bg-green-50 border-green-200';
      case 'negative': return 'bg-red-50 border-red-200';
      case 'opportunity': return 'bg-blue-50 border-blue-200';
      case 'risk': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const exportToPDF = () => {
    // Simulate PDF export
    alert('PDF export functionality would be implemented here with libraries like jsPDF or Puppeteer');
  };

  const exportToPPT = () => {
    // Simulate PowerPoint export
    alert('PowerPoint export functionality would be implemented here with libraries like PptxGenJS');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-4 max-h-[95vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Brief Generator
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!currentBrief && !isGenerating && (
          <div className="p-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-6">
                <Brain className="h-16 w-16 mx-auto text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Generate Intelligent Brief</h3>
                <p className="text-gray-600">
                  Our AI will analyze your data and generate comprehensive insights, 
                  recommendations, and executive summaries automatically.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Analysis Period</label>
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="1d">Last 24 hours</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="custom">Custom period</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Brief Template</label>
                  <select 
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="executive">Executive Summary</option>
                    <option value="detailed">Detailed Analysis</option>
                    <option value="crisis">Crisis Response</option>
                    <option value="campaign">Campaign Performance</option>
                  </select>
                </div>
              </div>

              <button
                onClick={generateBrief}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto text-lg"
              >
                <Brain className="h-5 w-5" />
                Generate Brief
              </button>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analyzing Your Data...</h3>
            <p className="text-gray-600 mb-4">
              AI is processing {fmt.format(4821)} mentions and generating insights
            </p>
            <div className="max-w-md mx-auto bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">This usually takes 30-60 seconds</p>
          </div>
        )}

        {currentBrief && (
          <div className="max-h-[80vh] overflow-y-auto">
            {/* Brief Header */}
            <div className="p-4 bg-blue-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Executive Brief</h3>
                  <p className="text-sm text-gray-600">
                    Period: {currentBrief.period} • Generated: {new Date(currentBrief.generated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportToPDF}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
                  >
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </button>
                  <button
                    onClick={exportToPPT}
                    className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm"
                  >
                    <FileText className="h-4 w-4" />
                    Export PPT
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Executive Summary */}
              <div>
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Executive Summary
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-sm text-gray-500">Total Mentions</div>
                    <div className="text-2xl font-semibold">{fmt.format(currentBrief.summary.total_mentions)}</div>
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +{currentBrief.key_metrics.mentions_change}%
                    </div>
                  </div>
                  
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-sm text-gray-500">Sentiment Shift</div>
                    <div className="text-2xl font-semibold">+{currentBrief.summary.sentiment_shift.toFixed(2)}</div>
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Improving
                    </div>
                  </div>
                  
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-sm text-gray-500">Crisis Level</div>
                    <div className={`text-2xl font-semibold capitalize ${
                      currentBrief.summary.crisis_level === 'low' ? 'text-green-600' :
                      currentBrief.summary.crisis_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {currentBrief.summary.crisis_level}
                    </div>
                    <div className="text-sm text-gray-500">All clear</div>
                  </div>
                  
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-sm text-gray-500">Top Topics</div>
                    <div className="text-sm font-medium">
                      {currentBrief.summary.top_topics.slice(0, 2).join(', ')}
                    </div>
                    <div className="text-xs text-gray-500">+{currentBrief.summary.top_topics.length - 2} more</div>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div>
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Key Insights
                </h4>
                
                <div className="space-y-3">
                  {currentBrief.insights.map((insight) => (
                    <div key={insight.id} className={`border rounded-lg p-4 ${getCategoryColor(insight.category)}`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getCategoryIcon(insight.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{insight.title}</h5>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              insight.impact_level === 'high' ? 'bg-red-100 text-red-700' :
                              insight.impact_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {insight.impact_level} impact
                            </span>
                            <span className="text-xs text-gray-500">
                              {(insight.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Action Recommendations
                </h4>
                
                <div className="space-y-3">
                  {currentBrief.recommendations.map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{rec.action}</h5>
                            <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(rec.priority)}`}>
                              {rec.priority} priority
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Effort:</span> {rec.estimated_effort}
                            </div>
                            <div>
                              <span className="font-medium">Expected Impact:</span> {rec.expected_impact}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          
          {currentBrief && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentBrief(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Generate New Brief
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share Brief
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------
// CRISIS DETECTION DASHBOARD
// ------------------------------
function CrisisDetectionDashboard({ 
  onClose 
}: { 
  onClose: () => void; 
}) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'playbooks'>('dashboard');
  const [selectedCrisis, setSelectedCrisis] = useState<CrisisEvent | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-700 border-red-200';
      case 'monitoring': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
      case 'escalated': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getActionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const activeCrises = demoData.crisisEvents.filter(c => c.status === 'active' || c.status === 'escalated');
  const monitoringCrises = demoData.crisisEvents.filter(c => c.status === 'monitoring');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl mx-4 max-h-[95vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-red-50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Crisis Detection & Response Center
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Crisis Alert Banner */}
        {activeCrises.length > 0 && (
          <div className="bg-red-600 text-white p-3 flex items-center gap-3">
            <Siren className="h-5 w-5 animate-pulse" />
            <div className="flex-1">
              <span className="font-semibold">ACTIVE CRISIS DETECTED</span>
              <span className="ml-2">{activeCrises.length} active incident(s) requiring immediate attention</span>
            </div>
            <button className="px-3 py-1 bg-white text-red-600 rounded font-medium hover:bg-gray-100">
              View Details
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b">
          <div className="flex">
            {[
              { id: 'dashboard', label: 'Crisis Dashboard', icon: Activity },
              { id: 'events', label: 'Active Events', icon: AlertTriangle },
              { id: 'playbooks', label: 'Response Playbooks', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-red-500 text-red-600 bg-red-50' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 max-h-[75vh] overflow-y-auto">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Crisis Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Flame className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{activeCrises.length}</div>
                      <div className="text-sm text-gray-500">Active Crises</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Eye className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{monitoringCrises.length}</div>
                      <div className="text-sm text-gray-500">Monitoring</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Timer className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">2.3h</div>
                      <div className="text-sm text-gray-500">Avg Response Time</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">12</div>
                      <div className="text-sm text-gray-500">Resolved (7d)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Crisis Score */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Crisis Score Timeline (24h)
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { time: '00:00', score: 15 },
                        { time: '04:00', score: 12 },
                        { time: '08:00', score: 18 },
                        { time: '12:00', score: 25 },
                        { time: '16:00', score: 78 },
                        { time: '20:00', score: 65 },
                        { time: '24:00', score: 45 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Crisis Heatmap
                  </h3>
                  <div className="space-y-3">
                    {[
                      { region: 'Jakarta', score: 78, mentions: 1247 },
                      { region: 'Surabaya', score: 45, mentions: 423 },
                      { region: 'Bandung', score: 32, mentions: 234 },
                      { region: 'Medan', score: 28, mentions: 156 }
                    ].map(region => (
                      <div key={region.region} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">{region.region}</div>
                          <div className={`px-2 py-1 rounded text-xs ${
                            region.score > 60 ? 'bg-red-100 text-red-700' :
                            region.score > 30 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            Score: {region.score}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{region.mentions} mentions</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Crisis Events */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Active Crisis Events
                </h3>
                <div className="space-y-3">
                  {demoData.crisisEvents.map((crisis) => (
                    <div key={crisis.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{crisis.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(crisis.severity)}`}>
                              {crisis.severity}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(crisis.status)}`}>
                              {crisis.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{crisis.description}</p>
                          <div className="text-xs text-gray-500">
                            Detected: {new Date(crisis.detected_at).toLocaleString()} • 
                            Assigned to: {crisis.assigned_to}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-600">{crisis.crisis_score}</div>
                          <div className="text-xs text-gray-500">Crisis Score</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div>
                          <div className="text-gray-500 text-xs">Mentions (1h)</div>
                          <div className="font-semibold">{crisis.metrics.mentions_1h}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Mentions (24h)</div>
                          <div className="font-semibold">{crisis.metrics.mentions_24h}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Sentiment</div>
                          <div className="font-semibold text-red-600">{crisis.metrics.sentiment_score.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Est. Reach</div>
                          <div className="font-semibold">{(crisis.metrics.reach_estimate / 1000000).toFixed(1)}M</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Actions</div>
                          <button 
                            onClick={() => setSelectedCrisis(crisis)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Manage →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Crisis Event Management</h3>
                <button className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Manual Crisis Report
                </button>
              </div>

              {demoData.crisisEvents.map((crisis) => (
                <div key={crisis.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{crisis.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(crisis.severity)}`}>
                          {crisis.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{crisis.description}</p>
                      
                      {/* Crisis Triggers */}
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2">Triggered by:</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(crisis.triggers).map(([trigger, active]) => (
                            active && (
                              <span key={trigger} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                {trigger.replace('_', ' ')}
                              </span>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-red-600 mb-1">{crisis.crisis_score}</div>
                      <div className="text-sm text-gray-500">Crisis Score</div>
                    </div>
                  </div>

                  {/* Response Actions */}
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Response Actions:</div>
                    <div className="space-y-2">
                      {crisis.response_actions.map((action) => (
                        <div key={action.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-xs ${getActionStatusColor(action.status)}`}>
                              {action.status}
                            </span>
                            <span className="text-sm">{action.action}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {action.assigned_to} • Due: {new Date(action.due_date).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <div className="text-sm font-medium mb-2">Timeline:</div>
                    <div className="space-y-2">
                      {crisis.timeline.map((event, index) => (
                        <div key={index} className="flex items-start gap-3 text-sm">
                          <div className="text-xs text-gray-500 w-16">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium">{event.event}</span>
                            <span className="text-gray-600 ml-2">{event.details}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Playbooks Tab */}
          {activeTab === 'playbooks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Crisis Response Playbooks</h3>
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Playbook
                </button>
              </div>

              {demoData.crisisPlaybooks.map((playbook) => (
                <div key={playbook.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg mb-1">{playbook.name}</h4>
                      <div className="text-sm text-gray-600 mb-2">
                        Crisis Type: <span className="font-medium">{playbook.crisis_type.replace('_', ' ')}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Threshold: <span className="font-medium">{playbook.severity_threshold} points</span>
                      </div>
                    </div>
                    <button className="px-3 py-2 border rounded-lg hover:bg-gray-50">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Response Team:</div>
                      <div className="space-y-1">
                        {playbook.response_team.map((member, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <UserCheck className="h-3 w-3 text-green-600" />
                            {member}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Escalation Rules:</div>
                      <div className="space-y-1">
                        {playbook.escalation_rules.map((rule, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            Level {rule.level}: {rule.threshold_score}+ points → {rule.notify.join(', ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Configure Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------
// COMPETITIVE INTELLIGENCE DASHBOARD
// ------------------------------
function CompetitiveIntelligenceDashboard({ 
  onClose 
}: { 
  onClose: () => void; 
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'competitors' | 'shareofvoice' | 'insights'>('overview');
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'leader': return 'bg-green-100 text-green-700 border-green-200';
      case 'challenger': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'follower': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'niche': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'bg-green-100 text-green-700';
      case 'threat': return 'bg-red-100 text-red-700';
      case 'trend': return 'bg-blue-100 text-blue-700';
      case 'gap': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  const totalMentions = demoData.competitiveMetrics.reduce((sum, metric) => sum + metric.mentions, 0);
  const trackedCompetitors = demoData.competitors.filter(c => c.is_tracked);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl mx-4 max-h-[95vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-blue-50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Competitive Intelligence Dashboard
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <div className="flex">
            {[
              { id: 'overview', label: 'Market Overview', icon: BarChart3 },
              { id: 'competitors', label: 'Competitor Analysis', icon: Users },
              { id: 'shareofvoice', label: 'Share of Voice', icon: PieChartIcon },
              { id: 'insights', label: 'Market Insights', icon: Lightbulb }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-blue-500 text-blue-600 bg-blue-50' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 max-h-[75vh] overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{trackedCompetitors.length}</div>
                      <div className="text-sm text-gray-500">Tracked Competitors</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{fmt.format(totalMentions)}</div>
                      <div className="text-sm text-gray-500">Total Mentions (7d)</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">68%</div>
                      <div className="text-sm text-gray-500">Market Coverage</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Lightbulb className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{demoData.marketInsights.length}</div>
                      <div className="text-sm text-gray-500">Active Insights</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share of Voice Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Share of Voice (7 days)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demoData.competitiveMetrics.map(metric => {
                            const competitor = demoData.competitors.find(c => c.id === metric.competitor_id);
                            return {
                              name: competitor?.name || 'Unknown',
                              value: metric.share_of_voice,
                              mentions: metric.mentions
                            };
                          })}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {demoData.competitiveMetrics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Sentiment vs Mentions
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={demoData.competitiveMetrics.map(metric => {
                        const competitor = demoData.competitors.find(c => c.id === metric.competitor_id);
                        return {
                          name: competitor?.name.slice(0, 10) || 'Unknown',
                          mentions: metric.mentions,
                          sentiment: metric.sentiment_score * 100
                        };
                      })}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar yAxisId="left" dataKey="mentions" fill="#3b82f6" name="Mentions" />
                        <Bar yAxisId="right" dataKey="sentiment" fill="#10b981" name="Sentiment %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Quick Competitor Overview */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Competitor Performance Overview
                </h3>
                <div className="space-y-3">
                  {demoData.competitiveMetrics.map((metric) => {
                    const competitor = demoData.competitors.find(c => c.id === metric.competitor_id);
                    if (!competitor) return null;
                    
                    return (
                      <div key={metric.competitor_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <div className="font-medium">{competitor.name}</div>
                            <div className={`text-xs px-2 py-1 rounded border w-fit ${getPositionColor(competitor.market_position)}`}>
                              {competitor.market_position}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="text-gray-500 text-xs">Mentions</div>
                            <div className="font-semibold">{fmt.format(metric.mentions)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500 text-xs">Share of Voice</div>
                            <div className="font-semibold">{metric.share_of_voice}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500 text-xs">Sentiment</div>
                            <div className="font-semibold">{(metric.sentiment_score * 100).toFixed(0)}%</div>
                          </div>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(metric.trend_direction)}
                            <span className={`text-sm font-medium ${
                              metric.trend_direction === 'up' ? 'text-green-600' :
                              metric.trend_direction === 'down' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {metric.trend_percentage > 0 ? '+' : ''}{metric.trend_percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Competitors Tab */}
          {activeTab === 'competitors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Competitor Analysis</h3>
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Competitor
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {demoData.competitors.map((competitor) => {
                  const metrics = demoData.competitiveMetrics.find(m => m.competitor_id === competitor.id);
                  
                  return (
                    <div key={competitor.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{competitor.name}</h4>
                            <span className={`px-2 py-1 rounded text-xs border ${getPositionColor(competitor.market_position)}`}>
                              {competitor.market_position}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{competitor.brand}</p>
                          <div className="text-xs text-gray-500">
                            Category: {competitor.category} • {competitor.website}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Settings className="h-4 w-4" />
                          </button>
                          <div className={`w-3 h-3 rounded-full ${competitor.is_tracked ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </div>
                      </div>

                      {/* Social Handles */}
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2">Social Presence:</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(competitor.social_handles).map(([platform, handle]) => (
                            <span key={platform} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {platform}: {handle}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Metrics */}
                      {metrics && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-gray-500 text-xs">Mentions (7d)</div>
                              <div className="font-semibold">{fmt.format(metrics.mentions)}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-xs">Share of Voice</div>
                              <div className="font-semibold">{metrics.share_of_voice}%</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-xs">Sentiment Score</div>
                              <div className="font-semibold">{(metrics.sentiment_score * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-xs">Engagement Rate</div>
                              <div className="font-semibold">{metrics.engagement_rate}%</div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-gray-500 text-xs mb-1">Top Keywords:</div>
                            <div className="flex flex-wrap gap-1">
                              {metrics.top_keywords.map((keyword, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Share of Voice Tab */}
          {activeTab === 'shareofvoice' && (
            <div className="space-y-6">
              <h3 className="font-medium text-gray-900">Share of Voice Analysis</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-4">SOV Distribution</h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demoData.competitiveMetrics.map(metric => {
                            const competitor = demoData.competitors.find(c => c.id === metric.competitor_id);
                            return {
                              name: competitor?.name || 'Unknown',
                              value: metric.share_of_voice,
                              mentions: metric.mentions
                            };
                          })}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${value}%`}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {demoData.competitiveMetrics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-4">SOV vs Sentiment</h4>
                  <div className="space-y-3">
                    {demoData.competitiveMetrics.map((metric) => {
                      const competitor = demoData.competitors.find(c => c.id === metric.competitor_id);
                      if (!competitor) return null;
                      
                      return (
                        <div key={metric.competitor_id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{competitor.name}</span>
                            <span className="text-sm text-gray-500">{metric.share_of_voice}% SOV</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Share of Voice</span>
                                <span>{metric.share_of_voice}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${metric.share_of_voice}%` }}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Sentiment Score</span>
                                <span>{(metric.sentiment_score * 100).toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${metric.sentiment_score * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detailed SOV Table */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium mb-4">Detailed Share of Voice Metrics</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Competitor</th>
                        <th className="text-right p-2">Mentions</th>
                        <th className="text-right p-2">Share of Voice</th>
                        <th className="text-right p-2">Sentiment</th>
                        <th className="text-right p-2">Reach</th>
                        <th className="text-right p-2">Engagement</th>
                        <th className="text-right p-2">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demoData.competitiveMetrics.map((metric) => {
                        const competitor = demoData.competitors.find(c => c.id === metric.competitor_id);
                        if (!competitor) return null;
                        
                        return (
                          <tr key={metric.competitor_id} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{competitor.name}</span>
                                <span className={`px-1 py-0.5 rounded text-xs border ${getPositionColor(competitor.market_position)}`}>
                                  {competitor.market_position}
                                </span>
                              </div>
                            </td>
                            <td className="text-right p-2 font-semibold">{fmt.format(metric.mentions)}</td>
                            <td className="text-right p-2 font-semibold">{metric.share_of_voice}%</td>
                            <td className="text-right p-2">{(metric.sentiment_score * 100).toFixed(0)}%</td>
                            <td className="text-right p-2">{(metric.reach_estimate / 1000000).toFixed(1)}M</td>
                            <td className="text-right p-2">{metric.engagement_rate}%</td>
                            <td className="text-right p-2">
                              <div className="flex items-center justify-end gap-1">
                                {getTrendIcon(metric.trend_direction)}
                                <span className={`font-medium ${
                                  metric.trend_direction === 'up' ? 'text-green-600' :
                                  metric.trend_direction === 'down' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {metric.trend_percentage > 0 ? '+' : ''}{metric.trend_percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Market Insights & Recommendations</h3>
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Generate Insight
                </button>
              </div>

              {demoData.marketInsights.map((insight) => (
                <div key={insight.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${getInsightTypeColor(insight.type)}`}>
                          {insight.type}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          insight.severity === 'high' ? 'bg-red-100 text-red-700' :
                          insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {insight.severity} priority
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{insight.description}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(insight.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm font-medium mb-1">Competitors Involved:</div>
                    <div className="flex flex-wrap gap-2">
                      {insight.competitors_involved.map((compId) => {
                        const competitor = demoData.competitors.find(c => c.id === compId);
                        return competitor ? (
                          <span key={compId} className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {competitor.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Recommended Actions:</div>
                    <div className="space-y-1">
                      {insight.recommended_actions.map((action, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Intelligence Report
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configure Tracking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------
// AI-POWERED CONTENT RECOMMENDATIONS
// ------------------------------
function ContentRecommendationsDashboard({ 
  onClose 
}: { 
  onClose: () => void; 
}) {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'gaps' | 'audience' | 'performance'>('recommendations');
  const [selectedRecommendation, setSelectedRecommendation] = useState<ContentRecommendation | null>(null);

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-700';
      case 'video': return 'bg-purple-100 text-purple-700';
      case 'infographic': return 'bg-green-100 text-green-700';
      case 'social_post': return 'bg-yellow-100 text-yellow-700';
      case 'whitepaper': return 'bg-gray-100 text-gray-700';
      case 'case_study': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="h-4 w-4" />;
      case 'video': return <Play className="h-4 w-4" />;
      case 'infographic': return <PieChartIcon className="h-4 w-4" />;
      case 'social_post': return <Hash className="h-4 w-4" />;
      case 'whitepaper': return <FileText className="h-4 w-4" />;
      case 'case_study': return <Target className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getGapSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalRecommendations = demoData.contentRecommendations.length;
  const avgConfidenceScore = demoData.contentRecommendations.reduce((sum, rec) => sum + rec.confidence_score, 0) / totalRecommendations;
  const highPriorityGaps = demoData.contentGaps.filter(gap => gap.severity === 'high').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl mx-4 max-h-[95vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-purple-50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Powered Content Recommendations
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* AI Status Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 flex items-center gap-3">
          <Brain className="h-5 w-5 animate-pulse" />
          <div className="flex-1">
            <span className="font-semibold">AI Engine Active</span>
            <span className="ml-2">Generated {totalRecommendations} personalized content recommendations with {(avgConfidenceScore * 100).toFixed(0)}% average confidence</span>
          </div>
          <button className="px-3 py-1 bg-white text-purple-600 rounded font-medium hover:bg-gray-100">
            <Zap className="h-4 w-4 inline mr-1" />
            Generate New
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <div className="flex">
            {[
              { id: 'recommendations', label: 'AI Recommendations', icon: Lightbulb },
              { id: 'gaps', label: 'Content Gaps', icon: Target },
              { id: 'audience', label: 'Audience Insights', icon: Users },
              { id: 'performance', label: 'Performance Predictor', icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-purple-500 text-purple-600 bg-purple-50' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 max-h-[75vh] overflow-y-auto">
          {/* AI Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Lightbulb className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{totalRecommendations}</div>
                      <div className="text-sm text-gray-500">Active Recommendations</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{(avgConfidenceScore * 100).toFixed(0)}%</div>
                      <div className="text-sm text-gray-500">Avg Confidence</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Target className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{highPriorityGaps}</div>
                      <div className="text-sm text-gray-500">High Priority Gaps</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">127K</div>
                      <div className="text-sm text-gray-500">Predicted Total Reach</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Recommendations */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Generated Content Recommendations
                </h3>
                
                {demoData.contentRecommendations.map((recommendation) => (
                  <div key={recommendation.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1 rounded ${getContentTypeColor(recommendation.content_type)}`}>
                            {getContentTypeIcon(recommendation.content_type)}
                          </div>
                          <h4 className="font-semibold text-lg">{recommendation.title}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${getContentTypeColor(recommendation.content_type)}`}>
                            {recommendation.content_type}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">Target: {recommendation.target_audience}</p>
                        <div className="text-xs text-gray-500 mb-3">
                          Best Time: {recommendation.optimal_timing.best_day} at {recommendation.optimal_timing.best_hour} ({recommendation.optimal_timing.timezone})
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">{(recommendation.confidence_score * 100).toFixed(0)}%</div>
                        <div className="text-xs text-gray-500">Confidence</div>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-4">
                      <div>
                        <div className="text-gray-500 text-xs">Predicted Engagement</div>
                        <div className={`font-semibold ${getScoreColor(recommendation.predicted_engagement)}`}>
                          {recommendation.predicted_engagement}/10
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Predicted Reach</div>
                        <div className="font-semibold">{(recommendation.predicted_reach / 1000).toFixed(0)}K</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Topic Relevance</div>
                        <div className={`font-semibold ${getScoreColor(recommendation.topic_relevance * 10)}`}>
                          {(recommendation.topic_relevance * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Tone</div>
                        <div className="font-semibold capitalize">{recommendation.tone}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Platforms</div>
                        <div className="font-semibold">{recommendation.recommended_platform.length} platforms</div>
                      </div>
                    </div>

                    {/* Content Outline */}
                    <div className="mb-3">
                      <div className="text-sm font-medium mb-2">Content Outline:</div>
                      <div className="space-y-1">
                        {recommendation.content_outline.map((point, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-4 h-4 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                              {index + 1}
                            </div>
                            <span className="text-gray-700">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Keywords and Hashtags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm font-medium mb-1">Keywords to Include:</div>
                        <div className="flex flex-wrap gap-1">
                          {recommendation.keywords_to_include.map((keyword, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Suggested Hashtags:</div>
                        <div className="flex flex-wrap gap-1">
                          {recommendation.hashtags_suggested.map((hashtag, index) => (
                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                              {hashtag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-xs text-gray-500">
                        Generated: {new Date(recommendation.generated_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
                          Save Draft
                        </button>
                        <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                          Create Content
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Gaps Tab */}
          {activeTab === 'gaps' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Content Gap Analysis</h3>
                <button className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  AI Gap Analysis
                </button>
              </div>

              {demoData.contentGaps.map((gap) => (
                <div key={gap.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{gap.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs border ${getGapSeverityColor(gap.severity)}`}>
                          {gap.severity} priority
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {gap.gap_type}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{gap.description}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">{gap.opportunity_score}</div>
                      <div className="text-xs text-gray-500">Opportunity Score</div>
                    </div>
                  </div>

                  {/* Competitor Coverage */}
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Competitor Coverage:</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {gap.competitor_coverage.map((coverage, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{coverage.competitor_name}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            coverage.coverage_level === 'high' ? 'bg-red-100 text-red-700' :
                            coverage.coverage_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            coverage.coverage_level === 'low' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {coverage.coverage_level}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Action & Impact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Recommended Action:</div>
                      <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">{gap.recommended_action}</p>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Potential Impact:</div>
                      <p className="text-sm text-gray-700 bg-green-50 p-2 rounded">{gap.potential_impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Audience Insights Tab */}
          {activeTab === 'audience' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Audience Behavior Insights</h3>
                <button className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Analyze Audience
                </button>
              </div>

              {demoData.audienceInsights.map((audience) => (
                <div key={audience.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2">{audience.segment_name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                        <div>
                          <div className="text-gray-500 text-xs">Age Range</div>
                          <div className="font-semibold">{audience.demographic.age_range}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Gender Split</div>
                          <div className="font-semibold">
                            M:{audience.demographic.gender_split.male}% F:{audience.demographic.gender_split.female}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Influence Score</div>
                          <div className={`font-semibold ${getScoreColor(audience.influence_score)}`}>
                            {audience.influence_score}/10
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Growth Potential</div>
                          <div className={`font-semibold capitalize ${
                            audience.growth_potential === 'high' ? 'text-green-600' :
                            audience.growth_potential === 'medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {audience.growth_potential}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {(audience.sentiment_towards_brand * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">Brand Sentiment</div>
                    </div>
                  </div>

                  {/* Behavior Patterns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Behavior Patterns:</div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-gray-500">Active Hours:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {audience.behavior_patterns.active_hours.map((hour, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {hour}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Preferred Platforms:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {audience.behavior_patterns.preferred_platforms.map((platform, index) => (
                              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Content Preferences:</div>
                      <div className="space-y-1">
                        {audience.behavior_patterns.content_preferences.map((pref, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {pref}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Content Suggestions */}
                  <div>
                    <div className="text-sm font-medium mb-2">AI Content Suggestions:</div>
                    <div className="space-y-2">
                      {audience.content_suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-purple-50 rounded">
                          <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span className="text-sm text-gray-700">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Performance Predictor Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="font-medium text-gray-900">Content Performance Predictor</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Engagement Prediction by Content Type</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { type: 'Video', predicted: 9.2, actual: 8.8 },
                        { type: 'Infographic', predicted: 7.8, actual: 7.5 },
                        { type: 'Article', predicted: 8.7, actual: 8.2 },
                        { type: 'Case Study', predicted: 6.9, actual: 7.1 },
                        { type: 'Social Post', predicted: 8.1, actual: 7.9 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} domain={[0, 10]} />
                        <Tooltip />
                        <Bar dataKey="predicted" fill="#8b5cf6" name="AI Predicted" />
                        <Bar dataKey="actual" fill="#10b981" name="Historical Avg" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Optimal Posting Times</h4>
                  <div className="space-y-3">
                    {[
                      { day: 'Monday', time: '09:00', score: 7.2, type: 'Professional Content' },
                      { day: 'Tuesday', time: '10:00', score: 8.7, type: 'Industry Insights' },
                      { day: 'Wednesday', time: '11:00', score: 7.8, type: 'Educational Content' },
                      { day: 'Thursday', time: '14:00', score: 6.9, type: 'Case Studies' },
                      { day: 'Friday', time: '17:00', score: 9.2, type: 'Entertainment/Casual' }
                    ].map((timing, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{timing.day} at {timing.time}</div>
                          <div className="text-sm text-gray-500">{timing.type}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(timing.score)}`}>
                            {timing.score}/10
                          </div>
                          <div className="text-xs text-gray-500">Predicted Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content Performance Comparison */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium mb-4">AI vs Historical Performance Accuracy</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">87%</div>
                    <div className="text-sm text-gray-600">Prediction Accuracy</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">+23%</div>
                    <div className="text-sm text-gray-600">Engagement Improvement</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">156</div>
                    <div className="text-sm text-gray-600">Content Generated</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Content Plan
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Generate More Ideas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------
// INFLUENCER & BRAND AMBASSADOR TRACKING
// ------------------------------
function InfluencerTrackingDashboard({ 
  onClose 
}: { 
  onClose: () => void; 
}) {
  const [activeTab, setActiveTab] = useState<'discovery' | 'tracking' | 'campaigns' | 'insights'>('discovery');
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'nano': return 'bg-green-100 text-green-700';
      case 'micro': return 'bg-blue-100 text-blue-700';
      case 'macro': return 'bg-purple-100 text-purple-700';
      case 'mega': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'nano': return <Users className="h-4 w-4" />;
      case 'micro': return <Star className="h-4 w-4" />;
      case 'macro': return <Award className="h-4 w-4" />;
      case 'mega': return <Crown className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'tracked': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'potential': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'contacted': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'contracted': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-gray-100 text-gray-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'tiktok': return <Video className="h-4 w-4" />;
      case 'twitch': return <Video className="h-4 w-4" />;
      default: return <Globe2 className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const trackedInfluencers = demoData.influencers.filter(inf => inf.tracking_status === 'tracked' || inf.tracking_status === 'contracted');
  const activeCampaigns = demoData.influencerCampaigns.filter(camp => camp.status === 'active');
  const totalBudget = demoData.influencerCampaigns.reduce((sum, camp) => sum + camp.budget, 0);
  const avgROI = demoData.influencerCampaigns.reduce((sum, camp) => sum + camp.actual_metrics.roi, 0) / demoData.influencerCampaigns.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl mx-4 max-h-[95vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-pink-50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-pink-600" />
            Influencer & Brand Ambassador Tracking
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Performance Banner */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-3 flex items-center gap-3">
          <Award className="h-5 w-5 animate-pulse" />
          <div className="flex-1">
            <span className="font-semibold">Tracking {trackedInfluencers.length} Influencers</span>
            <span className="ml-2">• {activeCampaigns.length} Active Campaigns • Avg ROI: {avgROI.toFixed(1)}x</span>
          </div>
          <button className="px-3 py-1 bg-white text-pink-600 rounded font-medium hover:bg-gray-100">
            <Plus className="h-4 w-4 inline mr-1" />
            Find Influencers
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <div className="flex">
            {[
              { id: 'discovery', label: 'Influencer Discovery', icon: Search },
              { id: 'tracking', label: 'Brand Ambassadors', icon: UserCheck },
              { id: 'campaigns', label: 'Campaign Management', icon: Target },
              { id: 'insights', label: 'Performance Insights', icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-pink-500 text-pink-600 bg-pink-50' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 max-h-[75vh] overflow-y-auto">
          {/* Discovery Tab */}
          {activeTab === 'discovery' && (
            <div className="space-y-6">
              {/* Search & Filter Bar */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search influencers by name, username, or category..."
                    className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <select className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
                  <option>All Categories</option>
                  <option>Tech</option>
                  <option>Business</option>
                  <option>Lifestyle</option>
                  <option>Gaming</option>
                </select>
                <select className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
                  <option>All Tiers</option>
                  <option>Nano (1K-10K)</option>
                  <option>Micro (10K-100K)</option>
                  <option>Macro (100K-1M)</option>
                  <option>Mega (1M+)</option>
                </select>
              </div>

              {/* Influencer Discovery Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {demoData.influencers.map((influencer) => (
                  <div key={influencer.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-4 mb-4">
                      <img 
                        src={influencer.profile_image} 
                        alt={influencer.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg">{influencer.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${getTierColor(influencer.tier)}`}>
                            {influencer.tier}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(influencer.tracking_status)}`}>
                            {influencer.tracking_status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-1">{influencer.username}</p>
                        <p className="text-gray-500 text-xs capitalize">{influencer.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-pink-600">
                          {(influencer.brand_safety.authenticity_score * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">Authenticity</div>
                      </div>
                    </div>

                    {/* Platform Stats */}
                    <div className="mb-4">
                      <div className="text-sm font-medium mb-2">Platform Reach:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {influencer.platforms.slice(0, 2).map((platform, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(platform.platform)}
                              <span className="text-sm">{platform.platform}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{(platform.followers / 1000).toFixed(0)}K</div>
                              <div className="text-xs text-gray-500">{platform.engagement_rate}% eng</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">Avg Engagement</div>
                        <div className={`font-semibold ${getScoreColor(influencer.content_metrics.avg_engagement_rate)}`}>
                          {influencer.content_metrics.avg_engagement_rate}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">Brand Safety</div>
                        <div className={`font-semibold ${getScoreColor(influencer.brand_safety.content_quality)}`}>
                          {influencer.brand_safety.content_quality}/10
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500 text-xs">Est. Reach</div>
                        <div className="font-semibold">{(influencer.content_metrics.reach_estimate / 1000).toFixed(0)}K</div>
                      </div>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-gray-500">From: </span>
                        <span className="font-semibold">{formatCurrency(influencer.contact_info.rates.post)}</span>
                        <span className="text-gray-500">/post</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
                          View Profile
                        </button>
                        <button className="px-3 py-1 bg-pink-600 text-white rounded text-sm hover:bg-pink-700">
                          Contact
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand Ambassadors Tab */}
          {activeTab === 'tracking' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Brand Ambassador Performance</h3>
                <button className="px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Ambassador
                </button>
              </div>

              {/* Ambassador Performance Cards */}
              {trackedInfluencers.map((influencer) => (
                <div key={influencer.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src={influencer.profile_image} 
                        alt={influencer.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{influencer.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${getTierColor(influencer.tier)}`}>
                            {influencer.tier}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{influencer.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          {influencer.collaboration_history.avg_campaign_performance}
                        </div>
                        <div className="text-xs text-gray-500">Avg Performance</div>
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-4">
                    <div>
                      <div className="text-gray-500 text-xs">Total Collaborations</div>
                      <div className="font-semibold">{influencer.collaboration_history.total_collaborations}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Avg Engagement</div>
                      <div className={`font-semibold ${getScoreColor(influencer.content_metrics.avg_engagement_rate)}`}>
                        {influencer.content_metrics.avg_engagement_rate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Authenticity Score</div>
                      <div className={`font-semibold ${getScoreColor(influencer.brand_safety.authenticity_score * 10)}`}>
                        {(influencer.brand_safety.authenticity_score * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Brand Alignment</div>
                      <div className={`font-semibold ${getScoreColor(influencer.brand_safety.brand_alignment * 10)}`}>
                        {(influencer.brand_safety.brand_alignment * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Last Campaign</div>
                      <div className="font-semibold">
                        {new Date(influencer.collaboration_history.last_collaboration).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Platform Performance */}
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Platform Performance:</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {influencer.platforms.map((platform, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(platform.platform)}
                            <span className="text-sm">{platform.platform}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{(platform.followers / 1000).toFixed(0)}K</div>
                            <div className="text-xs text-gray-500">{platform.engagement_rate}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Brand Collaborations */}
                  <div>
                    <div className="text-sm font-medium mb-2">Recent Brand Collaborations:</div>
                    <div className="flex flex-wrap gap-1">
                      {influencer.collaboration_history.brands_worked_with.map((brand, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Influencer Campaign Management</h3>
                <button className="px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </button>
              </div>

              {/* Campaign Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Target className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{demoData.influencerCampaigns.length}</div>
                      <div className="text-sm text-gray-500">Total Campaigns</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{avgROI.toFixed(1)}x</div>
                      <div className="text-sm text-gray-500">Average ROI</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{activeCampaigns.length}</div>
                      <div className="text-sm text-gray-500">Active Campaigns</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">{formatCurrency(totalBudget)}</div>
                      <div className="text-sm text-gray-500">Total Budget</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign List */}
              {demoData.influencerCampaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{campaign.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${getCampaignStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {campaign.campaign_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Budget: {formatCurrency(campaign.budget)} • Influencers: {campaign.influencers.length}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{campaign.actual_metrics.roi}x</div>
                      <div className="text-xs text-gray-500">ROI</div>
                    </div>
                  </div>

                  {/* Campaign Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-semibold">{(campaign.actual_metrics.impressions / 1000000).toFixed(1)}M</div>
                      <div className="text-xs text-gray-500">Impressions</div>
                      <div className="text-xs text-green-600">
                        {((campaign.actual_metrics.impressions / campaign.target_metrics.impressions) * 100).toFixed(0)}% of target
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-semibold">{(campaign.actual_metrics.engagement / 1000).toFixed(0)}K</div>
                      <div className="text-xs text-gray-500">Engagement</div>
                      <div className="text-xs text-blue-600">
                        {((campaign.actual_metrics.engagement / campaign.target_metrics.engagement) * 100).toFixed(0)}% of target
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-semibold">{campaign.actual_metrics.conversions}</div>
                      <div className="text-xs text-gray-500">Conversions</div>
                      <div className="text-xs text-purple-600">
                        {((campaign.actual_metrics.conversions / campaign.target_metrics.conversions) * 100).toFixed(0)}% of target
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-semibold">{(campaign.actual_metrics.reach / 1000).toFixed(0)}K</div>
                      <div className="text-xs text-gray-500">Reach</div>
                      <div className="text-xs text-orange-600">
                        {((campaign.actual_metrics.reach / campaign.target_metrics.reach) * 100).toFixed(0)}% of target
                      </div>
                    </div>
                  </div>

                  {/* Influencer Performance */}
                  <div>
                    <div className="text-sm font-medium mb-2">Influencer Performance:</div>
                    <div className="space-y-2">
                      {campaign.influencers.map((influencerData) => {
                        const influencer = demoData.influencers.find(inf => inf.id === influencerData.influencer_id);
                        if (!influencer) return null;
                        
                        return (
                          <div key={influencerData.influencer_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center gap-3">
                              <img 
                                src={influencer.profile_image} 
                                alt={influencer.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-medium text-sm">{influencer.name}</div>
                                <div className="text-xs text-gray-500">
                                  {influencerData.deliverables.join(', ')}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{formatCurrency(influencerData.agreed_rate)}</div>
                              <div className="text-xs text-gray-500">
                                CPE: {formatCurrency(influencerData.performance.cost_per_engagement)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <h3 className="font-medium text-gray-900">Influencer Performance Insights</h3>
              
              {/* Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-4">ROI by Influencer Tier</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { tier: 'Nano', roi: 4.2, cost: 2.5 },
                        { tier: 'Micro', roi: 3.8, cost: 8.2 },
                        { tier: 'Macro', roi: 2.9, cost: 45.6 },
                        { tier: 'Mega', roi: 2.1, cost: 120.3 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tier" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="roi" fill="#ec4899" name="ROI (x)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Engagement Rate by Platform</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { platform: 'TikTok', engagement: 8.1, reach: 89 },
                        { platform: 'Instagram', engagement: 5.4, reach: 156 },
                        { platform: 'LinkedIn', engagement: 7.8, reach: 85 },
                        { platform: 'YouTube', engagement: 5.1, reach: 95 },
                        { platform: 'Twitch', engagement: 12.4, reach: 12 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="engagement" fill="#8b5cf6" name="Engagement Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Insights List */}
              <div className="space-y-4">
                <h4 className="font-medium">AI-Generated Insights</h4>
                {demoData.influencerInsights.map((insight) => (
                  <div key={insight.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-semibold">{insight.title}</h5>
                          <span className={`px-2 py-1 rounded text-xs ${
                            insight.type === 'opportunity' ? 'bg-green-100 text-green-700' :
                            insight.type === 'performance' ? 'bg-blue-100 text-blue-700' :
                            insight.type === 'trend' ? 'bg-purple-100 text-purple-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {insight.type}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            insight.severity === 'high' ? 'bg-red-100 text-red-700' :
                            insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {insight.severity} priority
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{insight.description}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(insight.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Recommended Actions */}
                    <div className="mb-3">
                      <div className="text-sm font-medium mb-2">Recommended Actions:</div>
                      <div className="space-y-1">
                        {insight.recommended_actions.map((action, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {action}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Potential Impact */}
                    <div className="p-3 bg-green-50 rounded">
                      <div className="text-sm font-medium text-green-800">Potential Impact:</div>
                      <div className="text-sm text-green-700">{insight.potential_impact}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </button>
            <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Find New Influencers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportJsonButton({ data, filename = "demo-data.json" }: { data: any; filename?: string }) {
  return (
    <button
      className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 flex items-center gap-2 text-sm"
      onClick={() => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Download className="h-4 w-4" /> Export JSON
    </button>
  );
}

function ExportCsvButton({ rows, filename = "mentions.csv" }: { rows: any[]; filename?: string }) {
  return (
    <button
      className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 flex items-center gap-2 text-sm"
      onClick={() => {
        const headers = ["id","source_type","domain","url","author","title","posted_at","language","sentiment"];
        const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${(r[h] ?? "").toString().replace(/"/g,'""')}"`).join(","))].join("\\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Share2 className="h-4 w-4" /> Export CSV
    </button>
  );
}

export default function MediaMonitoringDemo() {
  const [activeTrackerId, setActiveTrackerId] = useState(demoData.trackers[0].id);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  
  // New states for modals
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [showAlertManager, setShowAlertManager] = useState(false);
  const [showTopicAnalysis, setShowTopicAnalysis] = useState(false);
  const [showAutoBrief, setShowAutoBrief] = useState(false);
  const [showCrisisDetection, setShowCrisisDetection] = useState(false);
  const [showCompetitiveIntel, setShowCompetitiveIntel] = useState(false);
  const [showContentRecommendations, setShowContentRecommendations] = useState(false);
  const [showInfluencerTracking, setShowInfluencerTracking] = useState(false);
  const [trackers, setTrackers] = useState(demoData.trackers);

  const activeTracker = useMemo(() => trackers.find(t => t.id === activeTrackerId)!, [activeTrackerId, trackers]);

  const handleSaveQuery = (query: string, conditions: QueryCondition[]) => {
    // Update the active tracker's query
    setTrackers(trackers.map(t => 
      t.id === activeTrackerId 
        ? { ...t, query: query }
        : t
    ));
    setShowQueryBuilder(false);
  };

  const filteredMentions = useMemo(() => {
    return demoData.mentions.filter((m) => {
      const matchQ = q ? [m.title, m.content_snippet, m.author, m.domain].join(" ").toLowerCase().includes(q.toLowerCase()) : true;
      const matchType = typeFilter === "all" ? true : m.source_type === typeFilter;
      const matchSent = sentimentFilter === "all" ? true : m.sentiment === sentimentFilter;
      return matchQ && matchType && matchSent;
    });
  }, [q, typeFilter, sentimentFilter]);

  const kpi = activeTracker.kpi;

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <Layers className="h-5 w-5" />
          <div className="font-semibold">Hi-Day Media Monitoring</div>
          <div className="text-sm text-slate-500">{demoData.organization.name} • {demoData.organization.region}</div>
          <div className="ml-auto flex items-center gap-2">
            <ExportJsonButton data={demoData} />
            <button 
              onClick={() => setShowContentRecommendations(true)}
              className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2 text-sm"
            >
              <Brain className="h-4 w-4" /> AI Content
            </button>
            <button 
              onClick={() => setShowInfluencerTracking(true)}
              className="px-3 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 flex items-center gap-2 text-sm"
            >
              <Star className="h-4 w-4" /> Influencer Tracker
            </button>
            <button 
              onClick={() => setShowCompetitiveIntel(true)}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 text-sm"
            >
              <Users className="h-4 w-4" /> Competitive Intel
            </button>
            <button 
              onClick={() => setShowCrisisDetection(true)}
              className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 text-sm"
            >
              <Shield className="h-4 w-4" /> Crisis Center
            </button>
            <button 
              onClick={() => setShowAutoBrief(true)}
              className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:opacity-90 flex items-center gap-2 text-sm"
            >
              <Brain className="h-4 w-4" /> Generate AI Brief
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl grid grid-cols-12 gap-4 px-4 py-4">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium flex items-center gap-2"><ListFilter className="h-4 w-4"/>Trackers</div>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{demoData.trackers.length}</span>
              </div>
              <div className="h-[280px] pr-2 overflow-y-auto space-y-2">
                {demoData.trackers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTrackerId(t.id)}
                    className={`w-full text-left rounded-xl border p-3 transition hover:shadow ${activeTrackerId === t.id ? "border-slate-900 bg-slate-900 text-white" : "bg-white"}`}
                  >
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs opacity-70 mt-1 font-mono bg-black/10 p-1 rounded">
                      {t.query.length > 40 ? t.query.substring(0, 40) + '...' : t.query}
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-1 text-xs opacity-80">
                      <div>Mentions 7d: <span className="font-semibold">{fmt.format(t.kpi.mentions_7d)}</span></div>
                      <div>Alerts 24h: <span className="font-semibold">{t.kpi.alerts_24h}</span></div>
                      <div>SoV 7d: <span className="font-semibold">{t.kpi.sov_7d}%</span></div>
                      <div>Sent.: <span className="font-semibold">{t.kpi.sentiment_score}</span></div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <button 
                  onClick={() => setShowQueryBuilder(true)}
                  className="w-full px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 flex items-center gap-2 text-sm"
                >
                  <Search className="h-4 w-4"/>Edit Query
                </button>
                <button 
                  onClick={() => setShowAlertManager(true)}
                  className="w-full px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 flex items-center gap-2 text-sm"
                >
                  <Bell className="h-4 w-4"/>Alert Rules
                </button>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-xl border bg-white shadow-sm mt-4">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium flex items-center gap-2"><Bell className="h-4 w-4"/>Alerts</div>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{demoData.alerts.length}</span>
              </div>
              <div className="h-[260px] pr-2 overflow-y-auto space-y-2">
                {demoData.alerts.map((a) => (
                  <div key={a.id} className="rounded-xl border bg-white p-3 flex gap-2 items-start">
                    <AlertTriangle className="h-4 w-4 mt-0.5"/>
                    <div className="text-sm">
                      <div className="font-medium">
                        {a.type}
                        <span className={`ml-2 text-xxs uppercase tracking-wider px-2 py-0.5 rounded ${
                          a.severity === "high" ? "bg-rose-100 text-rose-700" :
                          a.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                        }`}>{a.severity}</span>
                      </div>
                      <div className="text-slate-600 mt-0.5">{a.message}</div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(a.fired_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 lg:col-span-9 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <div className="text-xs text-slate-500">Mentions (7d)</div>
              <div className="text-2xl font-semibold">{fmt.format(kpi.mentions_7d)}</div>
            </div>
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <div className="text-xs text-slate-500">Share of Voice (7d)</div>
              <div className="text-2xl font-semibold">{kpi.sov_7d}%</div>
            </div>
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <div className="text-xs text-slate-500">Sentiment Score</div>
              <div className="text-2xl font-semibold">{kpi.sentiment_score}</div>
            </div>
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <div className="text-xs text-slate-500">Alerts (24h)</div>
              <div className="text-2xl font-semibold">{kpi.alerts_24h}</div>
            </div>
          </div>
          
          {/* Topic Analysis Button */}
          <div className="rounded-xl border bg-white shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium mb-1">Topic & Trend Analysis</h3>
                <p className="text-sm text-gray-600">Discover trending topics, emerging themes, and conversation patterns</p>
              </div>
              <button
                onClick={() => setShowTopicAnalysis(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Target className="h-4 w-4" />
                Analyze Topics
              </button>
            </div>
            
            {/* Quick Topic Preview */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {demoData.topics.slice(0, 3).map((topic) => (
                <div key={topic.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{topic.name}</span>
                    {topic.trending === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                    {topic.trending === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                  </div>
                  <div className="text-xs text-gray-600">
                    {fmt.format(topic.mentions_7d)} mentions
                    <span className={`ml-2 ${topic.change_7d > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {topic.change_7d > 0 ? '+' : ''}{topic.change_7d.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <div className="mb-2 font-medium">Volume Timeline (14 hari)</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={demoData.volumeTimeline} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="c2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="c3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffc658" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="contoso" stroke="#8884d8" fill="url(#c1)" name="Contoso" />
                    <Area type="monotone" dataKey="fabrikam" stroke="#82ca9d" fill="url(#c2)" name="Fabrikam" />
                    <Area type="monotone" dataKey="northwind" stroke="#ffc658" fill="url(#c3)" name="Northwind" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border bg-white shadow-sm p-4">
              <div className="mb-2 font-medium">Sentiment (harian, Contoso)</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demoData.sentimentTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pos" stackId="a" name="Positif" fill="#10b981" />
                    <Bar dataKey="neu" stackId="a" name="Netral" fill="#6b7280" />
                    <Bar dataKey="neg" stackId="a" name="Negatif" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Share of Voice + Top Domains */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <div className="mb-2 font-medium">Share of Voice (7 hari)</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={demoData.shareOfVoice7d} innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                      {demoData.shareOfVoice7d.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border bg-white shadow-sm p-4">
              <div className="mb-2 font-medium">Top Domains</div>
              <div className="space-y-2">
                {demoData.topDomains.map((d, i) => (
                  <div key={d.domain} className="flex items-center justify-between rounded-xl border bg-white p-3">
                    <div className="flex items-center gap-2 text-sm"><Globe2 className="h-4 w-4"/> {i + 1}. {d.domain}</div>
                    <div className="text-sm font-semibold">{fmt.format(d.mentions)} mentions</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mentions Table */}
          <div className="rounded-xl border bg-white shadow-sm p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
              <div className="font-medium">Mentions</div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400"/>
                  <input
                    className="border rounded-lg pl-8 px-3 py-2 w-64 text-sm"
                    placeholder="Cari judul, domain, author…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <select className="border rounded-lg px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="news">News</option>
                  <option value="social">Social</option>
                  <option value="video">Video</option>
                  <option value="forum">Forum</option>
                </select>
                <select className="border rounded-lg px-3 py-2 text-sm" value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)}>
                  <option value="all">All Sentiments</option>
                  <option value="pos">Positif</option>
                  <option value="neu">Netral</option>
                  <option value="neg">Negatif</option>
                </select>
                <ExportCsvButton rows={filteredMentions} />
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden bg-white">
              <div className="grid grid-cols-12 gap-0 px-3 py-2 text-xs font-medium bg-slate-50 border-b">
                <div className="col-span-2">Sumber</div>
                <div className="col-span-6">Judul</div>
                <div className="col-span-2">Waktu</div>
                <div className="col-span-2">Sentiment</div>
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {filteredMentions.map((m) => (
                  <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="grid grid-cols-12 gap-0 px-3 py-3 border-b hover:bg-slate-50 transition">
                    <div className="col-span-2 text-sm">
                      <div className="font-medium capitalize">{m.source_type}</div>
                      <div className="text-xs text-slate-500">{m.domain}</div>
                    </div>
                    <div className="col-span-6 text-sm">
                      <div className="font-medium line-clamp-1">{m.title}</div>
                      <div className="text-xs text-slate-600 line-clamp-1">{m.content_snippet}</div>
                      <div className="text-xs text-slate-500 mt-0.5">by {m.author}</div>
                    </div>
                    <div className="col-span-2 text-xs text-slate-600 flex items-center">{new Date(m.posted_at).toLocaleString()}</div>
                    <div className="col-span-2 text-xs flex items-center">
                      <span className={`px-2 py-1 rounded ${sentimentColor(m.sentiment)}`}>{sentimentLabel(m.sentiment)}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Influencers */}
          <div className="rounded-xl border bg-white shadow-sm p-4">
            <div className="mb-2 font-medium flex items-center gap-2"><Users className="h-4 w-4"/>Top Influencers</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {demoData.topInfluencers.map((i) => (
                <div key={i.handle} className="rounded-xl border bg-white p-3">
                  <div className="text-sm font-semibold">{i.handle} <span className="ml-2 text-xs text-slate-500">({i.platform})</span></div>
                  <div className="mt-1 text-xs text-slate-600">Followers: <span className="font-medium">{fmt.format(i.followers)}</span></div>
                  <div className="text-xs text-slate-600">ER: <span className="font-medium">{(i.er * 100).toFixed(2)}%</span></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-xs text-slate-500">Demo UI • All data is synthetic (dummy)</div>
      
      {/* Modals */}
      {showQueryBuilder && (
        <BooleanQueryBuilder
          initialQuery={activeTracker.query}
          onSave={handleSaveQuery}
          onClose={() => setShowQueryBuilder(false)}
        />
      )}
      
      {showAlertManager && (
        <AlertRulesManager
          trackerId={activeTrackerId}
          onClose={() => setShowAlertManager(false)}
        />
      )}
      
      {showTopicAnalysis && (
        <TopicAnalysisPanel
          onClose={() => setShowTopicAnalysis(false)}
        />
      )}
      
      {showAutoBrief && (
        <AutoBriefGenerator
          trackerId={activeTrackerId}
          onClose={() => setShowAutoBrief(false)}
        />
      )}

      {showCrisisDetection && (
        <CrisisDetectionDashboard
          onClose={() => setShowCrisisDetection(false)}
        />
      )}

      {showCompetitiveIntel && (
        <CompetitiveIntelligenceDashboard
          onClose={() => setShowCompetitiveIntel(false)}
        />
      )}

      {showContentRecommendations && (
        <ContentRecommendationsDashboard
          onClose={() => setShowContentRecommendations(false)}
        />
      )}

      {showInfluencerTracking && (
        <InfluencerTrackingDashboard
          onClose={() => setShowInfluencerTracking(false)}
        />
      )}
    </div>
  );
}