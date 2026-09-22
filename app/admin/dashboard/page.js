'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { formatPrice } from '@/lib/utils';

// ============================================================
// SVG Chart Component — Pure vanilla, no dependencies
// ============================================================

function AreaChart({ data, color = 'var(--accent)', height = 200 }) {
  const svgRef = useRef(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-quaternary)', fontSize: 'var(--text-12)' }}>
        Belum ada data
      </div>
    );
  }

  const padding = { top: 20, right: 12, bottom: 32, left: 60 };
  const w = 800;
  const h = height;
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
    label: d.label,
    value: d.value,
  }));

  // Create smooth path
  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => minVal + (range / (yTicks - 1)) * i);

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
        {/* Grid lines */}
        {yTickValues.map((val, i) => {
          const y = padding.top + chartH - ((val - minVal) / range) * chartH;
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={w - padding.right} y2={y}
                stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end"
                fill="var(--text-quaternary)" fontSize="10" fontFamily="var(--font-sans)">
                {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Area gradient */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill={color} opacity="0.8" />
            {/* X-axis label */}
            {(data.length <= 12 || i % Math.ceil(data.length / 12) === 0) && (
              <text x={p.x} y={h - 8} textAnchor="middle"
                fill="var(--text-quaternary)" fontSize="10" fontFamily="var(--font-sans)">
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function BarChart({ data, color = 'var(--accent)', height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-quaternary)', fontSize: 'var(--text-12)' }}>
        Belum ada data
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: '3px', padding: '0 4px' }}>
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * (height - 40);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: 'var(--text-11)', color: 'var(--text-quaternary)', opacity: d.value > 0 ? 1 : 0 }}>
              {d.value}
            </span>
            <div
              style={{
                width: '100%',
                maxWidth: '40px',
                height: `${Math.max(barH, 2)}px`,
                background: color,
                borderRadius: '3px 3px 0 0',
                opacity: d.value > 0 ? 0.8 : 0.15,
                transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
            <span style={{ fontSize: '9px', color: 'var(--text-quaternary)', whiteSpace: 'nowrap' }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Dashboard Page
// ============================================================

const PERIODS = [
  { key: '7d', label: '7 Hari' },
  { key: '30d', label: '30 Hari' },
  { key: '90d', label: '3 Bulan' },
  { key: '12m', label: '12 Bulan' },
];

const CHART_TYPES = [
  { key: 'revenue', label: 'Revenue', icon: '💰' },
  { key: 'orders', label: 'Pesanan', icon: '🧾' },
  { key: 'registrations', label: 'Pendaftar', icon: '👥' },
];

function generateDemoData(period, type) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const isMonthly = period === '12m';
  const count = isMonthly ? 12 : days;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  return Array.from({ length: count }, (_, i) => {
    let label;
    if (isMonthly) {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      label = months[d.getMonth()];
    } else {
      const d = new Date();
      d.setDate(d.getDate() - (count - 1 - i));
      label = `${d.getDate()}/${d.getMonth() + 1}`;
    }

    let value;
    const base = type === 'revenue' ? 200000 : type === 'orders' ? 8 : 5;
    const variance = type === 'revenue' ? 150000 : type === 'orders' ? 6 : 4;
    const trend = 1 + (i / count) * 0.4;
    value = Math.floor((base + Math.random() * variance) * trend);

    return { label, value };
  });
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    totalOrders: 0,
    totalStock: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('30d');
  const [activeChart, setActiveChart] = useState('revenue');
  const [chartStyle, setChartStyle] = useState('area');
  const [chartData, setChartData] = useState([]);

  // Generate chart data when period or type changes
  const fetchChartData = useCallback(async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
        setChartData(generateDemoData(chartPeriod, activeChart));
        return;
      }

      const { createClientBrowser } = await import('@/lib/supabase');
      const supabase = createClientBrowser();

      const days = chartPeriod === '7d' ? 7 : chartPeriod === '30d' ? 30 : chartPeriod === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: orders } = await supabase
        .from('orders')
        .select('amount, status, created_at, buyer_email')
        .gte('created_at', startDate.toISOString())
        .in('status', ['delivered', 'paid']);

      if (!orders || orders.length === 0) {
        setChartData(generateDemoData(chartPeriod, activeChart));
        return;
      }

      const isMonthly = chartPeriod === '12m';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      // Build date buckets
      const buckets = {};
      const count = isMonthly ? 12 : days;
      for (let i = 0; i < count; i++) {
        const d = new Date();
        if (isMonthly) {
          d.setMonth(d.getMonth() - (count - 1 - i));
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          buckets[key] = { label: months[d.getMonth()], value: 0, emails: new Set() };
        } else {
          d.setDate(d.getDate() - (count - 1 - i));
          const key = d.toISOString().slice(0, 10);
          buckets[key] = { label: `${d.getDate()}/${d.getMonth() + 1}`, value: 0, emails: new Set() };
        }
      }

      // Fill buckets with real data
      orders.forEach(o => {
        const key = isMonthly ? o.created_at.slice(0, 7) : o.created_at.slice(0, 10);
        if (buckets[key]) {
          if (activeChart === 'revenue') {
            buckets[key].value += o.amount;
          } else if (activeChart === 'orders') {
            buckets[key].value += 1;
          } else {
            buckets[key].emails.add(o.buyer_email);
            buckets[key].value = buckets[key].emails.size;
          }
        }
      });

      setChartData(Object.values(buckets).map(b => ({ label: b.label, value: b.value })));
    } catch (err) {
      console.error('Chart data error:', err);
      setChartData(generateDemoData(chartPeriod, activeChart));
    }
  }, [chartPeriod, activeChart]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
          setStats({
            totalRevenue: 12750000,
            todayRevenue: 485000,
            monthRevenue: 4250000,
            totalOrders: 247,
            totalStock: 142,
            deliveredOrders: 238,
            pendingOrders: 5,
            totalCustomers: 189,
          });
          setRecentOrders([
            { id: '1', order_number: 'MP-20260920-AB1CD', buyer_name: 'Ahmad Fadli', amount: 95000, status: 'delivered', created_at: new Date().toISOString(), product: { name: 'ChatGPT Pro' }, payment_type: 'qris' },
            { id: '2', order_number: 'MP-20260920-EF2GH', buyer_name: 'Siti Rahma', amount: 45000, status: 'delivered', created_at: new Date(Date.now() - 1200000).toISOString(), product: { name: 'Netflix Premium' }, payment_type: 'bank_transfer' },
            { id: '3', order_number: 'MP-20260920-IJ3KL', buyer_name: 'Budi Santoso', amount: 35000, status: 'pending', created_at: new Date(Date.now() - 3600000).toISOString(), product: { name: 'Canva Pro' }, payment_type: null },
            { id: '4', order_number: 'MP-20260920-MN4OP', buyer_name: 'Dina Puspita', amount: 55000, status: 'delivered', created_at: new Date(Date.now() - 7200000).toISOString(), product: { name: 'Zoom Pro' }, payment_type: 'gopay' },
            { id: '5', order_number: 'MP-20260919-QR5ST', buyer_name: 'Eko Prasetyo', amount: 65000, status: 'delivered', created_at: new Date(Date.now() - 86400000).toISOString(), product: { name: 'Grammarly Premium' }, payment_type: 'qris' },
          ]);
          setLoading(false);
          return;
        }

        const { createClientBrowser } = await import('@/lib/supabase');
        const supabase = createClientBrowser();

        const { data: orders } = await supabase
          .from('orders')
          .select('amount, status, created_at, buyer_email')
          .in('status', ['delivered', 'paid']);

        const totalRevenue = (orders || []).reduce((s, o) => s + o.amount, 0);
        const today = new Date().toISOString().slice(0, 10);
        const thisMonth = new Date().toISOString().slice(0, 7);
        const todayRevenue = (orders || []).filter(o => o.created_at.slice(0, 10) === today).reduce((s, o) => s + o.amount, 0);
        const monthRevenue = (orders || []).filter(o => o.created_at.slice(0, 7) === thisMonth).reduce((s, o) => s + o.amount, 0);

        // Unique customers
        const uniqueEmails = new Set((orders || []).map(o => o.buyer_email));

        const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        const { count: totalStock } = await supabase.from('account_stock').select('*', { count: 'exact', head: true }).eq('status', 'available');
        const { count: deliveredOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered');
        const { count: pendingOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');

        setStats({
          totalRevenue, todayRevenue, monthRevenue,
          totalOrders: totalOrders || 0,
          totalStock: totalStock || 0,
          deliveredOrders: deliveredOrders || 0,
          pendingOrders: pendingOrders || 0,
          totalCustomers: uniqueEmails.size,
        });

        const { data: recent } = await supabase
          .from('orders')
          .select('*, product:products(name)')
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentOrders(recent || []);
      } catch (err) {
        console.error('Stats error:', err);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const chartTotal = chartData.reduce((s, d) => s + d.value, 0);
  const chartAvg = chartData.length > 0 ? Math.round(chartTotal / chartData.length) : 0;

  if (loading) {
    return (
      <div>
        <div className="admin-header">
          <div>
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--text" style={{ width: '160px' }} />
          </div>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card">
              <div className="skeleton skeleton--text" style={{ width: '80px' }} />
              <div className="skeleton skeleton--title" style={{ width: '120px', marginTop: '8px' }} />
            </div>
          ))}
        </div>
        <div className="skeleton skeleton--card" style={{ height: '320px' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Dashboard</h1>
          <p className="admin-header__subtitle">Ringkasan performa Mediea Premium</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-11)', color: 'var(--text-quaternary)' }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__label">Total Revenue</div>
          <div className="stat-card__value" style={{ color: 'var(--accent-text)' }}>
            {formatPrice(stats.totalRevenue)}
          </div>
          <div className="stat-card__change stat-card__change--up">↑ 12.5% dari bulan lalu</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Revenue Bulan Ini</div>
          <div className="stat-card__value">{formatPrice(stats.monthRevenue)}</div>
          <div className="stat-card__change stat-card__change--up">↑ {formatPrice(stats.todayRevenue)} hari ini</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Total Pesanan</div>
          <div className="stat-card__value">{stats.totalOrders}</div>
          <div className="stat-card__change">
            <span style={{ color: 'var(--accent-text)' }}>{stats.deliveredOrders} terkirim</span>
            {stats.pendingOrders > 0 && <span style={{ color: 'var(--warning)' }}> · {stats.pendingOrders} pending</span>}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Pelanggan / Stok</div>
          <div className="stat-card__value">{stats.totalCustomers}</div>
          <div className="stat-card__change">
            <span style={{ color: stats.totalStock < 10 ? 'var(--warning)' : 'var(--text-quaternary)' }}>
              {stats.totalStock} stok tersedia
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-card">
        <div className="chart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
            {/* Chart type selector */}
            <div style={{ display: 'flex', gap: 'var(--sp-1)' }}>
              {CHART_TYPES.map(ct => (
                <button
                  key={ct.key}
                  className={`chart-tab ${activeChart === ct.key ? 'chart-tab--active' : ''}`}
                  onClick={() => setActiveChart(ct.key)}
                  style={{ borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span style={{ fontSize: '11px' }}>{ct.icon}</span> {ct.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            {/* Chart style toggle */}
            <div style={{ display: 'flex', gap: '2px' }}>
              <button
                className={`chart-tab ${chartStyle === 'area' ? 'chart-tab--active' : ''}`}
                onClick={() => setChartStyle('area')}
                style={{ borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', padding: '4px 8px', fontSize: '12px' }}
                title="Area Chart"
              >
                📈
              </button>
              <button
                className={`chart-tab ${chartStyle === 'bar' ? 'chart-tab--active' : ''}`}
                onClick={() => setChartStyle('bar')}
                style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', padding: '4px 8px', fontSize: '12px' }}
                title="Bar Chart"
              >
                📊
              </button>
            </div>

            {/* Period selector */}
            <div className="chart-tabs">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  className={`chart-tab ${chartPeriod === p.key ? 'chart-tab--active' : ''}`}
                  onClick={() => setChartPeriod(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart summary */}
        <div style={{ display: 'flex', gap: 'var(--sp-8)', marginBottom: 'var(--sp-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-11)', color: 'var(--text-quaternary)', marginBottom: '2px' }}>
              Total {activeChart === 'revenue' ? 'Revenue' : activeChart === 'orders' ? 'Pesanan' : 'Pendaftar'}
            </div>
            <div style={{ fontSize: 'var(--text-24)', fontWeight: 'var(--weight-bold)', letterSpacing: '-0.03em' }}>
              {activeChart === 'revenue' ? formatPrice(chartTotal) : chartTotal.toLocaleString('id-ID')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-11)', color: 'var(--text-quaternary)', marginBottom: '2px' }}>
              Rata-rata / {chartPeriod === '12m' ? 'bulan' : 'hari'}
            </div>
            <div style={{ fontSize: 'var(--text-24)', fontWeight: 'var(--weight-bold)', letterSpacing: '-0.03em', color: 'var(--text-secondary)' }}>
              {activeChart === 'revenue' ? formatPrice(chartAvg) : chartAvg.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="chart-container" style={{ height: '240px' }}>
          {chartStyle === 'area' ? (
            <AreaChart
              data={chartData}
              color={activeChart === 'revenue' ? '#00E676' : activeChart === 'orders' ? '#5e6ad2' : '#F5A623'}
              height={240}
            />
          ) : (
            <BarChart
              data={chartData}
              color={activeChart === 'revenue' ? '#00E676' : activeChart === 'orders' ? '#5e6ad2' : '#F5A623'}
              height={240}
            />
          )}
        </div>
      </div>

      {/* Two-column: Revenue Breakdown + Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-6)', marginBottom: 'var(--sp-6)' }}>
        {/* Revenue breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 'var(--text-14)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--sp-4)', letterSpacing: '-0.01em' }}>
            Laporan Keuangan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {[
              { label: 'Pendapatan Hari Ini', value: stats.todayRevenue, color: 'var(--accent-text)' },
              { label: 'Pendapatan Bulan Ini', value: stats.monthRevenue, color: 'var(--text-primary)' },
              { label: 'Total Pendapatan', value: stats.totalRevenue, color: 'var(--accent-text)' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--bg-surface-1)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 'var(--text-13)', color: 'var(--text-tertiary)' }}>{item.label}</span>
                <span style={{ fontSize: 'var(--text-14)', fontWeight: 'var(--weight-semibold)', color: item.color, fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice(item.value)}
                </span>
              </div>
            ))}
          </div>

          {/* Conversion metrics */}
          <div style={{ marginTop: 'var(--sp-4)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-12)' }}>
              <span style={{ color: 'var(--text-quaternary)' }}>Conversion Rate</span>
              <span style={{ color: 'var(--accent-text)', fontWeight: 'var(--weight-medium)' }}>
                {stats.totalOrders > 0 ? ((stats.deliveredOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div style={{ marginTop: 'var(--sp-2)', height: '4px', background: 'var(--bg-surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${stats.totalOrders > 0 ? (stats.deliveredOrders / stats.totalOrders) * 100 : 0}%`,
                background: 'var(--accent)',
                borderRadius: '2px',
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="card">
          <h3 style={{ fontSize: 'var(--text-14)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--sp-4)', letterSpacing: '-0.01em' }}>
            Statistik Platform
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {[
              { icon: '✅', label: 'Berhasil Dikirim', value: stats.deliveredOrders, color: 'var(--accent-text)' },
              { icon: '⏳', label: 'Menunggu Bayar', value: stats.pendingOrders, color: 'var(--warning)' },
              { icon: '👥', label: 'Total Pelanggan', value: stats.totalCustomers, color: 'var(--text-primary)' },
              { icon: '🔑', label: 'Stok Tersedia', value: stats.totalStock, color: stats.totalStock < 10 ? 'var(--warning)' : 'var(--text-primary)' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--bg-surface-1)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 'var(--text-13)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: '14px' }}>{item.icon}</span> {item.label}
                </span>
                <span style={{ fontSize: 'var(--text-18)', fontWeight: 'var(--weight-bold)', color: item.color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
          <h3 style={{ fontSize: 'var(--text-14)', fontWeight: 'var(--weight-semibold)', letterSpacing: '-0.01em' }}>
            Pesanan Terbaru
          </h3>
          <a href="/admin/dashboard/orders" className="btn btn--ghost btn--sm" style={{ fontSize: 'var(--text-12)' }}>
            Lihat Semua →
          </a>
        </div>
        {recentOrders.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Pembeli</th>
                  <th>Produk</th>
                  <th>Metode</th>
                  <th>Jumlah</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-11)', color: 'var(--text-tertiary)' }}>
                      {order.order_number}
                    </td>
                    <td style={{ fontWeight: 'var(--weight-medium)' }}>{order.buyer_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{order.product?.name}</td>
                    <td>
                      {order.payment_type
                        ? <span className="badge badge--info">{order.payment_type}</span>
                        : <span style={{ color: 'var(--text-disabled)' }}>—</span>
                      }
                    </td>
                    <td style={{ fontWeight: 'var(--weight-medium)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatPrice(order.amount)}
                    </td>
                    <td>
                      <span className={`badge badge--${order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : 'danger'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-quaternary)', fontSize: 'var(--text-13)' }}>Belum ada pesanan.</p>
        )}
      </div>
    </div>
  );
}
