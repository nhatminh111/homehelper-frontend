import React, { useEffect, useState } from "react";
import {
  getTaskerStats,
  getTaskerEarningsSeries,
  getTaskerBookingsMonthly,
  getTaskerSuccessCancel,
  getTaskerUpcoming,
  getTaskerOverdue,
  getTaskerRecentReviews,
  getTaskerByService,
} from "../../services/bookingService";
import "../../css/TaskerOverview.css";
const currency = (n) => {
  try {
    // Scale by 1,000 so 90 -> 90.000đ
    const scaled = Number(n || 0) * 1000;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(scaled);
  } catch (_) {
    const scaled = Number(n || 0) * 1000;
    return `${Number(scaled).toLocaleString('vi-VN')} ₫`;
  }
};

const TaskerOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredLegend, setHoveredLegend] = useState(null);
  const [series, setSeries] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [successCancel, setSuccessCancel] = useState({ completed: 0, cancelled: 0 });
  const [upcoming, setUpcoming] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [byService, setByService] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [statsRes, seriesRes, monthlyRes, scRes, upcomingRes, overdueRes, reviewsRes, byServiceRes] = await Promise.all([
          getTaskerStats(),
          getTaskerEarningsSeries({ granularity: 'month', periods: 6 }),
          getTaskerBookingsMonthly({ months: 6 }),
          getTaskerSuccessCancel({ months: 6 }),
          getTaskerUpcoming({ days: 7 }),
          getTaskerOverdue(),
          getTaskerRecentReviews({ limit: 5 }),
          getTaskerByService({ months: 6 }),
        ]);
        if (!mounted) return;
        setStats(statsRes);
        setSeries(seriesRes);
        setMonthly(monthlyRes);
        setSuccessCancel(scRes);
        setUpcoming(upcomingRes);
        setOverdue(overdueRes);
        setReviews(reviewsRes);
        setByService(byServiceRes);
      } catch (e) {
        if (mounted) setError(e.message || 'Có lỗi khi tải thống kê');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="tasker-overview">
      <h3 className="mb-3">Tổng Quan</h3>
      {loading && <p>Đang tải thống kê...</p>}
      {error && <p className="text-danger">{error}</p>}

      {stats && (
        <div>
          {/* Charts row: pie + earnings + monthly bookings */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="fw-bold mb-2">Tỉ lệ booking theo trạng thái</div>
                  <div className="d-flex flex-column align-items-center">
                    <BookingsPie byStatus={stats.by_status} hoveredLegend={hoveredLegend} />
                    <div className="w-100 mt-3">
                      <PieLegend byStatus={stats.by_status} hoveredLegend={hoveredLegend} setHoveredLegend={setHoveredLegend} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="fw-bold mb-2">Thu nhập theo tháng (VNĐ)</div>
                  <BarsSeries data={series} valueKey="total" />
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="fw-bold mb-2">Booking theo tháng</div>
                  <StackedBarsMonthly data={monthly} />
                </div>
              </div>
            </div>
          </div>

          {/* <div className="row g-3 mb-4">
            <div className="col-sm-6 col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fw-bold">Tổng số booking</div>
                  <div className="display-6">{stats.total_bookings}</div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fw-bold">Hoàn thành (tháng)</div>
                  <div className="display-6">{stats.completed_this_month}</div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fw-bold">Đang tiến hành</div>
                  <div className="display-6">{stats.by_status?.in_progress || 0}</div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fw-bold">Đã chấp nhận</div>
                  <div className="display-6">{stats.by_status?.accepted || 0}</div>
                </div>
              </div>
            </div>
          </div> */}

          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fw-bold">Tổng thu nhập</div>
                  <div className="h2">{currency(stats.earnings_total)}</div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fw-bold">Thu nhập tháng này</div>
                  <div className="h2">{currency(stats.earnings_this_month)}</div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fw-bold">Đánh giá trung bình</div>
                  <div className="h2">{stats.rating_avg ? Number(stats.rating_avg).toFixed(1) : '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming and Overdue */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="fw-bold mb-2">Sắp tới / Đang tiến hành</div>
                  {upcoming.length ? (
                    <SimpleList items={upcoming} />
                  ) : (
                    <p className="text-muted mb-0">Không có công việc sắp tới.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="fw-bold mb-2">Quá hạn</div>
                  {overdue.length ? (
                    <SimpleList items={overdue} />
                  ) : (
                    <p className="text-muted mb-0">Không có công việc quá hạn.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews and by service */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="fw-bold mb-2">Đánh giá gần đây</div>
                  {reviews.length ? (
                    <ReviewsList items={reviews} />
                  ) : (
                    <p className="text-muted mb-0">Chưa có đánh giá.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="fw-bold mb-2">Theo dịch vụ / gói</div>
                  {byService.length ? (
                    <ServiceTable items={byService} />
                  ) : (
                    <p className="text-muted mb-0">Chưa có dữ liệu.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <div className="fw-bold mb-2">Gần đây</div>
              {stats.recent_bookings?.length ? (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Trạng thái</th>
                        <th>Giá dự kiến</th>
                        <th>Giá cuối</th>
                        <th>Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_bookings.map((b) => (
                        <tr key={b.booking_id}>
                          <td>{b.booking_id}</td>
                          <td>{b.status}</td>
                          <td>{currency(b.expected_price)}</td>
                          <td>{currency(b.final_price)}</td>
                          <td>{new Date(b.time).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0">Chưa có dữ liệu gần đây.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskerOverview;

// ---------- Local components: Pie + Legend ----------
const STATUS_META = [
  { key: 'pending', label: 'Chờ xử lý', color: '#9E9E9E' },
  { key: 'accepted', label: 'Đã chấp nhận', color: '#42A5F5' },
  { key: 'in_progress', label: 'Đang tiến hành', color: '#FFB300' },
  { key: 'completed', label: 'Hoàn thành', color: '#66BB6A' },
  { key: 'cancelled', label: 'Hủy', color: '#EF5350' },
  { key: 'complaint_processing', label: 'Khiếu nại', color: '#AB47BC' },
];

function BookingsPie({ byStatus, hoveredLegend }) {
  const r = 60; // radius
  const stroke = 20;
  const size = 2 * (r + stroke);
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  const segments = STATUS_META.map(s => ({
    ...s,
    value: Number(byStatus?.[s.key] || 0)
  })).filter(s => s.value > 0);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (!total) {
    return <div className="text-muted">Không có dữ liệu</div>;
  }

  let offset = 0; // cumulative fraction
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Tỉ lệ booking theo trạng thái">
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {segments.map((seg, idx) => {
            const isHovered = hoveredLegend === seg.key;
            const frac = seg.value / total;
            const dash = `${frac * circ} ${circ}`;
            const dashOffset = -offset * circ;
            offset += frac;
            return (
                <circle
                key={seg.key}
                cx={cx}
                cy={cy}
                r={r}
                fill="transparent"
                stroke={isHovered ? "#000" : seg.color}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
                />
            );
        })}
      </g>
      {/* inner white circle to create donut effect */}
      <circle cx={cx} cy={cy} r={r - stroke / 2} fill="#fff" />
      {/* center label */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontWeight="600" fill="#333">
        {total}
      </text>
    </svg>
  );
}

function PieLegend({ byStatus, hoveredLegend, setHoveredLegend }) {
  const items = STATUS_META.map(s => ({
    ...s,
    value: Number(byStatus?.[s.key] || 0)
  })).filter(i => i.value > 0);

  if (!items.length) return <div className="text-muted">Không có dữ liệu</div>;

  const total = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <div className="row g-2">
      {items.map((it) => {
        const pct = (it.value / total) * 100;
        return (
          <div className="col-12 col-sm-6 col-md-4" key={it.key}>
            <div
              className="pie-legend-item"
              onMouseEnter={() => setHoveredLegend(it.key)}
              onMouseLeave={() => setHoveredLegend(null)}
            >
              <span
                className="pie-legend-color"
                style={{ background: it.color, opacity: hoveredLegend === it.key ? 1 : 0.7 }}
              />
              <div className="small">
                <div className="text-black">{it.label}</div>
                <div className="text-muted">{it.value} ({pct.toFixed(0)}%)</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Single bars ----------
export function BarsSeries({ data = [], valueKey = "total" }) {
  const [hovered, setHovered] = useState(null);
  const w = 420, h = 160, pad = 24;
  const maxV = Math.max(1, ...data.map(d => Number(d[valueKey] || 0)));
  const bw = (w - pad * 2) / Math.max(1, data.length);

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Biểu đồ cột">
      {data.map((d, i) => {
        const v = Number(d[valueKey] || 0);
        const barH = (v / maxV) * (h - pad * 2);
        const x = pad + i * bw;
        const y = h - pad - barH;

        return (
          <g key={i}>
            <rect
              x={x + 4}
              y={y}
              width={bw - 8}
              height={barH}
              rx="4"
              fill={hovered === i ? "#1976D2" : "#42A5F5"}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            {/* Giá trị trên cột */}
            {barH > 12 && (
              <text
                x={x + bw / 2}
                y={y + 14}
                textAnchor="middle"
                fontSize="10"
                fill="#fff"
              >
                {v}
              </text>
            )}
            {/* Label dưới cột */}
            <text x={x + bw / 2} y={h - 6} textAnchor="middle" fontSize="10" fill="#666">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------- Stacked bars ----------
export function StackedBarsMonthly({ data = [] }) {
  const [hovered, setHovered] = useState(null);
  const w = 420, h = 160, pad = 24;
  // Center legend: total block width for two items (spacing 120 between)
  const legendWidth = 240;
  const legendX = (w - legendWidth) / 2;
  const maxV = Math.max(1, ...data.map(d => Number(d.completed || 0) + Number(d.pending || 0)));
  const bw = (w - pad * 2) / Math.max(1, data.length);

  return (
    <svg width="100%" height={h + 30} viewBox={`0 0 ${w} ${h + 30}`} role="img" aria-label="Biểu đồ cột chồng">
      {data.map((d, i) => {
        const comp = Number(d.completed || 0);
        const pend = Number(d.pending || 0);
        const total = comp + pend;
        const totalH = (total / maxV) * (h - pad * 2);
        const compH = total === 0 ? 0 : (comp / total) * totalH;
        const pendH = totalH - compH;
        const x = pad + i * bw;
        const yPend = h - pad - pendH;
        const yComp = yPend - compH;

        return (
          <g key={i}>
            <rect
              x={x + 4}
              y={yPend}
              width={bw - 8}
              height={pendH}
              rx="3"
              fill={hovered === i ? "#B0B0B0" : "#9E9E9E"}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            <rect
              x={x + 4}
              y={yComp}
              width={bw - 8}
              height={compH}
              rx="3"
              fill={hovered === i ? "#55BB77" : "#66BB6A"}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            {compH > 12 && (
              <text
                x={x + bw / 2}
                y={yComp + compH / 2 + 4}
                textAnchor="middle"
                fontSize="10"
                fill="#fff"
              >
                {comp}
              </text>
            )}
            {pendH > 12 && (
              <text
                x={x + bw / 2}
                y={yPend + pendH / 2 + 4}
                textAnchor="middle"
                fontSize="10"
                fill="#fff"
              >
                {pend}
              </text>
            )}
            <text x={x + bw / 2} y={h - 6} textAnchor="middle" fontSize="10" fill="#666">
              {d.label}
            </text>
          </g>
        );
      })}

      {/* Legend: xuống dưới biểu đồ, căn giữa card */}
    <g transform={`translate(${legendX}, ${h + 20})`}>
        <g>
            <rect x={0} y={0} width={12} height={12} fill="#66BB6A" rx="2" />
            <text x={16} y={10} fontSize="11" fill="#333">
            Hoàn thành
            </text>
        </g>

        <g transform="translate(120, 0)">
            <rect x={0} y={0} width={12} height={12} fill="#9E9E9E" rx="2" />
            <text x={16} y={10} fontSize="11" fill="#333">
            Chưa hoàn thành
            </text>
        </g>
    </g>
    </svg>
  );
}



function SimpleList({ items = [] }) {
  return (
    <div className="table-responsive">
      <table className="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Trạng thái</th>
            <th>Dịch vụ</th>
            <th>Bắt đầu</th>
            <th>Kết thúc</th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.booking_id}>
              <td>{b.booking_id}</td>
              <td>{b.status}</td>
              <td>{b.service_name} {b.variant_name ? `- ${b.variant_name}` : ''}</td>
              <td>{b.start_time ? new Date(b.start_time).toLocaleString('vi-VN') : '—'}</td>
              <td>{b.end_time ? new Date(b.end_time).toLocaleString('vi-VN') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewsList({ items = [] }) {
  return (
    <div className="list-group list-group-flush">
      {items.map((r) => (
        <div className="list-group-item px-0" key={r.rating_id}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="fw-semibold">{r.customer_name || 'Khách hàng'}</div>
            <div className="text-warning">{'★'.repeat(Math.round(r.rating || 0))}<span className="text-muted">{'★'.repeat(Math.max(0, 5 - Math.round(r.rating || 0)))}</span></div>
          </div>
          {r.comment && <div className="small text-muted mt-1">{r.comment}</div>}
          <div className="small text-secondary mt-1">{new Date(r.created_at).toLocaleString('vi-VN')}</div>
        </div>
      ))}
    </div>
  );
}

function ServiceTable({ items = [] }) {
  const totalE = items.reduce((s, i) => s + Number(i.earnings || 0), 0);
  return (
    <div className="table-responsive">
      <table className="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>Dịch vụ</th>
            <th>Gói</th>
            <th className="text-end">Số booking</th>
            <th className="text-end">Thu nhập</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i, idx) => (
            <tr key={`${i.service_id}-${i.variant_id}-${idx}`}>
              <td>{i.service_name}</td>
              <td>{i.variant_name || '—'}</td>
              <td className="text-end">{i.bookings}</td>
              <td className="text-end">{currency(i.earnings)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={3} className="text-end">Tổng</th>
            <th className="text-end">{currency(totalE)}</th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
