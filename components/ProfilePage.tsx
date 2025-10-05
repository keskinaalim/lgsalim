import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { signOut, User, updatePassword, updateEmail } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import type { TestResult } from '../types';
import Header from './Header';
import Toast from './Toast';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const UserIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const KeyIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const AwardIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88" />
  </svg>
);

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

const CalendarIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

interface ProfilePageProps {
  user: User;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

  useEffect(() => {
    const q = query(collection(db, 'testSonuclari'), where('kullaniciId', '==', user.uid));
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
  }, [user.uid]);

  const stats = useMemo(() => {
    if (results.length === 0) {
      return {
        totalTests: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalWrong: 0,
        avgScore: 0,
        bestScore: 0,
        recentTests: 0,
      };
    }

    const totalQuestions = results.reduce((sum, r) => sum + r.dogruSayisi + r.yanlisSayisi + r.bosSayisi, 0);
    const totalCorrect = results.reduce((sum, r) => sum + r.dogruSayisi, 0);
    const totalWrong = results.reduce((sum, r) => sum + r.yanlisSayisi, 0);

    const scores = results.map(r => {
      const total = r.dogruSayisi + r.yanlisSayisi + r.bosSayisi;
      const net = r.dogruSayisi - r.yanlisSayisi / 4;
      return total > 0 ? (Math.max(0, net) / total) * 100 : 0;
    });

    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);

    const today = new Date();
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentTests = results.filter(r => {
      if (!r.createdAt) return false;
      return r.createdAt.toDate() >= last7Days;
    }).length;

    return {
      totalTests: results.length,
      totalQuestions,
      totalCorrect,
      totalWrong,
      avgScore: Math.round(avgScore),
      bestScore: Math.round(bestScore),
      recentTests,
    };
  }, [results]);

  const subjectPerformance = useMemo(() => {
    const subjects: { [key: string]: { correct: number; wrong: number; total: number } } = {};

    results.forEach(r => {
      if (!subjects[r.dersAdi]) {
        subjects[r.dersAdi] = { correct: 0, wrong: 0, total: 0 };
      }
      subjects[r.dersAdi].correct += r.dogruSayisi;
      subjects[r.dersAdi].wrong += r.yanlisSayisi;
      subjects[r.dersAdi].total += r.dogruSayisi + r.yanlisSayisi + r.bosSayisi;
    });

    return Object.keys(subjects).map(subject => ({
      name: subject,
      correct: subjects[subject].correct,
      wrong: subjects[subject].wrong,
      percentage: subjects[subject].total > 0
        ? Math.round((subjects[subject].correct / subjects[subject].total) * 100)
        : 0
    })).sort((a, b) => b.percentage - a.percentage);
  }, [results]);

  const monthlyActivity = useMemo(() => {
    const last6Months: { [key: string]: number } = {};
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
      last6Months[key] = 0;
    }

    results.forEach(r => {
      if (r.createdAt) {
        const date = r.createdAt.toDate();
        const key = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
        if (last6Months[key] !== undefined) {
          last6Months[key]++;
        }
      }
    });

    return Object.keys(last6Months).map(month => ({
      name: month,
      tests: last6Months[month]
    }));
  }, [results]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const getMemberSince = () => {
    if (user.metadata.creationTime) {
      return new Date(user.metadata.creationTime).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Bilinmiyor';
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Profilim</h1>
          <p className="text-slate-600">Hesap bilgilerin ve performans özetin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                  {getInitials(user.email || '')}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{user.email?.split('@')[0]}</h2>
                <p className="text-sm text-slate-600 mb-2">{user.email}</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Aktif Öğrenci
                </span>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
                <div className="flex items-center text-sm text-slate-600">
                  <CalendarIcon className="h-4 w-4 mr-3 text-slate-400" />
                  <span>Üyelik: {getMemberSince()}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <MailIcon className="h-4 w-4 mr-3 text-slate-400" />
                  <span>{user.emailVerified ? 'Email Doğrulandı' : 'Email Doğrulanmadı'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
              <h3 className="text-xl font-bold mb-4">Performans Özeti</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.totalTests}</div>
                  <div className="text-sm text-blue-100">Toplam Test</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.avgScore}%</div>
                  <div className="text-sm text-blue-100">Ortalama</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.bestScore}%</div>
                  <div className="text-sm text-blue-100">En İyi</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.recentTests}</div>
                  <div className="text-sm text-blue-100">Son 7 Gün</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TargetIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Toplam Soru</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalQuestions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUpIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Doğru</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalCorrect}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AwardIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Yanlış</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalWrong}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Branş Performansı</h3>
            {subjectPerformance.length > 0 ? (
              <div className="space-y-3">
                {subjectPerformance.map((subject, index) => (
                  <div key={subject.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{subject.name}</span>
                      <span className="text-sm font-bold text-slate-900">{subject.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                          width: `${subject.percentage}%`
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-500">Doğru: {subject.correct}</span>
                      <span className="text-xs text-slate-500">Yanlış: {subject.wrong}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>Henüz test sonucu bulunmuyor</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Aylık Aktivite</h3>
            {monthlyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="tests" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>Henüz aktivite bulunmuyor</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Hesap Ayarları</h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MailIcon className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900">Email Adresi</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TargetIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">LGS Hedefin</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Şu ana kadar {stats.totalTests} test çözdün ve ortalama %{stats.avgScore} başarı oranına ulaştın.
                    Hedefine ulaşmak için düzenli çalışmaya devam et!
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-blue-800">Mevcut: %{stats.avgScore}</span>
                    <span className="text-xs text-blue-600">→</span>
                    <span className="text-xs font-medium text-blue-800">Hedef: %100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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

export default ProfilePage;
