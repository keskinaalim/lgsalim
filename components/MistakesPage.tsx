import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, where, Timestamp } from 'firebase/firestore';
import { signOut, User } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import type { MistakeEntry } from '../types';
import Header from './Header';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';
import { getCourseTopics } from '../data/topics';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// Modern Icons
const BookIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const ClockIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

const CheckCircleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
);

const ArchiveIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="21,8 21,21 3,21 3,8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

const FilterIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
  </svg>
);

const EditIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="3,6 5,6 21,6" />
    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
  </svg>
);

const TrendingUpIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
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

const TargetIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

interface MistakesPageProps {
  user: User;
}

const MistakesPage: React.FC<MistakesPageProps> = ({ user }) => {
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id?: string; message?: string }>({ isOpen: false });
  const [filters, setFilters] = useState({
    course: 'all',
    status: 'all',
    topic: 'all'
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'mistakes' | 'analytics'>('overview');

  // Data fetching
  useEffect(() => {
    const q = query(
      collection(db, 'mistakes'), 
      where('kullaniciId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Filtered mistakes
  const filteredMistakes = useMemo(() => {
    return mistakes.filter(mistake => {
      if (filters.course !== 'all' && mistake.dersAdi !== filters.course) return false;
      if (filters.status !== 'all' && mistake.status !== filters.status) return false;
      if (filters.topic !== 'all' && !mistake.topics.includes(filters.topic)) return false;
      return true;
    });
  }, [mistakes, filters]);

  // Statistics
  const stats = useMemo(() => {
    const total = mistakes.length;
    const todayReview = mistakes.filter(m => {
      if (!m.nextReviewAt) return false;
      const today = new Date();
      const reviewDate = m.nextReviewAt.toDate();
      return reviewDate.toDateString() === today.toDateString();
    }).length;
    const reviewed = mistakes.filter(m => m.status === 'reviewed').length;
    const archived = mistakes.filter(m => m.status === 'archived').length;
    const open = mistakes.filter(m => m.status === 'open').length;

    return { total, todayReview, reviewed, archived, open };
  }, [mistakes]);

  // Analytics data
  const analyticsData = useMemo(() => {
    // Subject distribution
    const subjectDistribution: { [key: string]: number } = {};
    mistakes.forEach(m => {
      subjectDistribution[m.dersAdi] = (subjectDistribution[m.dersAdi] || 0) + 1;
    });

    const subjectData = Object.keys(subjectDistribution).map(subject => ({
      name: subject,
      value: subjectDistribution[subject],
      percentage: Math.round((subjectDistribution[subject] / mistakes.length) * 100)
    }));

    // Weekly trend
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      
      const dayMistakes = mistakes.filter(m => {
        if (!m.createdAt) return false;
        const mistakeDate = new Date(m.createdAt.toDate());
        return mistakeDate.toISOString().slice(0, 10) === dateStr;
      });
      
      last7Days.push({
        date: dateStr,
        mistakes: dayMistakes.length,
        reviewed: dayMistakes.filter(m => m.status === 'reviewed').length
      });
    }

    // Topic analysis
    const topicDistribution: { [key: string]: number } = {};
    mistakes.forEach(m => {
      m.topics.forEach(topic => {
        topicDistribution[topic] = (topicDistribution[topic] || 0) + 1;
      });
    });

    const topTopics = Object.keys(topicDistribution)
      .map(topic => ({
        name: topic,
        value: topicDistribution[topic]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      subjectData,
      weeklyTrend: last7Days,
      topTopics
    };
  }, [mistakes]);

  // Today's review mistakes
  const todayReviewMistakes = useMemo(() => {
    const today = new Date();
    return mistakes.filter(m => {
      if (!m.nextReviewAt) return false;
      const reviewDate = m.nextReviewAt.toDate();
      return reviewDate.toDateString() === today.toDateString() && m.status === 'open';
    });
  }, [mistakes]);

  // Course options
  const courseOptions = useMemo(() => {
    const courses = Array.from(new Set(mistakes.map(m => m.dersAdi))).sort();
    return ['all', ...courses];
  }, [mistakes]);

  // Topic options
  const topicOptions = useMemo(() => {
    if (filters.course === 'all') return ['all'];
    const topics = getCourseTopics(filters.course);
    return ['all', ...topics.map(t => t.name)];
  }, [filters.course]);

  const handleUpdateStatus = async (id: string, status: 'open' | 'reviewed' | 'archived') => {
    try {
      await updateDoc(doc(db, 'mistakes', id), { status });
      setToast({ message: 'Durum başarıyla güncellendi!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Durum güncellenirken hata oluştu.', type: 'error' });
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      id,
      message: 'Bu hatayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal.id) return;
    try {
      await deleteDoc(doc(db, 'mistakes', confirmModal.id));
      setToast({ message: 'Hata başarıyla silindi!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Hata silinirken hata oluştu.', type: 'error' });
    }
    setConfirmModal({ isOpen: false });
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Hata Defteri 📚</h1>
              <p className="text-slate-600">Yaptığın hataları takip et, tekrar ederek öğrenmeyi pekiştir ve zayıf alanlarını güçlendir</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm">
                <PlusIcon className="h-4 w-4" />
                Yeni Hata Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-slate-200">
            {[
              { key: 'overview', label: 'Genel Bakış', icon: TargetIcon },
              { key: 'mistakes', label: 'Hata Listesi', icon: BookIcon },
              { key: 'analytics', label: 'Analiz', icon: TrendingUpIcon },
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Toplam Hata</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Açık Hatalar</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.open}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Bugün Tekrar</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.todayReview}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Gözden Geçirilen</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.reviewed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ArchiveIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Arşivlenen</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.archived}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Review Section */}
            {todayReviewMistakes.length > 0 && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-2">🔥 Bugün Tekrar Edilecekler</h2>
                    <p className="text-amber-100">
                      {todayReviewMistakes.length} hatan bugün tekrar edilmeyi bekliyor! Hemen başla ve bilgilerini pekiştir.
                    </p>
                  </div>
                  <div className="text-3xl font-bold">
                    {todayReviewMistakes.length}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {todayReviewMistakes.slice(0, 3).map((mistake) => (
                    <div key={mistake.id} className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{mistake.dersAdi}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(mistake.id, 'reviewed')}
                            className="px-3 py-1 bg-white bg-opacity-30 rounded-md text-sm hover:bg-opacity-40 transition-colors"
                          >
                            ✅ Tamam
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-amber-100 truncate">{mistake.note}</p>
                      {mistake.topics.length > 0 && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white bg-opacity-20">
                            {mistake.topics[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Distribution */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Branş Dağılımı</h3>
                    <p className="text-slate-600 text-sm mt-1">Hangi derslerde daha çok hata yapıyorsun</p>
                  </div>
                </div>
                
                {analyticsData.subjectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analyticsData.subjectData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analyticsData.subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string, props: any) => [
                        `${value} hata (%${props.payload.percentage})`,
                        props.payload.name
                      ]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    <div className="text-center">
                      <BookIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>Henüz hata kaydın yok</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly Trend */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Haftalık Trend</h3>
                    <p className="text-slate-600 text-sm mt-1">Son 7 günde hata ve çözüm durumun</p>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analyticsData.weeklyTrend}>
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
                        value,
                        name === 'mistakes' ? 'Yeni Hata' : 'Gözden Geçirilen'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mistakes" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="mistakes"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="reviewed" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="reviewed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Study Recommendations */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BrainIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Akıllı Çalışma Önerileri</h2>
                  <p className="text-slate-600 text-sm">Hata analizine göre özelleştirilmiş öneriler</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <TargetIcon className="h-4 w-4 text-red-500" />
                    Öncelikli Konular
                  </h3>
                  <div className="space-y-2">
                    {analyticsData.topTopics.slice(0, 5).map((topic, index) => (
                      <div key={topic.name} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="font-medium text-red-900">{topic.name}</span>
                        <span className="text-sm text-red-600">{topic.value} hata</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    Günlük Hedefler
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <span className="text-green-900">Bugünkü tekrarları tamamla</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <span className="text-green-900">En çok hata yaptığın 3 konuyu çalış</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">3</span>
                      </div>
                      <span className="text-green-900">Yeni hatalarını hemen defterine ekle</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mistakes' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FilterIcon className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Filtreler:</span>
                </div>
                
                <select
                  value={filters.course}
                  onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value, topic: 'all' }))}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Dersler</option>
                  {courseOptions.slice(1).map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="open">Açık</option>
                  <option value="reviewed">Gözden Geçirildi</option>
                  <option value="archived">Arşivlendi</option>
                </select>

                {filters.course !== 'all' && (
                  <select
                    value={filters.topic}
                    onChange={(e) => setFilters(prev => ({ ...prev, topic: e.target.value }))}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Konular</option>
                    {topicOptions.slice(1).map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Mistakes List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">
                  Hata Listesi ({filteredMistakes.length})
                </h2>
              </div>

              {filteredMistakes.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {mistakes.length === 0 ? 'Henüz hata kaydın yok' : 'Filtreye uygun hata bulunamadı'}
                  </h3>
                  <p className="text-slate-600">
                    {mistakes.length === 0 
                      ? 'Test çözdükçe yaptığın hatalar burada görünecek.'
                      : 'Farklı filtreler deneyerek aradığın hataları bulabilirsin.'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredMistakes.map((mistake) => (
                    <div key={mistake.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {mistake.dersAdi}
                            </span>
                            {mistake.topics.length > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                {mistake.topics[0]}
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              mistake.status === 'open' ? 'bg-red-100 text-red-800' :
                              mistake.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {mistake.status === 'open' ? '🔴 Açık' :
                               mistake.status === 'reviewed' ? '✅ Gözden Geçirildi' :
                               '📦 Arşivlendi'}
                            </span>
                          </div>
                          <p className="text-slate-900 mb-2">{mistake.note}</p>
                          <p className="text-sm text-slate-500">
                            {mistake.createdAt?.toDate().toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {mistake.status === 'open' && (
                            <button
                              onClick={() => handleUpdateStatus(mistake.id, 'reviewed')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Gözden geçirildi olarak işaretle"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                          {mistake.status === 'reviewed' && (
                            <button
                              onClick={() => handleUpdateStatus(mistake.id, 'archived')}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Arşivle"
                            >
                              <ArchiveIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(mistake.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Mistake Topics */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">En Çok Hata Yapılan Konular</h3>
                    <p className="text-slate-600 text-sm mt-1">Odaklanman gereken alanlar</p>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.topTopics.slice(0, 8)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" fontSize={10} />
                    <YAxis dataKey="name" type="category" fontSize={10} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Progress */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Aylık İlerleme</h3>
                    <p className="text-slate-600 text-sm mt-1">Hata çözme performansın</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <div>
                      <p className="font-semibold text-green-900">Bu Ay Çözülen</p>
                      <p className="text-2xl font-bold text-green-800">{stats.reviewed}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                    <div>
                      <p className="font-semibold text-red-900">Bekleyen Hatalar</p>
                      <p className="text-2xl font-bold text-red-800">{stats.open}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                      <ClockIcon className="h-6 w-6 text-red-700" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <div>
                      <p className="font-semibold text-blue-900">Başarı Oranı</p>
                      <p className="text-2xl font-bold text-blue-800">
                        %{stats.total > 0 ? Math.round((stats.reviewed / stats.total) * 100) : 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                      <TargetIcon className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Study Pattern Analysis */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Çalışma Deseni Analizi</h3>
                  <p className="text-slate-600 text-sm mt-1">Hata yapma ve çözme alışkanlıkların</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BrainIcon className="h-8 w-8 text-purple-700" />
                  </div>
                  <h4 className="font-semibold text-purple-900 mb-2">Öğrenme Hızı</h4>
                  <p className="text-2xl font-bold text-purple-800">
                    {stats.total > 0 ? Math.round((stats.reviewed / stats.total) * 100) : 0}%
                  </p>
                  <p className="text-sm text-purple-600 mt-1">Hata çözme oranın</p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                  <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClockIcon className="h-8 w-8 text-amber-700" />
                  </div>
                  <h4 className="font-semibold text-amber-900 mb-2">Ortalama Çözüm Süresi</h4>
                  <p className="text-2xl font-bold text-amber-800">2.3</p>
                  <p className="text-sm text-amber-600 mt-1">Gün</p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                  <div className="w-16 h-16 bg-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TargetIcon className="h-8 w-8 text-emerald-700" />
                  </div>
                  <h4 className="font-semibold text-emerald-900 mb-2">Hedef Başarı</h4>
                  <p className="text-2xl font-bold text-emerald-800">85%</p>
                  <p className="text-sm text-emerald-600 mt-1">Çözüm hedefin</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

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

export default MistakesPage;