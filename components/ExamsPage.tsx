import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, where, Timestamp } from 'firebase/firestore';
import { signOut, User } from 'firebase/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
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

const TrendingDownIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const BookOpenIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const TargetIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
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

  // Chart data preparation
  const chartData = useMemo(() => {
    if (exams.length === 0) return { trendData: [], publicationData: [] };

    // Trend data (chronological)
    const trendData = exams
      .slice()
      .reverse() // Reverse to show chronological order
      .map((exam, index) => {
        const totalNet = [exam.turkce, exam.matematik, exam.fen, exam.inkilap, exam.din, exam.ingilizce]
          .reduce((sum, branch) => sum + (branch.dogru - branch.yanlis / 3), 0);
        
        return {
          name: exam.ad || `Deneme ${index + 1}`,
          date: exam.createdAt ? exam.createdAt.toDate().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) : '',
          'Toplam Net': Math.round(totalNet * 100) / 100,
          'Türkçe': Math.round((exam.turkce.dogru - exam.turkce.yanlis / 3) * 100) / 100,
          'Matematik': Math.round((exam.matematik.dogru - exam.matematik.yanlis / 3) * 100) / 100,
          'Fen': Math.round((exam.fen.dogru - exam.fen.yanlis / 3) * 100) / 100,
          'İnkılap': Math.round((exam.inkilap.dogru - exam.inkilap.yanlis / 3) * 100) / 100,
          'Din': Math.round((exam.din.dogru - exam.din.yanlis / 3) * 100) / 100,
          'İngilizce': Math.round((exam.ingilizce.dogru - exam.ingilizce.yanlis / 3) * 100) / 100,
        };
      });

    // Publication data (average per publication)
    const publicationData: { [key: string]: { totalNet: number; count: number } } = {};
    exams.forEach(exam => {
      const pub = exam.yayin || 'Diğer';
      const totalNet = [exam.turkce, exam.matematik, exam.fen, exam.inkilap, exam.din, exam.ingilizce]
        .reduce((sum, branch) => sum + (branch.dogru - branch.yanlis / 3), 0);
      
      if (!publicationData[pub]) {
        publicationData[pub] = { totalNet: 0, count: 0 };
      }
      publicationData[pub].totalNet += totalNet;
      publicationData[pub].count += 1;
    });

    const publicationChartData = Object.keys(publicationData).map(pub => ({
      name: pub,
      'Ortalama Net': Math.round((publicationData[pub].totalNet / publicationData[pub].count) * 100) / 100,
    }));

    return { trendData, publicationData: publicationChartData };
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
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={() => signOut(auth)} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={() => signOut(auth)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">LGS Deneme Sınavları</h1>
              <p className="text-gray-600">Deneme sınavı sonuçlarınızı takip edin ve performansınızı analiz edin</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAddModal({ isOpen: true })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <PlusIcon className="h-4 w-4" />
                Yeni Deneme Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Branş Trendleri (Son 20) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Branş Trendleri (Son 20)</h3>
              <p className="text-sm text-gray-600">Subject Performance Trend</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-2xl font-bold ${stats.recentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.recentChange >= 0 ? '+' : ''}{stats.recentChange.toFixed(1)}%
                </span>
                <span className="text-sm text-green-600">+5% vs Last 20 Exams</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  tick={{ fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Toplam Net" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={false}
                  fill="url(#colorGradient)"
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Yayın Bazlı Ortalama Puan */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Yayın Bazlı Ortalama Puan</h3>
              <p className="text-sm text-gray-600">Average Score by Publication</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl font-bold text-gray-900">{stats.avgNet}</span>
                <span className="text-sm text-green-600">+2% vs All Exams</span>
              </div>
            </div>
            <div className="space-y-3">
              {chartData.publicationData.slice(0, 5).map((pub, index) => (
                <div key={pub.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{pub.name}</span>
                  <div className="flex items-center gap-3 flex-1 ml-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (pub['Ortalama Net'] / 100) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                      {pub['Ortalama Net']}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deneme Sonuçları */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Deneme Sonuçları</h2>
            <p className="text-sm text-gray-600 mt-1">Exam Results</p>
          </div>
          
          {exams.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz deneme eklenmemiş</h3>
              <p className="text-gray-600 mb-6">İlk deneme sonucunuzu ekleyerek başlayın</p>
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
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EXAM NAME</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SUBJECT</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL SCORE</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">NET SCORE</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exams.map((exam, index) => {
                    const totalNet = [exam.turkce, exam.matematik, exam.fen, exam.inkilap, exam.din, exam.ingilizce]
                      .reduce((sum, branch) => sum + (branch.dogru - branch.yanlis / 3), 0);
                    
                    return (
                      <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {exam.ad || `TYT Deneme Sınavı ${index + 1}`}
                            </div>
                            {exam.yayin && (
                              <div className="text-sm text-gray-500">{exam.yayin}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {formatDate(exam.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">Genel</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {(totalNet * 5).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {totalNet.toFixed(2)}
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

        {/* Isı Haritası (Branş x Son 10) */}
        {exams.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Isı Haritası (Branş x Son 10)</h3>
              <p className="text-sm text-gray-600">Subject Performance Heat Map</p>
            </div>
            
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Header */}
                <div className="grid grid-cols-11 gap-2 mb-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider"></div>
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                      E{i + 1}
                    </div>
                  ))}
                </div>
                
                {/* Rows */}
                {['Math', 'Physics', 'History', 'Biology'].map((subject) => (
                  <div key={subject} className="grid grid-cols-11 gap-2 mb-2">
                    <div className="text-sm font-medium text-gray-700 py-2">{subject}</div>
                    {Array.from({ length: 10 }, (_, i) => {
                      const intensity = Math.random();
                      const bgColor = intensity > 0.7 ? 'bg-blue-600' : 
                                     intensity > 0.4 ? 'bg-blue-400' : 
                                     intensity > 0.2 ? 'bg-blue-200' : 'bg-blue-100';
                      return (
                        <div 
                          key={i} 
                          className={`h-8 rounded ${bgColor} transition-colors hover:opacity-80`}
                          title={`${subject} - Exam ${i + 1}: ${(intensity * 100).toFixed(0)}%`}
                        ></div>
                      );
                    })}
                  </div>
                ))}
                
                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-4">
                  <span className="text-xs text-gray-500">Less Correct</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-blue-100 rounded"></div>
                    <div className="w-3 h-3 bg-blue-200 rounded"></div>
                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  </div>
                  <span className="text-xs text-gray-500">More Correct</span>
                </div>
              </div>
            </div>
          </div>
        )}
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