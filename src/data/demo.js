// 範例內容只展示資訊架構；遊戲取得方式及配置請由管理員校對後發佈。
export const categories = [
  { slug: 'frames', label: '角色', eyebrow: 'WARFRAMES', description: '探索戰甲定位、取得方式與配置方向。', color: '#b9ccda' },
  { slug: 'weapons', label: '武器', eyebrow: 'ARSENAL', description: '整理武器特性、入手途徑與使用心得。', color: '#c8d1e0' },
  { slug: 'companions', label: '同伴', eyebrow: 'COMPANIONS', description: '挑選陪你出任務的可靠夥伴。', color: '#c9d8d1' },
  { slug: 'materials', label: '素材', eyebrow: 'RESOURCES', description: '從需求到來源，快速找到素材線索。', color: '#e0d8c9' },
  { slug: 'missions', label: '關卡攻略', eyebrow: 'MISSIONS', description: '把任務流程與難點記錄下來。', color: '#d0d5df' },
  { slug: 'wiki', label: '知識百科', eyebrow: 'CODEX', description: '收集重要系統與常見問題。', color: '#d8d3e1' },
];

const section = (title, content) => ({ title, blocks: [{ type: 'text', text: content }] });

export function makeSeed() {
  const now = new Date().toISOString();
  const samples = [
    { category: 'frames', title: 'Gauss Prime｜高速戰甲入門', excerpt: '從技能節奏到配置方向，建立一份自己的 Gauss Prime 筆記。', tags: ['Prime', '入門'], sections: [section('故事介紹', '這裡可以整理戰甲背景、特色與你對角色的理解。'), section('取得方式', '請補上目前版本的取得途徑、所需材料與先決條件。'), section('MOD 配置（含賦能）', '可依一般任務與高等級任務分別記錄配置、替換選項及理由。'), section('推薦武器', '記錄適合搭配的主武器、副武器與近戰武器。'), section('關卡表現評論', '分享實際遊玩感受、適合的任務類型與注意事項。')] },
    { category: 'frames', title: 'Wisp Prime｜增益與隊伍支援', excerpt: '整理花序增益、持續時間與組隊時的使用方法。', tags: ['Prime', '支援'], sections: [section('故事介紹', '這裡可加入戰甲背景與玩法定位。'), section('取得方式', '請填入你確認過的取得途徑。'), section('MOD 配置（含賦能）', '記錄技能強度、持續時間與賦能搭配。'), section('推薦武器', '記錄能受益於增益的武器選項。'), section('關卡表現評論', '比較單人與組隊任務中的表現。')] },
    { category: 'weapons', title: 'Trumna Prime｜主武器筆記', excerpt: '武器手感、配置思路與實戰紀錄。', tags: ['Prime', '主武器'], sections: [section('取得方式', '在這裡補上藍圖、材料及取得流程。'), section('配置與心得', '可記錄不同任務下的 MOD 配置與手感。')] },
    { category: 'weapons', title: 'Laetum｜副武器筆記', excerpt: '整理進化挑戰與日常使用心得。', tags: ['副武器', '靈化'], sections: [section('取得方式', '在這裡整理取得流程與前置條件。'), section('進化紀錄', '記錄進化條件與自己的選擇。')] },
    { category: 'companions', title: '同伴選擇指南', excerpt: '以任務需求整理同伴與配置選擇。', tags: ['入門'], sections: [section('取得方式', '列出可選同伴與各自的取得方法。'), section('搭配建議', '按生存、探索與資源蒐集整理。')] },
    { category: 'materials', title: '常用素材蒐集筆記', excerpt: '把素材來源與常用農法放在一頁。', tags: ['資源'], sections: [section('取得方式', '將素材名稱、掉落來源與推薦節點整理於此。')] },
    { category: 'missions', title: '鋼韌之道準備清單', excerpt: '進入高難度星圖前，整理裝備與任務節奏。', tags: ['進階'], sections: [section('取得方式', '這裡可記錄解鎖條件與任務入口。'), section('攻略流程', '依照自己的遊玩經驗補上分步攻略。')] },
    { category: 'wiki', title: 'Helminth 系統概覽', excerpt: '技能移植、資源準備與配置紀錄入口。', tags: ['系統'], sections: [section('取得方式', '這裡可整理功能解鎖條件。'), section('使用筆記', '記錄系統概念與常見問題。')] },
  ];
  return {
    posts: samples.map((post, i) => ({ ...post, id: `demo-${i + 1}`, status: 'demo', coverUrl: '', createdAt: now, updatedAt: now })),
    tags: ['Prime', '入門', '支援', '主武器', '副武器', '靈化', '資源', '進階', '系統'],
    sessions: [],
  };
}
