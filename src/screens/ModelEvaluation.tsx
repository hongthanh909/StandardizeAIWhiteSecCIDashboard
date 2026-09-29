function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, ...style }}>
      {children}
    </div>
  );
}

function SH({ icon, title, badge, badgeColor }: { icon:string; title:string; badge?:string; badgeColor?:string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7ef0" strokeWidth="1.8">
        <path d={icon} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)' }}>{title}</span>
      {badge && (
        <span style={{
          padding:'1px 7px', borderRadius:4, fontSize:10,
          background:`${badgeColor||'#f59e0b'}18`,
          color: badgeColor || '#f59e0b',
          border:`1px solid ${badgeColor||'#f59e0b'}28`,
          fontFamily:'var(--font-mono)',
        }}>{badge}</span>
      )}
      <div style={{ flex:1, height:1, background:'var(--border)' }}/>
    </div>
  );
}

const MODELS = ['CodeBERT Classifier', 'Checkmarx SAST', 'Combined (Ensemble)'];
const METRICS = ['TP', 'FP', 'FN', 'TN', 'Precision', 'Recall', 'F1', 'Coverage', 'Runtime', 'Dataset version', 'Model/config version'];

const CONDITIONS = [
  { label:'Held-out dataset',    value:'Chưa có dữ liệu',                     status:'missing' },
  { label:'Ground truth',        value:'Chưa có dữ liệu',                     status:'missing' },
  { label:'Số mẫu',              value:'Chưa có dữ liệu',                     status:'missing' },
  { label:'Model checkpoint',    value:'codebert-base-uncased (fine-tuned)',   status:'ok' },
  { label:'Tokenizer',           value:'BertTokenizer (HuggingFace)',          status:'ok' },
  { label:'Threshold',           value:'0.70 (tạm thời)',                      status:'provisional' },
  { label:'Checkmarx preset',    value:'Python_Security (v9.3)',               status:'ok' },
  { label:'Combination policy',  value:'AND – chưa chốt chính thức',          status:'provisional' },
  { label:'Thời điểm đánh giá',  value:'Chưa có dữ liệu',                     status:'missing' },
  { label:'Run ID tạo kết quả',  value:'Chưa có dữ liệu',                     status:'missing' },
  { label:'Commit tạo kết quả',  value:'Chưa có dữ liệu',                     status:'missing' },
];

const STATUS_C = { ok:'#22c55e', provisional:'#f59e0b', missing:'#ef4444' };
const STATUS_L = { ok:'Có sẵn', provisional:'Tạm thời', missing:'Thiếu' };

const WARNINGS = [
  { t:'Chưa có kết quả thực nghiệm', d:'Bảng này sẽ hiển thị số liệu khi quá trình đánh giá trên held-out dataset được thực hiện.' },
  { t:'Class imbalance',             d:'Dataset có thể bị mất cân bằng lớp. Cần báo cáo class distribution trước khi đánh giá.' },
  { t:'Nguy cơ data leakage',        d:'Cần đảm bảo tập validation không chứa mẫu đã dùng trong fine-tuning.' },
  { t:'Khả năng tái lập',            d:'Kết quả chỉ tái lập khi checkpoint, tokenizer, threshold và preset được cố định.' },
];

/* ══════════════════════════════════════════════════════════════════════ */
export default function ModelEvaluation() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Title */}
      <div>
        <h2 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>Đánh giá mô hình & Kiểm thử Benchmark</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
          Bảng so sánh CodeBERT · Checkmarx · Combined — số liệu xuất hiện khi có held-out dataset & ground truth
        </p>
      </div>

      {/* Status alert */}
      <div style={{
        display:'flex', gap:10, padding:'12px 16px', borderRadius:10,
        background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" style={{ flexShrink:0, marginTop:1 }}>
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.071 16.5c-.77.833.192 2.5 1.732 2.5z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <p style={{ fontSize:12, fontWeight:600, color:'#fca5a5' }}>Chưa có dữ liệu đánh giá</p>
          <p style={{ fontSize:11, color:'var(--text-secondary)', marginTop:3, lineHeight:1.6 }}>
            Held-out dataset và ground truth chưa xác nhận. Bảng benchmark hiển thị cấu trúc và điều kiện cần thiết.
            Tất cả ô metric đang trống — <strong>không có số liệu giả nào được tạo ra.</strong>
          </p>
        </div>
      </div>

      {/* Conditions */}
      <section>
        <SH icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            title="Điều kiện đánh giá" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {CONDITIONS.map(c => {
            const col = STATUS_C[c.status as keyof typeof STATUS_C];
            const lbl = STATUS_L[c.status as keyof typeof STATUS_L];
            return (
              <div key={c.label} style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8,
                background:'var(--bg-surface)', border:'1px solid var(--border)',
              }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:10, color:'var(--text-dim)' }}>{c.label}</div>
                  <div style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginTop:2 }}>{c.value}</div>
                </div>
                <span style={{
                  padding:'2px 8px', borderRadius:4, flexShrink:0,
                  background:`${col}18`, color:col, border:`1px solid ${col}28`,
                  fontSize:10, fontWeight:600,
                }}>
                  {lbl}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benchmark table */}
      <section>
        <SH icon="M3 10h18M3 14h18M10 3v18" title="Bảng so sánh mô hình" badge="Chờ dữ liệu" />
        <Card style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg-surface-2)', borderBottom:'1px solid var(--border)' }}>
                <th style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--text-muted)' }}>Metric</th>
                {MODELS.map(m => (
                  <th key={m} style={{ padding:'10px 16px', textAlign:'center', fontSize:11, fontWeight:600, color:'var(--text-muted)' }}>
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((metric, i) => (
                <tr key={metric} style={{
                  borderBottom:'1px solid rgba(28,40,71,0.5)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(16,22,48,0.4)',
                }}>
                  <td style={{ padding:'9px 16px', fontSize:12, fontWeight:500, color:'var(--text-secondary)' }}>{metric}</td>
                  {MODELS.map(m => (
                    <td key={m} style={{ padding:'9px 16px', textAlign:'center' }}>
                      <span style={{
                        display:'inline-block', padding:'3px 10px', borderRadius:4,
                        background:'var(--bg-surface-2)', border:'1px solid var(--border)',
                        fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-dim)',
                      }}>
                        Chưa có dữ liệu
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* Chart placeholders */}
      <section>
        <SH icon="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            title="Trực quan hóa PR/F1 & Confusion Matrix" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            { t:'Confusion Matrix',       d:'Xuất hiện sau khi có ground truth và đánh giá trên held-out dataset.' },
            { t:'Precision–Recall Curve', d:'Xuất hiện khi có đủ TP, FP, FN và threshold sweep.' },
            { t:'Runtime Breakdown',      d:'Thời gian scan từng giai đoạn khi có dữ liệu pipeline đầy đủ.' },
            { t:'Class Distribution',     d:'Cần để kiểm tra class imbalance trước khi đánh giá mô hình.' },
          ].map(p => (
            <div key={p.t} style={{
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center',
              padding:'28px 20px', borderRadius:10, minHeight:160,
              background:'var(--bg-surface)', border:'1px dashed var(--border)',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--border-light)" strokeWidth="1" style={{ marginBottom:10 }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9" strokeLinecap="round"/>
              </svg>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--text-dim)' }}>{p.t}</p>
              <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:5, maxWidth:220, lineHeight:1.5 }}>{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Truy xuất nguồn gốc */}
      <section>
        <SH icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            title="Truy xuất nguồn gốc Mô hình & Cấu hình Thử nghiệm" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <InfoCard title="Phân tích False Positive"
            body="Chưa có dữ liệu. False positive sẽ được phân loại theo CWE, file và nguồn phát hiện sau khi có kết quả đánh giá."/>
          <InfoCard title="Phân tích False Negative"
            body="Chưa có dữ liệu. False negative cần đối chiếu với ground truth trên held-out dataset."/>
        </div>
      </section>

      {/* Warnings */}
      <section>
        <SH icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.071 16.5c-.77.833.192 2.5 1.732 2.5z"
            title="Lưu ý & Cảnh báo" />
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {WARNINGS.map((w, i) => (
            <div key={i} style={{
              display:'flex', gap:10, padding:'10px 14px', borderRadius:8,
              background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.14)',
            }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#f59e0b" strokeWidth="1.5" style={{ flexShrink:0, marginTop:1 }}>
                <path d="M8 1L1.5 14h13L8 1z" strokeLinejoin="round"/>
                <path d="M8 6v3M8 11v.5" strokeLinecap="round"/>
              </svg>
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:'#fbbf24' }}>{w.t}</p>
                <p style={{ fontSize:11, color:'var(--text-secondary)', marginTop:2, lineHeight:1.5 }}>{w.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

function InfoCard({ title, body }: { title:string; body:string }) {
  return (
    <div style={{ padding:'14px 16px', borderRadius:10, background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
      <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', marginBottom:7 }}>{title.toUpperCase()}</p>
      <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>{body}</p>
    </div>
  );
}
