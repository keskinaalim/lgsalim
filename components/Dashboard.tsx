import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, RadialBarChart, RadialBar } from 'recharts';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, where, Timestamp } from 'firebase/firestore';
import { signOut, User } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import type { TestResult, MistakeEntry } from '../types';
import Header from './Header';
import TestResultsTable from './TestResultsTable';
import TimeSeriesChart from './TimeSeriesChart';
import CourseSuccessChart from './CourseSuccessChart';
import PerformanceCards from './PerformanceCards';
import RankingSummary from './RankingSummary';
import QuickStats from './QuickStats';
import InsightsCards from './InsightsCards';
import BadgesBar from './BadgesBar';
import LevelBadge from './LevelBadge';
import ScopeBadge, { ScopeType } from './ScopeBadge';
import StatCard from './StatCard';
import CourseSelect from './CourseSelect';
import QuickAddModal from './QuickAddModal';
import MistakeModal from './MistakeModal';
import ChartModal from './ChartModal';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';
import { getCourseTopics } from '../data/topics';
import type { BadgeKey } from './BadgesBar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Additional Icons
const CalendarDaysIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
  </svg>
);

// Modern Icons
const TrendingUpIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendingDownIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const TargetIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const FlagIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const AlertTriangleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const BookIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const BrainIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

const ClockIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

const AwardIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88" />
  </svg>
);

const PlusIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const FireIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
  </svg>
);

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'trend' | 'courses' | 'table' | 'heatmap'>('trend');
  const [scope, setScope] = useState<ScopeType>('self');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [mistakeModal, setMistakeModal] = useState<{ isOpen: boolean; result?: TestResult }>({ isOpen: false });
  const [chartModal, setChartModal] = useState<{ isOpen: boolean; type?: 'timeseries' | 'courses' }>({ isOpen: false });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id?: string; message?: string }>({ isOpen: false });
  const [sortConfig, setSortConfig] = useState<{ key: keyof TestResult; direction: 'ascending' | 'descending' } | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [studyStreak, setStudyStreak] = useState(0);

  // Data fetching
  useEffect(() => {
    const q = query(collection(db, 'testSonuclari'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: TestResult[] = [];
      snapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({
          id: doc.id,
          dersAdi: docData.dersAdi,
          dogruSayisi: docData.dogruSayisi,
          yanlisSayisi: docData.yanlisSayisi,
          bosSayisi: docData.bosSayisi || 0,
          kullaniciId: docData.kullaniciId,
          kullaniciEmail: docData.kullaniciEmail,
          createdAt: docData.createdAt,
          topics: docData.topics || [],
        });
      });
      setResults(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Mistakes data
  useEffect(() => {
    const q = query(collection(db, 'mistakes'), where('kullaniciId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: MistakeEntry[] = [];
      snapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({
          id: doc.id,
          kullaniciId: docData.kullaniciId,
          testResultId: docData.testResultId,
          dersAdi: docData.dersAdi,
          topics: docData.topics || [],
          note: docData.note || '',
          imageUrl: docData.imageUrl,
          createdAt: docData.createdAt,
          nextReviewAt: docData.nextReviewAt,
          status: docData.status || 'open',
        });
      });
      setMistakes(data);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Filtered data based on scope
  const filteredData = useMemo(() => {
    return scope === 'self' ? results.filter(r => r.kullaniciId === user.uid) : results;
  }, [results, scope, user.uid]);

  // Study streak calculation
  useEffect(() => {
    const userData = results.filter(r => r.kullaniciId === user.uid);
    const today = new Date();
    const dateSet = new Set<string>();
    
    userData.forEach(r => {
      if (r.createdAt) {
        const dt = new Date(r.createdAt.toDate());
        const key = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).toISOString().slice(0, 10);
        dateSet.add(key);
      }
    });
    
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10);
      if (dateSet.has(key)) {
        streak++;
      } else {
        break;
      }
    }
    
    setStudyStreak(streak);
  }, [results, user.uid]);

  // Course options
  const courseOptions = useMemo(() => {
    const courses = Array.from(new Set(filteredData.map(r => r.dersAdi))).sort();
    return ['all', ...courses];
  }, [filteredData]);

  // User statistics
  // User statistics with more detailed calculations
  const userStats = useMemo(() => {
    const userData = results.filter(r => r.kullaniciId === user.uid);
    if (userData.length === 0) return { avgScore: 0, totalTests: 0, recentChange: 0, targetRemaining: 480 };

    const totalScore = userData.reduce((sum, r) => {
      const total = r.dogruSayisi + r.yanlisSayisi + r.bosSayisi;
      const net = r.dogruSayisi - r.yanlisSayisi / 4;
      return sum + (total > 0 ? (Math.max(0, net) / total) * 100 : 0);
    }, 0);
    
    const avgScore = Math.round(totalScore / userData.length);
    
    // Recent 5 vs previous 5 comparison
    const recent5 = userData.slice(0, 5);
    const previous5 = userData.slice(5, 10);
    
    let recentChange = 0;
    if (recent5.length > 0 && previous5.length > 0) {
      const recentAvg = recent5.reduce((sum, r) => {
        const total = r.dogruSayisi + r.yanlisSayisi + r.bosSayisi;
        const net = r.dogruSayisi - r.yanlisSayisi / 4;
        return sum + (total > 0 ? (Math.max(0, net) / total) * 100 : 0);
      }, 0) / recent5.length;
      
      const previousAvg = previous5.reduce((sum, r) => {
        const total = r.dogruSayisi + r.yanlisSayisi + r.bosSayisi;
        const net = r.dogruSayisi - r.yanlisSayisi / 4;
        return sum + (total > 0 ? (Math.max(0, net) / total) * 100 : 0);
      }, 0) / previous5.length;
      
      recentChange = recentAvg - previousAvg;
    }

    const totalQuestions = userData.reduce((sum, r) => sum + r.dogruSayisi + r.yanlisSayisi + r.bosSayisi, 0);
    const totalCorrect = userData.reduce((sum, r) => sum + r.dogruSayisi, 0);
    const totalWrong = userData.reduce((sum, r) => sum + r.yanlisSayisi, 0);

    return {
      avgScore,
      totalTests: userData.length,
      recentChange,
      totalQuestions,
      totalCorrect,
      totalWrong,
      targetRemaining: Math.max(0, 480 - avgScore)
    };
  }, [results, user.uid]);

  // Risk calculation
  const riskLevel = useMemo(() => {
    const { avgScore, recentChange } = userStats;
    if (avgScore >= 400 && recentChange >= 0) return { level: 'Düşük', value: 25, color: '#48BB78' };
    if (avgScore >= 350 && recentChange >= -5) return { level: 'Orta', value: 50, color: '#F6AD55' };
    if (avgScore >= 350 && recentChange >= -5) return { level: 'Orta', value: 50, color: '#F6AD55' };
    return { level: 'Yüksek', value: 75, color: '#F56565' };
  }, [userStats]);

  // Badge calculation
  const earnedBadges = useMemo((): BadgeKey[] => {
    const userData = results.filter(r => r.kullaniciId === user.uid);
    const badges: BadgeKey[] = [];
    const badges: BadgeKey[] = [];
    
    if (userData.length >= 1) badges.push('first_test');
    if (userData.length >= 5) badges.push('five_tests');
    
    // 7-day streak check
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateSet = new Set<string>();
    userData.forEach(r => {
      if (r.createdAt) {
        const dt = new Date(r.createdAt.toDate());
        const key = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).toISOString().slice(0, 10);
        dateSet.add(key);
      }
    });
    
    let streak = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10);
      if (dateSet.has(key)) streak++; else break;
    }
    
    if (streak >= 7) badges.push('seven_day_streak');
    return badges;
  }, [results, user.uid]);
  }, [results, user.uid]);

  // LGS Hedef Hesaplama
  const lgsTargetAnalysis = useMemo(() => {
    const userData = results.filter(r => r.kullaniciId === user.uid);
    if (userData.length === 0) return { currentScore: 0, targetScore: 480, remainingPoints: 480, successProbability: 0 };

    const totalScore = userData.reduce((sum, r) => {
      const total = r.dogruSayisi + r.yanlisSayisi + r.bosSayisi;
      const net = r.dogruSayisi - r.yanlisSayisi / 4;
      return sum + (total > 0 ? (Math.max(0, net) / total) * 500 : 0);
    }, 0);
    
    const currentScore = Math.round(totalScore / userData.length);
    const targetScore = 480;
    const remainingPoints = Math.max(0, targetScore - currentScore);
    const successProbability = Math.min(100, Math.max(0, (currentScore / targetScore) * 100));

    return { currentScore, targetScore, remainingPoints, successProbability };
  }, [results, user.uid]);

  // Branş Bazlı Detaylı Analiz
  // Branş Bazlı Detaylı Analiz
  const subjectAnalysis = useMemo(() => {
    const userData = results.filter(r => r.kullaniciId === user.uid);
    const subjects = ['Türkçe', 'Matematik', 'Fen Bilgisi', 'Sosyal Bilgiler', 'Din Kültürü', 'İngilizce'];
    
    return subjects.map(subject => {
      const subjectData = userData.filter(r => r.dersAdi === subject);
      if (subjectData.length === 0) return { subject, avgScore: 0, trend: 0, lastScore: 0, improvement: 0 };

      const scores = subjectData.map(r => {
        const total = r.dogruSayisi + r.yanlisSayisi + r.bosSayisi;
        const net = r.dogruSayisi - r.yanlisSayisi / 4;
        return total > 0 ? (Math.max(0, net) / total) * 100 : 0;
      });

      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const lastScore = scores[0] || 0;
      const prevScore = scores[1] || avgScore;
      const trend = lastScore - prevScore;
      const improvement = scores.length >= 3 ? scores[0] - scores[2] : 0;

      return { subject, avgScore: Math.round(avgScore), trend: Math.round(trend), lastScore: Math.round(lastScore), improvement: Math.round(improvement) };
    });
  }, [results, user.uid]);

  // Haftalık Çalışma Önerisi
  // Haftalık Çalışma Önerisi
  const weeklyStudyPlan = useMemo(() => {
    const weakSubjects = subjectAnalysis
      .filter(s => s.avgScore < 70)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 3);

    const strongSubjects = subjectAnalysis
      .filter(s => s.avgScore >= 80)
      .sort((a, b) => b.avgScore - a.avgScore);

    return {
      focusAreas: weakSubjects,
      maintainAreas: strongSubjects,
      dailyGoals: [
        'Her gün en az 2 saat çalışma',
        'Zayıf konulara günde 45 dakika ayır',
        'Güçlü konuları haftada 3 kez tekrar et',
        'Her hafta 2 deneme sınavı çöz'
      ]
    };
  }, [subjectAnalysis]);

  // Daily activity data for the last 30 days
  const dailyActivityData = useMemo(() => {
    const userData = results.filter(r => r.kullaniciId === user.uid);
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      
      const dayTests = userData.filter(r => {
        if (!r.createdAt) return false;
        const testDate = new Date(r.createdAt.toDate());
        return testDate.toISOString().slice(0, 10) === dateStr;
      });
      
      last30Days.push({
        date: dateStr,
        tests: dayTests.length,
        avgScore: dayTests.length > 0 ? 
          dayTests.reduce((sum, r) => {
            const total = r.dogruSayisi + r.yanlisSayisi + r.bosSayisi;
            const net = r.dogruSayisi - r.yanlisSayisi / 4;
            return sum + (total > 0 ? (Math.max(0, net) / total) * 100 : 0);
          }, 0) / dayTests.length : 0
      });
    }
    
    return last30Days;
  }, [results, user.uid]);

  // Subject distribution data
  const subjectDistributionData = useMemo(() => {
    const userData = results.filter(r => r.kullaniciId === user.uid);
    const distribution: { [key: string]: number } = {};
    
    userData.forEach(r => {
      distribution[r.dersAdi] = (distribution[r.dersAdi] || 0) + 1;
    });
    
    return Object.keys(distribution).map(subject => ({
      name: subject,
      value: distribution[subject],
      percentage: Math.round((distribution[subject] / userData.length) * 100)
    }));
  }, [results, user.uid]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Time of day analysis
  const timeAnalysisData = useMemo(() => {
    const userData = results.filter(r => r.kullaniciId === user.uid && r.createdAt);
    const timeSlots = {
      'Sabah (06-12)': 0,
      'Öğlen (12-18)': 0,
      'Akşam (18-24)': 0,
      'Gece (00-06)': 0
    };
    
    userData.forEach(r => {
      const hour = new Date(r.createdAt!.toDate()).getHours();
      if (hour >= 6 && hour < 12) timeSlots['Sabah (06-12)']++;
      else if (hour >= 12 && hour < 18) timeSlots['Öğlen (12-18)']++;
      else if (hour >= 18 && hour < 24) timeSlots['Akşam (18-24)']++;
      else timeSlots['Gece (00-06)']++;
    });
    
    return Object.keys(timeSlots).map(time => ({
      name: time,
      value: timeSlots[time as keyof typeof timeSlots],
      percentage: userData.length > 0 ? Math.round((timeSlots[time as keyof typeof timeSlots] / userData.length) * 100) : 0
    }));
  }, [results, user.uid]);

  // Event handlers
  const handleAddResult = async (dersAdi: string, dogruSayisi: number, yanlisSayisi: number, bosSayisi: number, topics: string[]) => {
    try {
      await addDoc(collection(db, 'testSonuclari'), {
        dersAdi,
        dogruSayisi,
        yanlisSayisi,
        bosSayisi,
        kullaniciId: user.uid,
        kullaniciEmail: user.email,
        createdAt: Timestamp.now(),
        topics: topics || [],
      });
      setToast({ message: 'Test sonucu başarıyla eklendi!', type: 'success' });
      setIsAdding(false);
    } catch (error) {
      setToast({ message: 'Test sonucu eklenirken hata oluştu.', type: 'error' });
    }
  };

  const handleUpdateResult = async (id: string, dersAdi: string, dogruSayisi: number, yanlisSayisi: number, bosSayisi: number, topics: string[]) => {
    try {
      await updateDoc(doc(db, 'testSonuclari', id), {
        dersAdi,
        dogruSayisi,
        yanlisSayisi,
        bosSayisi,
        topics: topics || [],
      });
      setToast({ message: 'Test sonucu başarıyla güncellendi!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Test sonucu güncellenirken hata oluştu.', type: 'error' });
    }
  };

  const handleDeleteResult = (id: string) => {
    setConfirmModal({
      isOpen: true,
      id,
      message: 'Bu test sonucunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal.id) return;
    try {
      await deleteDoc(doc(db, 'testSonuclari', confirmModal.id));
      setToast({ message: 'Test sonucu başarıyla silindi!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Test sonucu silinirken hata oluştu.', type: 'error' });
    }
    setConfirmModal({ isOpen: false });
  };

  const handleAddMistake = (result: TestResult) => {
    setMistakeModal({ isOpen: true, result });
  };

  const handleSaveMistake = async (payload: { topic: string | null; note: string; imageUrl?: string }) => {
    if (!mistakeModal.result) return;
    
    try {
      await addDoc(collection(db, 'mistakes'), {
        kullaniciId: user.uid,
        testResultId: mistakeModal.result.id,
        dersAdi: mistakeModal.result.dersAdi,
        topics: payload.topic ? [payload.topic] : [],
        note: payload.note,
        imageUrl: payload.imageUrl,
        createdAt: Timestamp.now(),
        status: 'open',
      });
      setToast({ message: 'Hata defterine başarıyla eklendi!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Hata defterine eklenirken hata oluştu.', type: 'error' });
    }
  };

  const requestSort = (key: keyof TestResult) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedResults = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header user={user} onLogout={() => signOut(auth)} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header user={user} onLogout={() => signOut(auth)} />
      
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">LGS Hazırlık Paneli</h1>
              <p className="text-slate-600">LGS hedefine giden yolda performansını takip et ve başarıya ulaş</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Hızlı Ekle
              </button>
              <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
                <button
                  onClick={() => setScope('self')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    scope === 'self' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kendim
                </button>
                <button
                  onClick={() => setScope('school')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    scope === 'school' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Okul Geneli
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LGS Hedef Kartı */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">LGS Hedef Takibi</h2>
              <p className="text-blue-100 mb-4">Mevcut durumun ve hedefe olan mesafen</p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{lgsTargetAnalysis.currentScore}</div>
                  <div className="text-sm text-blue-100">Mevcut Puan</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{lgsTargetAnalysis.remainingPoints}</div>
                  <div className="text-sm text-blue-100">Hedefe Kalan</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">%{Math.round(lgsTargetAnalysis.successProbability)}</div>
                  <div className="text-sm text-blue-100">Başarı Olasılığı</div>
                </div>
              </div>
            </div>
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray={`${lgsTargetAnalysis.successProbability}, 100`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <TargetIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Ortalama Puan"
            value={userStats.avgScore}
            icon={<TargetIcon className="h-4 w-4" />}
            badgeLabel={<ScopeBadge scope="self" />}
            infoTitle="Son 20 test ortalaması"
          />
          <StatCard
            title="Toplam Test"
            value={userStats.totalTests}
            icon={<ClipboardListIcon className="h-4 w-4" />}
            badgeLabel={<ScopeBadge scope="self" />}
            infoTitle="Çözülen toplam test sayısı"
          />
          <StatCard
            title="Son 5 Değişim"
            value={`${userStats.recentChange >= 0 ? '+' : ''}${userStats.recentChange.toFixed(1)}%`}
            icon={<TrendingUpIcon className={`h-4 w-4 ${userStats.recentChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />}
            badgeLabel={<ScopeBadge scope="self" />}
            infoTitle="Son 5 ve önceki 5 test karşılaştırması"
          />
          <StatCard
            title="Çalışma Serisi"
            value={`${studyStreak} gün`}
            icon={<FireIcon className="h-4 w-4" />}
            badgeLabel={<ScopeBadge scope="self" />}
            infoTitle="Peş peşe çalışma günü sayısı"
          />
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Toplam Soru"
            value={userStats.totalQuestions}
            icon={<BookIcon className="h-4 w-4" />}
            badgeLabel={<ScopeBadge scope="self" />}
            infoTitle="Çözülen toplam soru sayısı"
          />
          <StatCard
            title="Doğru Sayısı"
            value={userStats.totalCorrect}
            icon={<CheckCircleIcon className="h-4 w-4" />}
            badgeLabel={<ScopeBadge scope="self" />}
            infoTitle="Toplam doğru cevap sayısı"
          />
          <StatCard
            title="Yanlış Sayısı"
            value={userStats.totalWrong}
            icon={<XCircleIcon className="h-4 w-4" />}
            badgeLabel={<ScopeBadge scope="self" />}
            infoTitle="Toplam yanlış cevap sayısı"
          />
          <StatCard
            title="Hedefe Kalan"
            value={userStats.targetRemaining}
            icon={<FlagIcon className="h-4 w-4" />}
            badgeLabel={<ScopeBadge scope="self" />}
            infoTitle="480 puan hedefine kalan mesafe"
          />
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        </div>

        {/* Risk Analysis Card */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            {/* Daily Activity Chart */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Son 30 Gün Aktivite</h3>
                  <p className="text-slate-600 text-sm mt-1">Günlük test çözme alışkanlığın</p>
                </div>
                <ScopeBadge scope="self" showText />
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={10}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis fontSize={10} />
                  <Tooltip 
                    labelFormatter={(value) => {
                      const date = new Date(value as string);
                      return date.toLocaleDateString('tr-TR');
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'tests' ? `${value} test` : `%${Math.round(value as number)}`,
                      name === 'tests' ? 'Test Sayısı' : 'Ortalama Başarı'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tests" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Risk Seviyesi</span>
              </div>
              <ScopeBadge scope="self" />
            </div>
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={riskLevel.color}
                  strokeWidth="2"
                  strokeDasharray={`${riskLevel.value}, 100`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-900">{riskLevel.level}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Performans ve trend analizi
            </p>
          </div>
        </div>

        {/* Subject Analysis and Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subject Distribution Pie Chart */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Branş Dağılımı</h3>
                <p className="text-slate-600 text-sm mt-1">Hangi derslerde daha çok test çözdüğün</p>
              </div>
              <ScopeBadge scope="self" showText />
            </div>
            
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={subjectDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subjectDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string, props: any) => [
                  `${value} test (%${props.payload.percentage})`,
                  props.payload.name
                ]} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              {subjectDistributionData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-slate-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Time Analysis */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Çalışma Saatleri</h3>
                <p className="text-slate-600 text-sm mt-1">Hangi saatlerde daha verimli olduğun</p>
              </div>
              <ScopeBadge scope="self" showText />
            </div>
            
            <div className="space-y-4">
              {timeAnalysisData.map((time, index) => (
                <div key={time.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">{time.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-1 ml-4">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${time.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 w-12 text-right">
                      {time.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Öneri</span>
              </div>
              <p className="text-sm text-blue-800">
                {timeAnalysisData.length > 0 && timeAnalysisData.reduce((max, current) => 
                  current.value > max.value ? current : max
                ).name} saatlerinde daha aktifsin. Bu saatleri verimli kullanmaya devam et!
              </p>
            </div>
          </div>
        </div>

        {/* Branş Performans Analizi */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Branş Performans Analizi</h2>
              <p className="text-slate-600 text-sm mt-1">Her derste gösterdiğin performansın detaylı analizi</p>
            </div>
            <ScopeBadge scope="self" showText />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectAnalysis.map((subject) => (
              <div key={subject.subject} className="bg-slate-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{subject.subject}</h3>
                  <div className={`flex items-center gap-1 text-sm ${subject.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {subject.trend >= 0 ? <TrendingUpIcon className="h-4 w-4" /> : <TrendingDownIcon className="h-4 w-4" />}
                    {subject.trend >= 0 ? '+' : ''}{subject.trend}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Ortalama</span>
                    <span className="font-semibold">%{subject.avgScore}</span>
                    <span className="font-semibold">%{subject.avgScore}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        subject.avgScore >= 80 ? 'bg-green-500' : 
                        subject.avgScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, subject.avgScore)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Son Sınav: %{subject.lastScore}</span>
                    <span>Gelişim: {subject.improvement >= 0 ? '+' : ''}{subject.improvement}%</span>
                    <span>Gelişim: {subject.improvement >= 0 ? '+' : ''}{subject.improvement}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Haftalık Çalışma Planı */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <BrainIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Akıllı Çalışma Önerisi</h2>
              <p className="text-slate-600 text-sm">Performansına göre özelleştirilmiş haftalık plan</p>
              <p className="text-slate-600 text-sm">Performansına göre özelleştirilmiş haftalık plan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-red-500" />
                Odaklanman Gereken Alanlar
              </h3>
              </h3>
              <div className="space-y-2">
                {weeklyStudyPlan.focusAreas.map((area) => (
                  <div key={area.subject} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <span className="font-medium text-red-900">{area.subject}</span>
                    <span className="text-sm text-red-600">%{area.avgScore}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <FlagIcon className="h-4 w-4 text-green-500" />
                Günlük Hedefler
              </h3>
              <div className="space-y-2">
                {weeklyStudyPlan.dailyGoals.map((goal, index) => (
                {weeklyStudyPlan.dailyGoals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <span className="text-green-900">{goal}</span>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-slate-200">
            {[
              { key: 'trend', label: 'Trend Analizi', icon: TrendingUpIcon },
              { key: 'trend', label: 'Trend Analizi', icon: TrendingUpIcon },
              { key: 'courses', label: 'Branş Analizi', icon: BookIcon },
              { key: 'table', label: 'Detaylı Tablo', icon: BrainIcon },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'trend' && (
        {activeTab === 'trend' && (
          <>
          <div className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Puan Gelişim Trendi</h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTimeRange}
                      onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                      className="text-sm border border-slate-300 rounded-md px-2 py-1"
                    >
                      <option value="7">Son 7 Gün</option>
                      <option value="30">Son 30 Gün</option>
                      <option value="90">Son 90 Gün</option>
                      <option value="all">Tümü</option>
                    </select>
                  </div>
                </div>
                <TimeSeriesChart
                  data={filteredData}
                  data={filteredData}
                  height={300}
                  showFilter={true}
                  onEnlarge={() => setChartModal({ isOpen: true, type: 'timeseries' })}
                  scopeBadge={<ScopeBadge scope={scope} />}
                />
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <CourseSuccessChart
                  data={filteredData}
                  data={filteredData}
                  height={300}
                  onEnlarge={() => setChartModal({ isOpen: true, type: 'courses' })}
                  scopeBadge={<ScopeBadge scope={scope} />}
                />
              </div>
            </div>

            {/* LGS Branş Radar Grafiği */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">LGS Branş Radar Analizi</h3>
                  <p className="text-slate-600 text-sm mt-1">Tüm branşlardaki performansının 360° görünümü</p>
                </div>
                <ScopeBadge scope="self" showText />
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={subjectAnalysis}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Radar
                    name="Ortalama Performans"
                    name="Ortalama Performans"
                    dataKey="avgScore"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Son Sınav"
                    name="Son Sınav"
                    dataKey="lastScore"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Cards */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <PerformanceCards data={filteredData} scopeBadge={<ScopeBadge scope={scope} />} />
            </div>

            {/* Additional Insights */}
            {/* Additional Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <InsightsCards data={results} currentUserId={user.uid} />
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <QuickStats data={filteredData} currentUserId={user.uid} />
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">Rozetler</h3>
                  <LevelBadge level="giris" compact />
                </div>
                <BadgesBar earned={earnedBadges} compact={false} />
              </div>
            </div>
          </div>

            {/* Motivasyon ve Başarı Takibi */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Başarı Yolculuğun</h3>
                  <p className="text-purple-100 mb-4">LGS'ye hazırlık sürecindeki gelişimin</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{userStats.totalTests}</div>
                      <div className="text-2xl font-bold">{userStats.totalTests}</div>
                      <div className="text-sm text-purple-100">Çözülen Test</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{earnedBadges.length}</div>
                      <div className="text-sm text-purple-100">Kazanılan Rozet</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{Math.max(0, Math.round((480 - userStats.avgScore) / 10))}</div>
                      <div className="text-2xl font-bold">{Math.max(0, Math.round((480 - userStats.avgScore) / 10))}</div>
                      <div className="text-sm text-purple-100">Hafta Kaldı</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">%{Math.round(lgsTargetAnalysis.successProbability)}</div>
                      <div className="text-sm text-purple-100">Hedef Yakınlık</div>
                    </div>
                  </div>
                </div>
                </div>
                
                <div className="hidden md:block">
                  <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <TargetIcon className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-purple-400">
                <div className="flex items-center justify-between">
                  <span className="text-purple-100">LGS Hedefe İlerleme</span>
                  <span className="font-bold">%{Math.round(lgsTargetAnalysis.successProbability)}</span>
                </div>
                <div className="mt-2 w-full bg-purple-400 rounded-full h-3">
                  <div 
                    className="bg-white h-3 rounded-full transition-all duration-1000"
                    className="bg-white h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${lgsTargetAnalysis.successProbability}%` }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'courses' && (
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <CourseSelect
                options={courseOptions}
                value={selectedCourse}
                onChange={setSelectedCourse}
                placeholder="Ders seçin"
              />
              <ScopeBadge scope={scope} showText />
            </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <CourseSuccessChart
                  data={selectedCourse === 'all' ? filteredData : filteredData.filter(r => r.dersAdi === selectedCourse)}
                  height={400}
                  scopeBadge={<ScopeBadge scope={scope} />}
                />
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <RankingSummary data={results} currentUserId={user.uid} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'table' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Test Sonuçları</h2>
                  <p className="text-sm text-slate-600 mt-1">Tüm test sonuçlarınızı detaylı olarak görüntüleyin</p>
                </div>
                <div className="flex items-center gap-3">
                  <ScopeBadge scope={scope} showText />
                  <button
                  <button
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Yeni Sonuç Ekle
                  </button>
                </div>
              </div>
            </div>
            </div>
            <TestResultsTable
              results={sortedResults}
              currentUserId={user.uid}
              onDelete={handleDeleteResult}
              onAddResult={handleAddResult}
              onUpdateResult={handleUpdateResult}
              onAddMistake={handleAddMistake}
              currentUserEmail={user.email || ''}
              isAdding={isAdding}
              onCancelAdd={() => setIsAdding(false)}
              sortConfig={sortConfig}
              requestSort={requestSort}
              isCompact={false}
            />
          </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSave={handleAddResult}
        courseOptions={courseOptions.filter(c => c !== 'all')}
        defaultCourse={selectedCourse}
      />

      <MistakeModal
        isOpen={mistakeModal.isOpen}
        isOpen={mistakeModal.isOpen}
        dersAdi={mistakeModal.result?.dersAdi || ''}
        topicOptions={getCourseTopics(mistakeModal.result?.dersAdi || '')}
        onClose={() => setMistakeModal({ isOpen: false })}
        onSave={handleSaveMistake}
      />

      <ChartModal
        isOpen={chartModal.isOpen}
        onClose={() => setChartModal({ isOpen: false })}
        onClose={() => setChartModal({ isOpen: false })}
      >
        {chartModal.type === 'timeseries' && (
          <TimeSeriesChart
            data={filteredData}
            height={500}
            showFilter={true}
            showEnlarge={false}
            scopeBadge={<ScopeBadge scope={scope} />}
          />
        )}
        {chartModal.type === 'courses' && (
          <CourseSuccessChart
            data={filteredData}
            height={500}
            showEnlarge={false}
            scopeBadge={<ScopeBadge scope={scope} />}
          />
        )}
      </ChartModal>


      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message || ''}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />

      {toast && (
        <Toast
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};


export default Dashboard;