import React, { useState, useEffect, useMemo } from 'react';
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

// Modern Icons
const TrendingUpIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
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

const PlusIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
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

  // Course options
  const courseOptions = useMemo(() => {
    const courses = Array.from(new Set(filteredData.map(r => r.dersAdi))).sort();
    return ['all', ...courses];
  }, [filteredData]);

  // User statistics
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

    return {
      avgScore,
      totalTests: userData.length,
      recentChange,
      targetRemaining: Math.max(0, 480 - avgScore)
    };
  }, [results, user.uid]);

  // Risk calculation
  const riskLevel = useMemo(() => {
    const { avgScore, recentChange } = userStats;
    if (avgScore >= 400 && recentChange >= 0) return { level: 'Düşük', value: 25, color: '#48BB78' };
    if (avgScore >= 350 && recentChange >= -5) return { level: 'Orta', value: 50, color: '#F6AD55' };
    return { level: 'Yüksek', value: 75, color: '#F56565' };
  }, [userStats]);

  // Badge calculation
  const earnedBadges = useMemo((): BadgeKey[] => {
    const userData = results.filter(r => r.kullaniciId === user.uid);
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Öğrenci Performans Paneli</h1>
              <p className="text-slate-600">Akademik gelişiminizi takip edin ve hedeflerinize ulaşın</p>
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Ortalama Puan"
            value={userStats.avgScore}
            icon={<TargetIcon className="h-4 w-4" />}
            badgeLabel={<ScopeBadge scope="self" />}
            infoTitle="Son 20 test ortalaması"
          />
          <StatCard
            title="Son 5 Değişim"
            value={`${userStats.recentChange >= 0 ? '+' : ''}${userStats.recentChange.toFixed(1)}%`}
            icon={<TrendingUpIcon className={`h-4 w-4 ${userStats.recentChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />}
            badgeLabel={<ScopeBadge scope="self" />}
            infoTitle="Son 5 ve önceki 5 test karşılaştırması"
          />
          <StatCard
            title="Hedefe Kalan"
            value={userStats.targetRemaining}
            icon={<FlagIcon className="h-4 w-4" />}
            badgeLabel={<ScopeBadge scope="self" />}
            infoTitle="480 puan hedefine kalan mesafe"
          />
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

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-slate-200">
            {[
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
          <div className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <TimeSeriesChart
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
                  height={300}
                  onEnlarge={() => setChartModal({ isOpen: true, type: 'courses' })}
                  scopeBadge={<ScopeBadge scope={scope} />}
                />
              </div>
            </div>

            {/* Performance Cards */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <PerformanceCards data={filteredData} scopeBadge={<ScopeBadge scope={scope} />} />
            </div>

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
                  <h3 className="text-sm font-semibold text-slate-900">Rozetler</h3>
                  <LevelBadge level="giris" compact />
                </div>
                <BadgesBar earned={earnedBadges} compact={false} />
              </div>
            </div>
          </div>
        )}

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
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Test Sonuçları</h2>
                  <p className="text-sm text-slate-600 mt-1">Tüm test sonuçlarınızı detaylı olarak görüntüleyin</p>
                </div>
                <div className="flex items-center gap-3">
                  <ScopeBadge scope={scope} showText />
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
        dersAdi={mistakeModal.result?.dersAdi || ''}
        topicOptions={getCourseTopics(mistakeModal.result?.dersAdi || '')}
        onClose={() => setMistakeModal({ isOpen: false })}
        onSave={handleSaveMistake}
      />

      <ChartModal
        isOpen={chartModal.isOpen}
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
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;