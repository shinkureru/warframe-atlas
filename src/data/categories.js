// 導覽與分類設定集中管理，方便日後新增頁面。
export const navItems = [
  { to: '/', label: '首頁' }, { to: '/category/frames', label: '角色' },
  { to: '/category/weapons', label: '武器' }, { to: '/category/companions', label: '同伴' },
  { to: '/category/materials', label: '素材' }, { to: '/category/missions', label: '關卡攻略' },
  { to: '/category/wiki', label: '知識百科' }, { to: '/admin', label: '管理員' },
];
export const fallbackCategories = [
  { slug: 'frames', label: '角色', eyebrow: 'WARFRAMES', description: '探索戰甲定位、取得方式與配置方向。', color: '#b9ccda' },
  { slug: 'weapons', label: '武器', eyebrow: 'ARSENAL', description: '整理武器特性、入手途徑與使用心得。', color: '#c8d1e0' },
  { slug: 'companions', label: '同伴', eyebrow: 'COMPANIONS', description: '挑選陪你出任務的可靠夥伴。', color: '#c9d8d1' },
  { slug: 'materials', label: '素材', eyebrow: 'RESOURCES', description: '從需求到來源，快速找到素材線索。', color: '#e0d8c9' },
  { slug: 'missions', label: '關卡攻略', eyebrow: 'MISSIONS', description: '把任務流程與難點記錄下來。', color: '#d0d5df' },
  { slug: 'wiki', label: '知識百科', eyebrow: 'CODEX', description: '收集重要系統與常見問題。', color: '#d8d3e1' },
];

