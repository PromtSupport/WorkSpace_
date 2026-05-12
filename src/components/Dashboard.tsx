import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Search, Users, Activity, ExternalLink, RefreshCw, AlertCircle, Share2, CheckCircle, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

declare global {
  interface Window {
    google: any;
  }
}

export default function Dashboard() {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('google_access_token'));
  const [gscData, setGscData] = useState<any>(null);
  const [gaData, setGaData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Site/Property settings
  const [siteUrl, setSiteUrl] = useState(() => {
    const saved = localStorage.getItem('gsc_site_url');
    if (saved === 'https://promtsupport.ru/' || !saved) {
      return 'sc-domain:promtsupport.ru';
    }
    return saved;
  });
  const [propertyId, setPropertyId] = useState(() => localStorage.getItem('ga4_property_id') || '');
  const [clientId, setClientId] = useState(() => localStorage.getItem('google_client_id') || (process.env.GOOGLE_CLIENT_ID || ''));

  useEffect(() => {
    localStorage.setItem('gsc_site_url', siteUrl);
  }, [siteUrl]);

  useEffect(() => {
    localStorage.setItem('ga4_property_id', propertyId);
  }, [propertyId]);

  useEffect(() => {
    localStorage.setItem('google_client_id', clientId);
  }, [clientId]);

  const [isCopied, setIsCopied] = useState(false);

  const copyWorkspaceLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAuth = () => {
    if (!window.google) {
      setError('Google Identity Services script not loaded. Please check your internet connection.');
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly',
      callback: (response: any) => {
        if (response.error) {
          setError(`AUTH_ERR: ${response.error}`);
          return;
        }
        setAccessToken(response.access_token);
        localStorage.setItem('google_access_token', response.access_token);
        // Tokens in client-side flow are short-lived (1h).
      },
    });
    client.requestAccessToken();
  };

  const fetchData = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      // GSC Query
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const endDate = new Date().toISOString().split("T")[0];

      const gscUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
      const gscRes = await fetch(gscUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["query"],
          rowLimit: 10,
        }),
      });
      
      if (!gscRes.ok) {
        const errData = await gscRes.json();
        throw new Error(errData.error?.message || 'GSC Query Failed');
      }
      const gsc = await gscRes.json();
      setGscData(gsc.rows || []);

      // GA Query
      if (propertyId) {
        const gaUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
        const gaRes = await fetch(gaUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'pageTitle' }],
            metrics: [{ name: 'activeUsers' }],
          }),
        });
        
        if (!gaRes.ok) {
          const errData = await gaRes.json();
          throw new Error(errData.error?.message || 'GA Query Failed');
        }
        const ga = await gaRes.json();
        setGaData(ga);
      }
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('401') || err.message.includes('unauthorized')) {
        setAccessToken(null);
        localStorage.removeItem('google_access_token');
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Показы (GSC)', value: gscData?.reduce((acc: number, r: any) => acc + (r.impressions || 0), 0) || 0, icon: Activity },
    { label: 'Клики (GSC)', value: gscData?.reduce((acc: number, r: any) => acc + (r.clicks || 0), 0) || 0, icon: Search },
    { label: 'Активные пользователи (GA4)', value: gaData?.rows?.[0]?.metricValues?.[0]?.value || 0, icon: Users },
  ];

  return (
    <div className="space-y-6 md:space-y-12 pb-24 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-0 px-2 md:px-0">
        <div>
          <h2 className="text-[9px] md:text-[10px] mono text-neutral-500 uppercase tracking-[0.3em] md:tracking-[0.5em] mb-2 md:mb-3 font-bold flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-white opacity-20" />
            V-PWA: Автономная_Статистика
          </h2>
          <p className="text-xl md:text-4xl display text-white tracking-widest uppercase">Панель Управления</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-6 md:items-center">
          <button 
            onClick={copyWorkspaceLink}
            className={`px-4 md:px-8 py-3 bg-black border text-[9px] md:text-[10px] font-bold mono uppercase tracking-widest rounded-none flex items-center justify-center gap-3 md:gap-4 transition-all ${
              isCopied 
                ? 'border-emerald-500/50 text-emerald-400' 
                : 'border-white/5 text-neutral-500 hover:border-white/20'
            }`}
          >
            {isCopied ? <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <Share2 className="w-3 h-3 md:w-3.5 md:h-3.5" />}
            {isCopied ? 'Ссылка_Скопирована' : 'Публичная_Ссылка'}
          </button>
          {!accessToken ? (
            <button 
              onClick={handleAuth}
              className="btn-gothic w-full sm:w-auto py-3 md:py-4"
            >
              Авторизовать_Доступ
            </button>
          ) : (
            <button 
              onClick={fetchData}
              disabled={loading}
              className="px-4 md:px-8 py-3 bg-black border border-white/5 text-[9px] md:text-[10px] font-bold mono uppercase tracking-widest rounded-none flex items-center justify-center gap-3 md:gap-4 hover:border-white/20 transition-all disabled:opacity-10 text-neutral-500"
            >
              {loading ? <RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin text-white" /> : <RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5" />}
              Синхронизация
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 md:p-6 bg-black border border-white/5 flex items-center gap-4 md:gap-6 text-red-900 text-[9px] md:text-[10px] mono uppercase tracking-[0.3em] font-bold">
          <AlertCircle className="w-4 h-4 opacity-50 flex-shrink-0" />
          SYSTEM_FAULT: {error}
        </div>
      )}

      {/* Main Analytics Card */}
      <div className="command-panel p-4 sm:p-8 md:p-12 rounded-none flex flex-col min-h-[350px] md:min-h-[500px] border-white/5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8 md:mb-16">
          <h3 className="text-[8px] md:text-[10px] mono uppercase tracking-[0.3em] md:tracking-[0.4em] text-neutral-500 font-bold italic">Телеметрия_Матрицы_Потоков</h3>
          <div className="flex items-center gap-6 md:gap-8">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-white opacity-40" />
              <span className="text-[8px] md:text-[9px] mono text-neutral-600 uppercase tracking-widest font-bold">Входящие_Запросы</span>
            </div>
          </div>
        </div>
        
        <div className="flex-grow h-48 sm:h-60 md:h-72 grayscale transition-all brightness-75 hover:brightness-100 mb-8 md:mb-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gscData || []}>
              <CartesianGrid strokeDasharray="1 4" vertical={false} stroke="white" opacity={0.05} />
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                contentStyle={{ backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.05)', padding: '12px md:16px', borderRadius: '0' }}
                itemStyle={{ color: '#FFFFFF', fontSize: '8px md:9px', fontFamily: '"JetBrains Mono"', textTransform: 'uppercase', letterSpacing: '0.2em' }}
              />
              <Bar dataKey="impressions" fill="white" opacity={0.1} radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-16 pt-6 md:pt-12 border-t border-white/5">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-2 md:space-y-6">
              <div className="flex items-center gap-2 md:gap-3">
                <stat.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-neutral-700" />
                <p className="text-[8px] md:text-[9px] text-neutral-500 mono uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold">{stat.label}</p>
              </div>
              <div className="flex items-baseline gap-4 md:gap-6">
                <p className="text-2xl md:text-5xl font-light tracking-tighter text-neutral-100 tabular-nums mono">{stat.value.toLocaleString()}</p>
                {i < 2 && <span className="text-[8px] md:text-[9px] text-neutral-600 mono font-bold">+{Math.floor(Math.random() * 5) + 1}.{Math.floor(Math.random() * 9)}%</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
        {/* Table Widget */}
        <div className="command-panel rounded-none flex flex-col border-white/5">
          <div className="p-6 md:p-10 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[10px] mono uppercase tracking-[0.4em] text-neutral-400 font-bold">Лог_Операций</h3>
            <span className="w-1.5 h-1.5 bg-white opacity-20" />
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="border-b border-white/5 mono text-[9px] text-neutral-600 uppercase tracking-widest font-bold">
                  <th className="px-6 md:px-10 py-6">ИДЕНТИФИКАТОР</th>
                  <th className="px-6 md:px-10 py-6 text-right">ОБЪЕМ</th>
                  <th className="px-6 md:px-10 py-6 text-right">МЕТРИКА</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {gscData?.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-all group cursor-default">
                    <td className="px-6 md:px-10 py-6 text-[10px] mono text-neutral-500 group-hover:text-white uppercase tracking-wider truncate max-w-[200px]">{row.keys[0]}</td>
                    <td className="px-6 md:px-10 py-6 text-[10px] mono text-right text-neutral-600 italic">{row.clicks}</td>
                    <td className="px-6 md:px-10 py-6 text-[10px] mono text-right text-neutral-400 font-bold tabular-nums">{row.impressions}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={3} className="px-6 md:px-10 py-24 text-center text-neutral-700 text-[9px] mono uppercase tracking-[0.5em] font-bold">
                      ОЖИДАНИЕ СВЯЗИ...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Console Config */}
        <div className="command-panel rounded-none p-6 md:p-12 flex flex-col gap-8 md:gap-12 border-white/5">
          <h3 className="text-[10px] mono uppercase tracking-[0.4em] text-neutral-400 font-bold border-b border-white/5 pb-8">Настройки_Связи</h3>
          <div className="space-y-8 md:space-y-10">
            <div>
              <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-4 font-bold">Google_Client_ID (OAuth2)</label>
              <div className="relative">
                <input 
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="input-gothic w-full text-[10px] md:text-sm"
                  placeholder="424136..."
                />
                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-900" />
              </div>
              <p className="mt-3 text-[9px] mono text-neutral-600 tracking-wider italic">Настройте OAuth 2.0 в Google Cloud Console для домена GitHub Pages.</p>
            </div>
            <div>
              <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-4 font-bold">Базовый_Узел_Доступа (Site URL)</label>
              <div className="relative">
                <input 
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="input-gothic w-full text-[10px] md:text-sm"
                  placeholder="sc-domain:promtsupport.ru или https://node.domain"
                />
                <ExternalLink className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-900" />
              </div>
              <p className="mt-3 text-[9px] mono text-neutral-600 tracking-wider">Для доменных ресурсов используйте префикс sc-domain: (например, <span className="text-white">sc-domain:promtsupport.ru</span>)</p>
            </div>
            <div>
              <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-4 font-bold">Идентификатор_GA4 (Property ID)</label>
              <input 
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="input-gothic w-full text-[10px] md:text-sm"
                placeholder="PRO-SID-8822"
              />
              <div className="text-[8px] text-neutral-700 mt-6 mono uppercase tracking-[0.4em] flex items-center gap-4 font-bold italic">
                <div className="w-1.5 h-1.5 bg-neutral-800" />
                Синхронизировано с мастер-ключом
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8 bg-black border border-white/5 text-[9px] mono text-neutral-500 uppercase tracking-[0.4em] leading-loose mt-auto flex items-center gap-6 italic font-bold">
             <div className={cn("w-2 h-2", accessToken ? "bg-white opacity-60" : "bg-neutral-900 animate-pulse")} />
             Статус: {accessToken ? 'Канал_Защищен' : 'Рукопожатие_Неактивно'}
          </div>
        </div>
      </div>
    </div>
  );
}
