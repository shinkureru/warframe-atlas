// 角色的三項五分制評價；可編輯模式支援鍵盤焦點與直接點擊星星。
export const ratingFields = [
  { key: 'mobility', label: '機動性', low: '低', high: '高' },
  { key: 'defense', label: '防禦守點', low: '弱', high: '強' },
  { key: 'versatility', label: '泛用度', low: '低', high: '廣' },
];
export default function Ratings({ value = {}, onChange }) {
  return <div className="rating-list">{ratingFields.map((field) => <div className="rating-row" key={field.key}>
    <strong>{field.label}</strong><span>{field.low}</span>
    <div className="rating-stars" aria-label={`${field.label} ${value[field.key] || 0} 顆星`}>
      {[1, 2, 3, 4, 5].map((score) => onChange
        ? <button key={score} type="button" className={score <= (value[field.key] || 0) ? 'filled' : ''} aria-label={`${field.label} ${score} 顆星`} onClick={() => onChange(field.key, score)}>★</button>
        : <span key={score} className={score <= (value[field.key] || 0) ? 'filled' : ''} aria-hidden="true">★</span>)}
    </div><span>{field.high}</span><b>{value[field.key] || 0}/5</b>
  </div>)}</div>;
}
