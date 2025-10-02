import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, where, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../services/firebase';
import type { MistakeEntry } from '../types';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';
import { getCourseTopics } from '../data/topics';

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

    return { total, todayReview, reviewed, archived };
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
    return ['all', ...topics];
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Hata Defteri 📚</h1>
          <p className="text-slate-600">Yaptığın hataları takip et ve tekrar ederek öğrenmeyi pekiştir</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
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

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
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

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
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

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
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
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">🔥 Bugün Tekrar Edilecekler</h2>
                <p className="text-amber-100 mb-4">
                  {todayReviewMistakes.length} hatan bugün tekrar edilmeyi bekliyor!
                </p>
              </div>
              <div className="text-3xl font-bold">
                {todayReviewMistakes.length}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {todayReviewMistakes.slice(0, 3).map((mistake) => (
                <div key={mistake.id} className="bg-white bg-opacity-20 rounded-lg p-4">
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-6">
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