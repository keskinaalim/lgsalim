import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, where, Timestamp } from 'firebase/firestore';
import { signOut, User } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import type { ExamResult } from '../types';
import Header from './Header';
import ExamAddModal from './ExamAddModal';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';

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

const BookOpenIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const PlusIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="3,6 5,6 21,6" />
    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const CalendarIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const AwardIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88" />
  </svg>
);

interface ExamsPageProps {
  user: User;
}

const ExamsPage: React.FC<ExamsPageProps> = ({ user }) => {
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState<{ isOpen: boolean; editData?: ExamResult }>({ isOpen: false });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id?: string; message?: string }>({ isOpen: false });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Data fetching
  useEffect(() => {
    const q = query(
      collection(db, 'exams'),
      where('kullaniciId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: ExamResult[] = [];
      snapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({
          id: doc.id,
          kullaniciId: docData.kullaniciId,
          createdAt: docData.createdAt,
          ad: docData.ad,
          yayin: docData.yayin,
          turkce: docData.turkce,
          matematik: docData.matematik,
          fen: docData.fen,
          inkilap: docData.inkilap,
          din: docData.din,
          ingilizce: docData.ingilizce,
        });
      });
      setExams(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Statistics calculation
  const stats = useMemo(() => {
    if (exams.length === 0) return { totalExams: 0, avgNet: 0, bestNet: 0, recentChange: 0 };

    const totalNets = exams.map(exam => {
      const branches = [exam.turkce, exam.matematik, exam.fen, exam.inkilap, exam.din, exam.ingilizce];
      return branches.reduce((sum, branch) => sum + (branch.dogru - branch.yanlis / 3), 0);
    });

    const avgNet = totalNets.reduce((sum, net) => sum + net, 0) / totalNets.length;
    const bestNet = Math.max(...totalNets);

    // Recent change calculation (last 3 vs previous 3)
    let recentChange = 0;
    if (totalNets.length >= 6) {
      const recent3 = totalNets.slice(0, 3).reduce((sum, net) => sum + net, 0) / 3;
      const previous3 = totalNets.slice(3, 6).reduce((sum, net) => sum + net, 0) / 3;
      recentChange = recent3 - previous3;
    }

    return {
      totalExams: exams.length,
      avgNet: Math.round(avgNet * 100) / 100,
      bestNet: Math.round(bestNet * 100) / 100,
      recentChange: Math.round(recentChange * 100) / 100
    };
  }, [exams]);

  // Branch analysis
  const branchAnalysis = useMemo(() => {
    if (exams.length === 0) return [];

    const branches = ['turkce', 'matematik', 'fen', 'inkilap', 'din', 'ingilizce'] as const;
    const branchNames = ['Türkçe', 'Matematik', 'Fen Bilimleri', 'T.C. İnkılap', 'Din Kültürü', 'İngilizce'];

    return branches.map((branch, index) => {
      const nets = exams.map(exam => {
        const b = exam[branch];
        return b.dogru - b.yanlis / 3;
      });
      
      const avgNet = nets.reduce((sum, net) => sum + net, 0) / nets.length;
      const bestNet = Math.max(...nets);
      const worstNet = Math.min(...nets);
      
      return {
        name: branchNames[index],
        avgNet: Math.round(avgNet * 100) / 100,
        bestNet: Math.round(bestNet * 100) / 100,
        worstNet: Math.round(worstNet * 100) / 100,
        color: index === 0 ? '#3B82F6' : index === 1 ? '#10B981' : index === 2 ? '#F59E0B' : 
               index === 3 ? '#EF4444' : index === 4 ? '#8B5CF6' : '#06B6D4'
      };
    });
  }, [exams]);

  // Event handlers
  const handleAddExam = async (payload: any) => {
    try {
      if (addModal.editData) {
        await updateDoc(doc(db, 'exams', addModal.editData.id), {
          ...payload,
          kullaniciId: user.uid,
        });
        setToast({ message: 'Deneme başarıyla güncellendi!', type: 'success' });
      } else {
        await addDoc(collection(db, 'exams'), {
          ...payload,
          kullaniciId: user.uid,
          createdAt: Timestamp.now(),
        });
        setToast({ message: 'Deneme başarıyla eklendi!', type: 'success' });
      }
    } catch (error) {
      setToast({ message: 'İşlem sırasında hata oluştu.', type: 'error' });
    }
  };

  const handleDeleteExam = (id: string) => {
    setConfirmModal({
      isOpen: true,
      id,
      message: 'Bu deneme sonucunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal.id) return;
    try {
      await deleteDoc(doc(db, 'exams', confirmModal.id));
      setToast({ message: 'Deneme başarıyla silindi!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Deneme silinirken hata oluştu.', type: 'error' });
    }
    setConfirmModal({ isOpen: false });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">LGS Deneme Sınavları</h1>
              <p className="text-slate-600">Deneme sınavı sonuçlarınızı takip edin ve performansınızı analiz edin</p>
            </div>
            <button
              onClick={() => setAddModal({ isOpen: true })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <PlusIcon className="h-4 w-4" />
              Yeni Deneme Ekle
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Toplam Deneme</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalExams}</p>
                <p className="text-xs text-slate-500 mt-1">Çözülen deneme sayısı</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpenIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TargetIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Ortalama Net</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.avgNet}</p>
                <p className="text-xs text-slate-500 mt-1">Tüm denemeler ortalaması</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TargetIcon className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AwardIcon className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">En İyi Net</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.bestNet}</p>
                <p className="text-xs text-slate-500 mt-1">Şimdiye kadarki en yüksek</p>
              </div>
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <AwardIcon className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className={`h-5 w-5 ${stats.recentChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Son 3 Değişim</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className={`text-2xl font-bold ${stats.recentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.recentChange >= 0 ? '+' : ''}{stats.recentChange}
                </p>
                <p className="text-xs text-slate-500 mt-1">Son 3 vs önceki 3</p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stats.recentChange >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <TrendingUpIcon className={`h-4 w-4 ${stats.recentChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Branch Analysis */}
        {branchAnalysis.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Branş Analizi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branchAnalysis.map((branch) => (
                <div key={branch.name} className="p-4 border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: branch.color }}
                    ></div>
                    <h3 className="font-medium text-slate-900">{branch.name}</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Ortalama:</span>
                      <span className="font-medium text-slate-900">{branch.avgNet}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">En İyi:</span>
                      <span className="font-medium text-green-600">{branch.bestNet}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">En Düşük:</span>
                      <span className="font-medium text-red-600">{branch.worstNet}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exams Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Deneme Sonuçları</h2>
            <p className="text-sm text-slate-600 mt-1">Tüm deneme sınavı sonuçlarınız</p>
          </div>
          
          {exams.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpenIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Henüz deneme eklenmemiş</h3>
              <p className="text-slate-600 mb-6">İlk deneme sonucunuzu ekleyerek başlayın</p>
              <button
                onClick={() => setAddModal({ isOpen: true })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4" />
                İlk Denemeyi Ekle
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deneme</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tarih</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Türkçe</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Matematik</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Fen</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">İnkılap</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Din</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">İngilizce</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Toplam Net</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {exams.map((exam, index) => {
                    const totalNet = [exam.turkce, exam.matematik, exam.fen, exam.inkilap, exam.din, exam.ingilizce]
                      .reduce((sum, branch) => sum + (branch.dogru - branch.yanlis / 3), 0);
                    
                    return (
                      <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-slate-900">
                              {exam.ad || `Deneme ${index + 1}`}
                            </div>
                            {exam.yayin && (
                              <div className="text-sm text-slate-500">{exam.yayin}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <CalendarIcon className="h-4 w-4" />
                            {formatDate(exam.createdAt)}
                          </div>
                        </td>
                        {[exam.turkce, exam.matematik, exam.fen, exam.inkilap, exam.din, exam.ingilizce].map((branch, branchIndex) => {
                          const net = branch.dogru - branch.yanlis / 3;
                          return (
                            <td key={branchIndex} className="px-6 py-4 text-center">
                              <div className="text-sm">
                                <div className="font-medium text-slate-900">{net.toFixed(1)}</div>
                                <div className="text-xs text-slate-500">
                                  {branch.dogru}D {branch.yanlis}Y {branch.bos}B
                                </div>
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 text-center">
                          <div className="font-semibold text-lg text-slate-900">
                            {totalNet.toFixed(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setAddModal({ isOpen: true, editData: exam })}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() => handleDeleteExam(exam.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ExamAddModal
        isOpen={addModal.isOpen}
        onClose={() => setAddModal({ isOpen: false })}
        onSave={handleAddExam}
        title={addModal.editData ? 'Deneme Düzenle' : 'Yeni Deneme Ekle'}
        initialData={addModal.editData}
      />

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

export default ExamsPage;