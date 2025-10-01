import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, query, updateDoc, where, Timestamp } from 'firebase/firestore';
import { signOut, User } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import Header from './Header';
import type { MistakeEntry } from '../types';

interface MistakesPageProps {
  user: User;
}

const MistakesPage: React.FC<MistakesPageProps> = ({ user }) => {
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'reviewed' | 'archived'>('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const todayStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'mistakes'),
      where('kullaniciId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const items: MistakeEntry[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        items.push({
          id: d.id,
          kullaniciId: data.kullaniciId,
          testResultId: data.testResultId,
          dersAdi: data.dersAdi,
          topics: data.topics || [],
          note: data.note || '',
          imageUrl: data.imageUrl || undefined,
          createdAt: data.createdAt,
          nextReviewAt: data.nextReviewAt,
          status: data.status || 'open',
        });
      });
      // sort client-side by createdAt desc
      items.sort((a, b) => {
        const ta = (a.createdAt && (a.createdAt.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime())) || 0;
        const tb = (b.createdAt && (b.createdAt.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime())) || 0;
        return tb - ta;
      });
      setMistakes(items);
    });
    return () => unsub();
  }, [user.uid]);

  const courses = useMemo(() => {
    const s = new Set<string>();
    mistakes.forEach((m) => s.add(m.dersAdi));
    return ['all', ...Array.from(s)];
  }, [mistakes]);

  const topics = useMemo(() => {
    if (filterCourse === 'all') return ['all'];
    const s = new Set<string>();
    mistakes
      .filter((m) => m.dersAdi === filterCourse)
      .forEach((m) => (m.topics || []).forEach((t) => s.add(t)));
    return ['all', ...Array.from(s)];
  }, [mistakes, filterCourse]);

  const filtered = useMemo(() => {
    return mistakes.filter((m) => {
      if (filterCourse !== 'all' && m.dersAdi !== filterCourse) return false;
      if (filterTopic !== 'all' && !(m.topics || []).includes(filterTopic)) return false;
      if (filterStatus !== 'all' && m.status !== filterStatus) return false;
      if (search.trim()) {
        const txt = (m.note || '').toLowerCase();
        const q = search.toLowerCase();
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [mistakes, filterCourse, filterTopic, filterStatus, search]);

  const dueToday = useMemo(() => {
    const t0 = todayStart.getTime();
    return mistakes.filter((m) => {
      if (m.status !== 'open') return false;
      const nr = m.nextReviewAt as any;
      if (!nr) return true; // hiç planlanmamışsa bugün göster
      const ts = nr.toMillis ? nr.toMillis() : (typeof nr === 'number' ? nr : new Date(nr).getTime());
      return ts <= t0 + 24*60*60*1000 - 1; // bugün içinde veya geçmiş
    });
  }, [mistakes, todayStart]);

  const updateStatus = async (id: string, status: 'open' | 'reviewed' | 'archived') => {
    try {
      await updateDoc(doc(db, 'mistakes', id), { status });
      setToast({ message: 'Durum güncellendi.', type: 'success' });
      setTimeout(() => setToast(null), 1500);
    } catch (e) {
      setToast({ message: 'Durum güncellenemedi.', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    }
  };

  const postpone = async (id: string, days: number) => {
    try {
      const next = new Date();
      next.setDate(next.getDate() + days);
      await updateDoc(doc(db, 'mistakes', id), { nextReviewAt: Timestamp.fromDate(next) });
      setToast({ message: `Tekrar ${days} gün ertelendi.`, type: 'success' });
      setTimeout(() => setToast(null), 1500);
    } catch (e) {
      setToast({ message: 'Erteleme başarısız.', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    }
  };

  const smartReview = async (id: string, current?: MistakeEntry) => {
    try {
      // Spaced repetition: none -> 3g, <=3g -> 7g, <=7g -> 14g, else -> 30g
      let days = 3;
      if (current?.nextReviewAt) {
        const base = todayStart.getTime();
        const ts = (current.nextReviewAt as any).toMillis ? (current.nextReviewAt as any).toMillis() : new Date(current.nextReviewAt as any).getTime();
        const diffDays = Math.ceil((ts - base) / (24*60*60*1000));
        if (diffDays <= 3) days = 7; else if (diffDays <= 7) days = 14; else days = 30;
      }
      const next = new Date();
      next.setDate(next.getDate() + days);
      await updateDoc(doc(db, 'mistakes', id), { status: 'reviewed', nextReviewAt: Timestamp.fromDate(next) });
      setToast({ message: `Gözden geçirildi • sonraki: ${days} gün`, type: 'success' });
      setTimeout(() => setToast(null), 1500);
    } catch (e) {
      setToast({ message: 'Gözden geçirme başarısız.', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    }
  };

  const bulkPostpone = async (days: number) => {
    try {
      await Promise.all(dueToday.map(m => {
        const next = new Date();
        next.setDate(next.getDate() + days);
        return updateDoc(doc(db, 'mistakes', m.id), { nextReviewAt: Timestamp.fromDate(next) });
      }));
      setToast({ message: `Seçili ${dueToday.length} kayıt +${days}g ertelendi.`, type: 'success' });
      setTimeout(() => setToast(null), 1500);
    } catch (e) {
      setToast({ message: 'Toplu erteleme başarısız.', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    }
  };

  const bulkSmartReview = async () => {
    try {
      await Promise.all(dueToday.map(m => smartReview(m.id, m)));
      setToast({ message: `Seçili ${dueToday.length} kayıt gözden geçirildi.`, type: 'success' });
      setTimeout(() => setToast(null), 1500);
    } catch (e) {
      setToast({ message: 'Toplu gözden geçirme başarısız.', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={user} onLogout={() => signOut(auth)} />
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-16 py-4">
        {/* Bugün Tekrar Paneli */}
        <div className="bg-white border border-emerald-200 rounded-lg shadow-sm p-2.5 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-emerald-800">Bugün Tekrar</h2>
              <p className="text-[10px] text-gray-500">nextReviewAt bugün veya öncesi olan açık kayıtlar</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={()=>bulkPostpone(3)} className="px-1.5 py-0.5 text-[10px] border rounded">Tümü +3g</button>
              <button onClick={()=>bulkPostpone(7)} className="px-1.5 py-0.5 text-[10px] border rounded">Tümü +7g</button>
              <button onClick={bulkSmartReview} className="px-1.5 py-0.5 text-[10px] border rounded">Tümü Gözden</button>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{dueToday.length}</span>
            </div>
          </div>
          {dueToday.length === 0 ? (
            <p className="mt-2 text-[11px] text-gray-500">Bugün tekrar edilecek kayıt yok.</p>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100">
              {dueToday.slice(0, 8).map((m) => (
                <li key={m.id} className="py-1.5 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium text-gray-900">{m.dersAdi}</span>
                      {(m.topics || []).slice(0,1).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px]">{t}</span>
                      ))}
                    </div>
                    {m.note && <p className="text-[10px] text-gray-600 truncate">{m.note}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={()=>postpone(m.id, 3)} className="px-1.5 py-0.5 text-[10px] border rounded">+3g</button>
                    <button onClick={()=>postpone(m.id, 7)} className="px-1.5 py-0.5 text-[10px] border rounded">+7g</button>
                    <button onClick={()=>smartReview(m.id, m)} className="px-1.5 py-0.5 text-[10px] border rounded">Gözden</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">LGS Hata Defteri</h1>
            <p className="text-sm text-gray-600">Yanlış yaptığın soruları kaydet, tekrar et ve LGS'de aynı hatayı yapma</p>
          </div>
          <a href="#dashboard" className="text-sm text-blue-600 hover:underline font-medium">← Ana Panel</a>
        </div>

        {/* Hata Defteri İstatistikleri */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Hata</p>
                <p className="text-2xl font-bold text-gray-900">{mistakes.length}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-xl">📝</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bugün Tekrar</p>
                <p className="text-2xl font-bold text-amber-600">{dueToday.length}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-amber-600 text-xl">⏰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gözden Geçirilen</p>
                <p className="text-2xl font-bold text-green-600">{mistakes.filter(m => m.status === 'reviewed').length}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Arşivlenen</p>
                <p className="text-2xl font-bold text-gray-600">{mistakes.filter(m => m.status === 'archived').length}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 text-xl">📦</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="flex items-center gap-2">
              <select value={filterCourse} onChange={(e)=>{ setFilterCourse(e.target.value); setFilterTopic('all'); }} className="rounded border-gray-300 bg-white text-sm py-2 px-3">
                {courses.map(c => <option key={c} value={c}>{c==='all'?'Tüm Dersler':c}</option>)}
              </select>
              <select value={filterTopic} onChange={(e)=> setFilterTopic(e.target.value)} className="rounded border-gray-300 bg-white text-sm py-2 px-3">
                {topics.map(t => <option key={t} value={t}>{t==='all'?'Tüm Konular':t}</option>)}
              </select>
              <select value={filterStatus} onChange={(e)=> setFilterStatus(e.target.value as any)} className="rounded border-gray-300 bg-white text-sm py-2 px-3">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg shadow-sm p-4 mb-6">
                <option value="open">Açık</option>
                <option value="reviewed">Gözden</option>
              <h2 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
                <span className="text-xl">🔥</span>
                Bugün Tekrar Edilecekler
              <button onClick={()=>bulkPostpone(3)} className="px-3 py-1 text-sm bg-white border border-amber-300 rounded-md hover:bg-amber-50">Tümü +3 Gün</button>
              <button onClick={()=>bulkPostpone(7)} className="px-3 py-1 text-sm bg-white border border-amber-300 rounded-md hover:bg-amber-50">Tümü +7 Gün</button>
              <button onClick={bulkSmartReview} className="px-3 py-1 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700">Tümünü Gözden Geçir</button>
            <input value={search} onChange={(e)=> setSearch(e.target.value)} className="w-full sm:w-64 rounded border-gray-300 bg-white text-sm py-2 px-3" placeholder="Notlarda ara..." />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">📚</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz hata kaydı yok</h3>
              <p className="text-gray-600">Yanlış yaptığın soruları buraya ekleyerek tekrar edebilirsin</p>
            </div>
              <span className="text-4xl mb-2 block">🎉</span>
              <p className="text-amber-800 font-medium">Harika! Bugün tekrar edilecek hata yok.</p>
              <p className="text-sm text-amber-600 mt-1">Yeni hatalar eklemeyi unutma!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filtered.map((m) => (
                <li key={m.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{m.dersAdi}</span>
                      {(m.topics || []).slice(0,1).map(t => (
                        <span key={t} className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">{t}</span>
                      ))}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        m.status==='open'?'bg-amber-50 text-amber-700 border-amber-200': 
                        m.status==='reviewed'?'bg-green-50 text-green-700 border-green-200':
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {m.status === 'open' ? 'Açık' : m.status === 'reviewed' ? 'Gözden Geçirildi' : 'Arşivlendi'}
                      </span>
                    {m.note && <p className="text-sm text-gray-600 mt-1">{m.note}</p>}
                    {m.note && <p className="text-sm text-gray-600 mt-2">{m.note}</p>}
                    {m.imageUrl && (
                      <div className="mt-2">
                        <a href={m.imageUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:text-blue-800 underline">📷 Soru görselini aç</a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={()=>postpone(m.id, 3)} className="px-2 py-1 text-xs bg-gray-100 border rounded hover:bg-gray-200">+3 Gün</button>
                      <button onClick={()=>updateStatus(m.id,'open')} className="px-2 py-1 text-xs bg-amber-100 text-amber-800 border border-amber-300 rounded hover:bg-amber-200">Açık</button>
                    <button onClick={()=>smartReview(m.id, m)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Gözden Geçir</button>
                    {m.status !== 'reviewed' && (
                      <button onClick={()=>updateStatus(m.id,'reviewed')} className="px-2 py-1 text-xs bg-green-100 text-green-800 border border-green-300 rounded hover:bg-green-200">Gözden Geçir</button>
                    )}
                    {m.status !== 'archived' && (
                      <button onClick={()=>updateStatus(m.id,'archived')} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 border border-gray-300 rounded hover:bg-gray-200">Arşivle</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {toast && (
          <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white text-sm shadow-lg ${toast.type==='success'?'bg-green-600':'bg-red-600'}`}>{toast.message}</div>
        )}
      </main>
    </div>
  );
};

export default MistakesPage;
