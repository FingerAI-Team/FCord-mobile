// ─────────────────────────────────────────────────────
//  IBK STT Figma Plugin — 화면 자동 생성
//  10개 핵심 화면 (390 × 844px / iPhone 기준)
// ─────────────────────────────────────────────────────

// ── 색상 토큰 ──────────────────────────────────────────
function hex(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

const C = {
  bg:      hex('#f4f6f9'),
  surface: hex('#ffffff'),
  s2:      hex('#eef1f6'),
  border:  hex('#dde2eb'),
  text:    hex('#0a1628'),
  text2:   hex('#4a5568'),
  muted:   hex('#94a3b8'),
  accent:  hex('#005BAC'),
  blue:    hex('#1B72E4'),
  done:    hex('#16a34a'),
  doneBg:  hex('#f0fdf4'),
  proc:    hex('#d97706'),
  procBg:  hex('#fffbeb'),
  fail:    hex('#dc2626'),
  failBg:  hex('#fef2f2'),
  navy:    hex('#0a2558'),
  amber:   hex('#fff7ed'),
  amberBd: hex('#fdba74'),
  amberTx: hex('#9a3412'),
  W:       { r: 1, g: 1, b: 1 },
  K:       { r: 0, g: 0, b: 0 },
};

const R  = { sm: 5, md: 8, lg: 10 };
const SW = 390, SH = 844, GAP = 60;
const FONT = 'Noto Sans KR';

// ── 폰트 가중치 → 스타일 ──────────────────────────────
function w2s(w) {
  if (w >= 700) return 'Bold';
  if (w >= 500) return 'Medium';
  return 'Regular';
}

// 이미 로드된 폰트 캐시
const _fontCache = new Set();
async function loadFont(w) {
  const style = w2s(w);
  const key = `${FONT}/${style}`;
  if (!_fontCache.has(key)) {
    await figma.loadFontAsync({ family: FONT, style });
    _fontCache.add(key);
  }
}

// ── 기본 도형 헬퍼 ──────────────────────────────────────
function addRect(parent, x, y, w, h, fill, opts = {}) {
  const { r = 0, opacity = 1, stroke = null, sw = 1, visible = true } = opts;
  const node = figma.createRectangle();
  node.x = x; node.y = y;
  node.resize(w, h);
  node.cornerRadius = r;
  if (fill) node.fills = [{ type: 'SOLID', color: fill, opacity }];
  else node.fills = [];
  if (stroke) {
    node.strokes = [{ type: 'SOLID', color: stroke }];
    node.strokeWeight = sw;
    node.strokeAlign = 'INSIDE';
  }
  node.visible = visible;
  parent.appendChild(node);
  return node;
}

async function addText(parent, str, x, y, size, weight, color, opts = {}) {
  const { w: fixedW = null, align = 'LEFT', opacity = 1 } = opts;
  await loadFont(weight);
  const node = figma.createText();
  node.fontName = { family: FONT, style: w2s(weight) };
  node.fontSize = size;
  node.fills = [{ type: 'SOLID', color, opacity }];
  node.textAlignHorizontal = align;
  if (fixedW) {
    node.textAutoResize = 'HEIGHT';
    node.resize(fixedW, 20);
  } else {
    node.textAutoResize = 'WIDTH_AND_HEIGHT';
  }
  node.characters = str;
  node.x = x; node.y = y;
  parent.appendChild(node);
  return node;
}

function addFrame(parent, name, x, y, w, h, fill, opts = {}) {
  const { r = 0, clip = false } = opts;
  const f = figma.createFrame();
  f.name = name;
  f.x = x; f.y = y;
  f.resize(w, h);
  f.fills = fill ? [{ type: 'SOLID', color: fill }] : [];
  f.cornerRadius = r;
  f.clipsContent = clip;
  if (parent) parent.appendChild(f);
  return f;
}

// ── 공통 컴포넌트 ──────────────────────────────────────

async function addStatusBar(f, navy = false) {
  const bg = navy ? C.navy : C.surface;
  const fg = navy ? C.W : C.text;
  addRect(f, 0, 0, SW, 50, bg);
  await addText(f, '9:41', 20, 17, 15, 700, fg);
  // 배터리
  addRect(f, SW - 46, 21, 22, 11, null, { r: 3.5, stroke: fg, sw: 1, opacity: 0.35 });
  addRect(f, SW - 45, 22, 14, 9, fg, { r: 2.5 });
  addRect(f, SW - 23, 24, 2, 5, fg, { r: 1, opacity: 0.4 });
  // 와이파이 (호 3개 간소화)
  for (let i = 0; i < 3; i++) {
    addRect(f, SW - 72 + i * 7, 29 - i * 4, 5 + i * 2, 5 + i * 4, fg, { r: 1, opacity: i === 0 ? 0.35 : i === 1 ? 0.6 : 1 });
  }
  // 셀룰러
  for (let i = 0; i < 4; i++) {
    addRect(f, SW - 105 + i * 6, 32 - i * 3, 4, 5 + i * 3, fg, { r: 1, opacity: i < 2 ? 0.35 : 1 });
  }
}

async function addTopBar(f, title, opts = {}) {
  const { back = null, y = 50 } = opts;
  addRect(f, 0, y, SW, 48, C.surface);
  addRect(f, 0, y + 47, SW, 1, C.border);
  if (back) {
    await addText(f, '‹ ' + back, 16, y + 15, 13, 500, C.accent);
  }
  await addText(f, title, back ? 90 : 16, y + 15, 13, 700, C.text, {
    w: back ? 210 : null,
    align: back ? 'CENTER' : 'LEFT',
  });
  // 우측 아이콘 2개
  addRect(f, SW - 72, y + 10, 28, 28, C.s2, { r: R.sm });
  addRect(f, SW - 38, y + 10, 28, 28, C.s2, { r: R.sm });
}

async function addFAB(f, label = '회의 시작하기') {
  addRect(f, 0, SH - 76, SW, 76, C.surface);
  addRect(f, 0, SH - 76, SW, 1, C.border);
  addRect(f, 16, SH - 60, SW - 32, 44, C.accent, { r: R.md });
  await addText(f, label, 16, SH - 46, 13, 700, C.W, { w: SW - 32, align: 'CENTER' });
}

async function addBadge(parent, label, x, y, type = 'done') {
  const map = {
    done:   { bg: C.doneBg, fg: C.done },
    proc:   { bg: hex('#eff6ff'), fg: C.blue },
    fail:   { bg: C.failBg, fg: C.fail },
    gray:   { bg: C.s2, fg: C.text2 },
    queued: { bg: hex('#f3f4f6'), fg: hex('#6b7280') },
    blue:   { bg: hex('#eff6ff'), fg: C.blue },
  };
  const cl = map[type] || map.done;
  const bw = label.length * 7.5 + 14;
  addRect(parent, x, y, bw, 22, cl.bg, { r: R.sm });
  await addText(parent, label, x, y + 5, 11, 500, cl.fg, { w: bw, align: 'CENTER' });
  return bw;
}

async function addCard(f, cy, title, meta, badge, badgeType) {
  addRect(f, 12, cy, SW - 24, 58, C.surface, { r: R.md, stroke: C.border, sw: 1 });
  await addText(f, title, 26, cy + 12, 12, 700, C.text, { w: SW - 90 });
  await addText(f, meta,  26, cy + 30, 11, 400, C.muted);
  if (badge) await addBadge(f, badge, SW - badge.length * 7.5 - 28, cy + 12, badgeType);
  await addText(f, '⋮', SW - 28, cy + 14, 14, 400, C.muted);
}

async function addStatusRow(f, cy, label, badge, type) {
  addRect(f, 24, cy + 1, SW - 36, 1, C.border, { opacity: 0.6 });
  await addText(f, label, 26, cy, 12, 500, C.text);
  await addBadge(f, badge, SW - badge.length * 7.5 - 28, cy, type);
}

// ─────────────────────────────────────────────────────
//  화면 1 — 스플래시
// ─────────────────────────────────────────────────────
async function buildSplash(page, xi) {
  const f = addFrame(page, '01 · 스플래시', xi, 0, SW, SH, C.navy);
  addRect(f, SW / 2 - 44, SH / 2 - 90, 88, 36, C.W, { r: 6, opacity: 0.08 });
  await addText(f, 'IBK투자증권', 0, SH / 2 - 52, 11, 400, C.W, { w: SW, align: 'CENTER', opacity: 0.55 });
  await addText(f, 'IBKS 음성회의록', 0, SH / 2 - 30, 22, 700, C.W, { w: SW, align: 'CENTER' });
  await addText(f, '회의를 텍스트로', 0, SH / 2 + 4, 12, 400, C.W, { w: SW, align: 'CENTER', opacity: 0.55 });
  addRect(f, SW / 2 - 10, SH - 90, 20, 20, C.W, { r: 10, opacity: 0.18 });
  addRect(f, SW / 2 - 30, SH - 130, 60, 26, C.W, { r: 4, opacity: 0.14 });
}

// ─────────────────────────────────────────────────────
//  화면 2 — 로그인
// ─────────────────────────────────────────────────────
async function buildLogin(page, xi) {
  const f = addFrame(page, '02 · 로그인', xi, 0, SW, SH, C.surface);
  await addStatusBar(f);
  addRect(f, 0, 50, SW, 48, C.surface, { stroke: C.border, sw: 1 });
  addRect(f, 16, 63, 90, 22, C.s2, { r: 4 });

  await addText(f, 'WELCOME', 20, 118, 10, 500, C.muted);
  await addText(f, 'IBKS 음성회의록에\n오신걸 환영해요', 20, 134, 20, 700, C.text, { w: SW - 40 });
  await addText(f, '사내 계정으로 로그인해 주세요', 20, 190, 11, 400, C.muted);

  // SSO 버튼
  addRect(f, 20, 218, SW - 40, 44, C.accent, { r: R.md });
  await addText(f, 'IBK투자증권 SSO로 로그인', 20, 231, 13, 700, C.W, { w: SW - 40, align: 'CENTER' });

  // 구분선
  addRect(f, 20, 278, (SW - 90) / 2, 1, C.border);
  await addText(f, '또는 직접 입력', SW / 2 - 42, 272, 10, 400, C.muted);
  addRect(f, SW / 2 + 44, 278, (SW - 90) / 2, 1, C.border);

  // 입력 필드
  addRect(f, 20, 296, SW - 40, 42, C.bg, { r: R.md, stroke: C.border, sw: 1 });
  await addText(f, '사번 또는 이메일', 34, 309, 12, 400, C.muted);
  addRect(f, 20, 346, SW - 40, 42, C.bg, { r: R.md, stroke: C.border, sw: 1 });
  await addText(f, '비밀번호', 34, 359, 12, 400, C.muted);

  // 로그인 버튼
  addRect(f, 20, 400, SW - 40, 44, C.blue, { r: R.md });
  await addText(f, '로그인', 20, 413, 13, 700, C.W, { w: SW - 40, align: 'CENTER' });

  await addText(f, '로그인 시 이용약관 및 개인정보처리방침에 동의합니다', 20, 460, 10, 400, C.muted, { w: SW - 40, align: 'CENTER' });
}

// ─────────────────────────────────────────────────────
//  화면 3 — 홈
// ─────────────────────────────────────────────────────
async function buildHome(page, xi) {
  const f = addFrame(page, '03 · 홈', xi, 0, SW, SH, C.bg);
  await addStatusBar(f);

  // topbar
  addRect(f, 0, 50, SW, 102, C.surface);
  addRect(f, 0, 151, SW, 1, C.border);
  await addText(f, '안녕하세요, 김이사님', 16, 62, 13, 700, C.text);
  await addText(f, '이번 주 회의 5건', 16, 80, 11, 400, C.muted);
  addRect(f, SW - 74, 59, 28, 28, C.blue, { r: R.sm, opacity: 0.1 });
  addRect(f, SW - 40, 59, 28, 28, C.s2, { r: R.sm });
  addRect(f, SW - 74 + 8, 67, 12, 12, C.blue, { r: 2, opacity: 0.6 });
  addRect(f, SW - 40 + 8, 67, 12, 12, C.text2, { r: 2, opacity: 0.4 });

  // 검색바
  addRect(f, 16, 100, SW - 32, 36, C.bg, { r: R.md, stroke: C.border, sw: 1 });
  await addText(f, '🔍  회의 내용 검색...', 28, 110, 12, 400, C.muted);

  // 세그먼트 필터
  addRect(f, 16, 142, SW - 32, 34, C.s2, { r: R.md });
  const tabW = (SW - 32) / 4;
  addRect(f, 18, 144, tabW - 4, 30, C.surface, { r: R.sm });
  const tabs = ['전체', '변환중', '완료', '즐겨찾기'];
  for (let i = 0; i < tabs.length; i++) {
    await addText(f, tabs[i], 16 + i * tabW, 152, 11, i === 0 ? 700 : 500,
      i === 0 ? C.text : C.muted, { w: tabW, align: 'CENTER' });
  }

  // 카드 목록
  const cards = [
    ['팀장 주간 미팅',    '오늘 14:00 · 32분',       '완료', 'done'],
    ['고객사 인터뷰',     '오늘 11:00 · 58분',       '변환중','proc'],
    ['전략기획 브리핑',   '어제 16:30 · 12분',       '실패', 'fail'],
    ['신입사원 OJT',      '2026.05.16 · 44분',       '완료', 'done'],
    ['상반기 실적 발표',  '2026.05.14 · 1시간 12분', '완료', 'done'],
  ];
  let cy = 192;
  for (const [title, meta, badge, type] of cards) {
    await addCard(f, cy, title, meta, badge, type);
    cy += 64;
  }

  await addFAB(f);
}

// ─────────────────────────────────────────────────────
//  화면 4 — 녹음 진행중
// ─────────────────────────────────────────────────────
async function buildRecording(page, xi) {
  const f = addFrame(page, '04 · 녹음 진행중', xi, 0, SW, SH, C.surface);
  await addStatusBar(f);

  addRect(f, 0, 50, SW, 46, C.surface);
  addRect(f, 16, 61, 28, 28, C.s2, { r: R.sm });
  await addText(f, '✕', 16, 64, 13, 500, C.text2, { w: 28, align: 'CENTER' });
  addRect(f, SW / 2 - 36, 62, 72, 24, C.accent, { r: R.sm, opacity: 0.9 });
  await addText(f, '● 진행 중', SW / 2 - 36, 67, 11, 700, C.W, { w: 72, align: 'CENTER' });

  // 타이머
  await addText(f, '00:00', 0, 126, 44, 700, C.text, { w: SW, align: 'CENTER' });

  // 파형
  const heights = [12, 28, 40, 44, 36, 22, 10];
  const waveX = SW / 2 - 40;
  for (let i = 0; i < 7; i++) {
    addRect(f, waveX + i * 12, 200 + (44 - heights[i]) / 2, 8, heights[i], C.accent, { r: 4 });
  }

  // 메모
  await addText(f, '메모', 20, 268, 10, 700, C.muted);
  addRect(f, 20, 284, SW - 40, 36, C.bg, { r: R.md, stroke: C.border, sw: 1 });
  await addText(f, '이 회의 이름은? (예: 주간 팀 미팅)', 34, 294, 11, 400, C.muted);

  // 컨트롤
  const btnY = SH - 128;
  const bw1 = (SW - 52) / 3;
  const bw2 = (SW - 52) - bw1 - 16;
  addRect(f, 20, btnY, bw1, 44, C.s2, { r: R.md });
  await addText(f, '일시정지', 20, btnY + 15, 13, 700, C.text2, { w: bw1, align: 'CENTER' });
  addRect(f, 20 + bw1 + 16, btnY, bw2, 44, C.accent, { r: R.md });
  await addText(f, '회의종료', 20 + bw1 + 16, btnY + 15, 13, 700, C.W, { w: bw2, align: 'CENTER' });
  await addText(f, '회의종료 → 저장 화면으로 이동', 0, SH - 76, 10, 400, C.muted, { w: SW, align: 'CENTER' });
}

// ─────────────────────────────────────────────────────
//  화면 5 — 회의종료 바텀시트
// ─────────────────────────────────────────────────────
async function buildSheet(page, xi) {
  const f = addFrame(page, '05 · 회의종료 시트', xi, 0, SW, SH, hex('#e8eaed'));
  await addStatusBar(f);
  addRect(f, 0, 0, SW, SH, C.K, { opacity: 0.3 });
  await addStatusBar(f);

  const shH = 228, sy = SH - shH;
  addRect(f, 0, sy, SW, shH, C.surface, { r: 14 });
  addRect(f, SW / 2 - 22, sy + 10, 44, 4, C.border, { r: 2 });

  await addText(f, '회의를 종료할까요?', 20, sy + 28, 14, 700, C.text);
  await addText(f, '제목을 입력하면 나중에 찾기 쉬워요', 20, sy + 50, 11, 400, C.muted);

  addRect(f, 20, sy + 72, SW - 40, 40, C.bg, { r: R.md, stroke: C.border, sw: 1 });
  await addText(f, '팀장 주간 미팅', 34, sy + 83, 12, 500, C.text);

  const bHalf = (SW - 52) / 2;
  addRect(f, 20, sy + 124, bHalf, 42, C.s2, { r: R.md });
  await addText(f, '취소', 20, sy + 138, 13, 700, C.text2, { w: bHalf, align: 'CENTER' });
  addRect(f, 20 + bHalf + 12, sy + 124, bHalf, 42, C.accent, { r: R.md });
  await addText(f, '회의종료', 20 + bHalf + 12, sy + 138, 13, 700, C.W, { w: bHalf, align: 'CENTER' });
}

// ─────────────────────────────────────────────────────
//  화면 6 — 상세 (완료)
// ─────────────────────────────────────────────────────
async function buildDetailDone(page, xi) {
  const f = addFrame(page, '06 · 상세 (완료)', xi, 0, SW, SH, C.bg);
  await addStatusBar(f);
  await addTopBar(f, '녹음 상세', { back: '회의' });
  let cy = 108;

  // 제목 카드
  addRect(f, 12, cy, SW - 24, 68, C.surface, { r: R.md, stroke: C.border, sw: 1 });
  await addText(f, '2분기 투자 전략 회의', 26, cy + 14, 13, 700, C.text);
  await addText(f, '2026.05.14  ·  42분 18초  ·  김이사', 26, cy + 36, 11, 400, C.muted);
  cy += 76;

  // 내부망 배너
  addRect(f, 12, cy, SW - 24, 40, C.amber, { r: R.md, stroke: C.amberBd, sw: 1 });
  await addText(f, '🔒  내부망 PC에서만 조회 가능합니다', 26, cy + 12, 10, 500, C.amberTx);
  cy += 48;

  // 상태 카드
  addRect(f, 12, cy, SW - 24, 90, C.surface, { r: R.md, stroke: C.border, sw: 1 });
  await addText(f, '녹음', 26, cy + 14, 12, 500, C.text);
  await addBadge(f, '완료', SW - 76, cy + 14, 'done');
  addRect(f, 24, cy + 41, SW - 36, 1, C.border, { opacity: 0.7 });
  await addText(f, '업로드', 26, cy + 49, 12, 500, C.text);
  await addBadge(f, '완료', SW - 76, cy + 49, 'done');
  addRect(f, 24, cy + 76, SW - 36, 1, C.border, { opacity: 0.7 });
  await addText(f, '전사', 26, cy + 64, 12, 500, C.text);
  await addBadge(f, '완료', SW - 76, cy + 64, 'done');
  cy += 98;

  // 버튼
  addRect(f, 12, cy, SW - 24, 42, C.accent, { r: R.md });
  await addText(f, '전사 결과 보기', 12, cy + 14, 13, 700, C.W, { w: SW - 24, align: 'CENTER' });
  cy += 50;
  const bHalf = (SW - 28) / 2;
  addRect(f, 12, cy, bHalf, 40, C.s2, { r: R.md });
  await addText(f, '재전송', 12, cy + 13, 13, 700, C.text2, { w: bHalf, align: 'CENTER' });
  addRect(f, 16 + bHalf, cy, bHalf, 40, C.failBg, { r: R.md });
  await addText(f, '삭제', 16 + bHalf, cy + 13, 13, 700, C.fail, { w: bHalf, align: 'CENTER' });

  await addFAB(f);
}

// ─────────────────────────────────────────────────────
//  화면 7 — 전사 결과
// ─────────────────────────────────────────────────────
async function buildTranscript(page, xi) {
  const f = addFrame(page, '07 · 전사 결과', xi, 0, SW, SH, C.bg);
  await addStatusBar(f);
  await addTopBar(f, '전사 결과', { back: '상세' });

  // 탭바
  addRect(f, 0, 98, SW, 44, C.surface, { stroke: C.border, sw: 1 });
  await addText(f, '원문', 0, 112, 12, 700, C.text, { w: SW / 2, align: 'CENTER' });
  addRect(f, 0, 140, SW / 2, 2, C.accent);
  await addText(f, '편집본', SW / 2, 112, 12, 500, C.muted, { w: SW / 2, align: 'CENTER' });

  let cy = 152;
  // 내부망 배너
  addRect(f, 12, cy, SW - 24, 40, C.amber, { r: R.md, stroke: C.amberBd, sw: 1 });
  await addText(f, '🔒  내부망 PC에서만 조회 가능합니다', 26, cy + 12, 10, 500, C.amberTx);
  cy += 48;

  // 발화 블록
  const segs = [
    { sp: '화자 A', spC: C.accent, spBg: hex('#e8f0fb'), ts: '00:00', txt: '안녕하세요, 오늘 2분기 투자 전략 회의를 시작하겠습니다. 먼저 지난 분기 포트폴리오 성과를 검토하겠습니다.' },
    { sp: '화자 B', spC: hex('#065f46'), spBg: hex('#d1fae5'), ts: '00:38', txt: '1분기 주식 비중을 60%까지 높인 결과 벤치마크 대비 2.3% 초과 수익을 달성했습니다.' },
    { sp: '화자 A', spC: C.accent, spBg: hex('#e8f0fb'), ts: '01:12', txt: '2분기에는 금리 환경 변화를 감안해 채권 비중을 소폭 늘리는 방향을 검토해봅시다.' },
    { sp: '화자 C', spC: hex('#92400e'), spBg: hex('#fef3c7'), ts: '01:50', txt: '리스크 관리팀과 협의해 채권 듀레이션 조정안을 다음 회의까지 정리하겠습니다.' },
  ];
  for (const s of segs) {
    addRect(f, 12, cy, SW - 24, 68, C.surface, { r: R.md, stroke: C.border, sw: 1 });
    addRect(f, 24, cy + 12, 46, 18, s.spBg, { r: 9 });
    await addText(f, s.sp, 24, cy + 14, 10, 700, s.spC, { w: 46, align: 'CENTER' });
    await addText(f, s.ts, 76, cy + 14, 10, 400, C.muted);
    await addText(f, s.txt, 24, cy + 36, 11, 400, hex('#374151'), { w: SW - 48 });
    cy += 74;
  }

  await addFAB(f);
}

// ─────────────────────────────────────────────────────
//  화면 8 — 상세 (처리중)
// ─────────────────────────────────────────────────────
async function buildDetailProc(page, xi) {
  const f = addFrame(page, '08 · 상세 (처리중)', xi, 0, SW, SH, C.bg);
  await addStatusBar(f);
  await addTopBar(f, '상세', { back: '회의' });
  let cy = 108;

  addRect(f, 12, cy, SW - 24, 68, C.surface, { r: R.md, stroke: C.border, sw: 1 });
  await addText(f, '고객사 인터뷰', 26, cy + 14, 13, 700, C.text);
  await addText(f, '2026.05.18  ·  58분  ·  김철수', 26, cy + 36, 11, 400, C.muted);
  cy += 76;

  addRect(f, 12, cy, SW - 24, 40, C.amber, { r: R.md, stroke: C.amberBd, sw: 1 });
  await addText(f, '🔒  내부망 PC에서만 조회 가능합니다', 26, cy + 12, 10, 500, C.amberTx);
  cy += 48;

  addRect(f, 12, cy, SW - 24, 90, C.surface, { r: R.md, stroke: C.border, sw: 1 });
  await addText(f, '생성', 26, cy + 14, 12, 500, C.text);
  await addBadge(f, '완료', SW - 76, cy + 14, 'done');
  addRect(f, 24, cy + 41, SW - 36, 1, C.border, { opacity: 0.7 });
  await addText(f, '업로드', 26, cy + 49, 12, 500, C.text);
  await addBadge(f, '완료', SW - 76, cy + 49, 'done');
  addRect(f, 24, cy + 76, SW - 36, 1, C.border, { opacity: 0.7 });
  await addText(f, '변환', 26, cy + 64, 12, 500, C.text);
  await addBadge(f, '처리중', SW - 88, cy + 64, 'proc');
  cy += 98;

  // 비활성 버튼
  addRect(f, 12, cy, SW - 24, 42, hex('#e5e7eb'), { r: R.md });
  await addText(f, '음성파일 변환중...', 12, cy + 14, 13, 700, hex('#9ca3af'), { w: SW - 24, align: 'CENTER' });
  cy += 50;
  const bHalf = (SW - 28) / 2;
  addRect(f, 12, cy, bHalf, 40, C.s2, { r: R.md });
  await addText(f, '파일 재생', 12, cy + 13, 13, 700, C.text2, { w: bHalf, align: 'CENTER' });
  addRect(f, 16 + bHalf, cy, bHalf, 40, C.failBg, { r: R.md });
  await addText(f, '회의 삭제', 16 + bHalf, cy + 13, 13, 700, C.fail, { w: bHalf, align: 'CENTER' });
  await addFAB(f);
}

// ─────────────────────────────────────────────────────
//  화면 9 — 상세 (실패)
// ─────────────────────────────────────────────────────
async function buildDetailFail(page, xi) {
  const f = addFrame(page, '09 · 상세 (실패)', xi, 0, SW, SH, C.bg);
  await addStatusBar(f);
  await addTopBar(f, '상세', { back: '회의' });
  let cy = 108;

  addRect(f, 12, cy, SW - 24, 68, C.surface, { r: R.md, stroke: C.border, sw: 1 });
  await addText(f, '전략기획 브리핑', 26, cy + 14, 13, 700, C.text);
  await addText(f, '2026.05.17  ·  12분  ·  김철수', 26, cy + 36, 11, 400, C.muted);
  cy += 76;

  // 실패 배너
  addRect(f, 12, cy, SW - 24, 40, C.failBg, { r: R.md, stroke: hex('#fca5a5'), sw: 1 });
  await addText(f, '⚠  업로드에 실패했습니다.', 26, cy + 12, 11, 700, C.fail);
  await addText(f, '재전송하기', SW - 82, cy + 12, 11, 700, C.fail);
  cy += 48;

  addRect(f, 12, cy, SW - 24, 90, C.surface, { r: R.md, stroke: C.border, sw: 1 });
  await addText(f, '생성', 26, cy + 14, 12, 500, C.text);
  await addBadge(f, '완료', SW - 76, cy + 14, 'done');
  addRect(f, 24, cy + 41, SW - 36, 1, C.border, { opacity: 0.7 });
  await addText(f, '업로드', 26, cy + 49, 12, 500, C.text);
  await addBadge(f, '실패', SW - 65, cy + 49, 'fail');
  addRect(f, 24, cy + 76, SW - 36, 1, C.border, { opacity: 0.7 });
  await addText(f, '변환', 26, cy + 64, 12, 500, C.text);
  await addText(f, '대기', SW - 58, cy + 64, 11, 400, C.muted);
  cy += 98;

  addRect(f, 12, cy, SW - 24, 42, C.fail, { r: R.md });
  await addText(f, '재전송하기', 12, cy + 14, 13, 700, C.W, { w: SW - 24, align: 'CENTER' });
  cy += 50;
  const bHalf = (SW - 28) / 2;
  addRect(f, 12, cy, bHalf, 40, C.s2, { r: R.md });
  await addText(f, '파일 재생', 12, cy + 13, 13, 700, C.text2, { w: bHalf, align: 'CENTER' });
  addRect(f, 16 + bHalf, cy, bHalf, 40, C.failBg, { r: R.md });
  await addText(f, '회의 삭제', 16 + bHalf, cy + 13, 13, 700, C.fail, { w: bHalf, align: 'CENTER' });
  await addFAB(f);
}

// ─────────────────────────────────────────────────────
//  화면 10 — 설정
// ─────────────────────────────────────────────────────
async function buildSettings(page, xi) {
  const f = addFrame(page, '10 · 설정', xi, 0, SW, SH, C.bg);
  await addStatusBar(f);
  addRect(f, 0, 50, SW, 48, C.surface, { stroke: C.border, sw: 1 });
  await addText(f, '설정', 16, 64, 13, 700, C.text);
  addRect(f, SW - 38, 60, 28, 28, C.blue, { r: R.sm, opacity: 0.1 });

  // 사용자 카드
  addRect(f, 12, 108, SW - 24, 72, C.surface, { r: R.md, stroke: C.border, sw: 1 });
  addRect(f, 24, 120, 48, 48, C.accent, { r: R.md });
  await addText(f, '김', 24, 134, 18, 700, C.W, { w: 48, align: 'CENTER' });
  await addText(f, '김이사', 82, 124, 14, 700, C.text);
  await addText(f, '리테일사업부 · lkim@ibkinvestment.com', 82, 144, 10, 400, C.muted, { w: SW - 110 });

  // 설정 섹션
  const sections = [
    { header: '계정',         rows: [['내 정보', null], ['생체 인증 (Face ID)', 'toggle']] },
    { header: '보안',         rows: [['자동 잠금', '5분 ›']] },
    { header: '업로드 · 알림', rows: [['Wi-Fi 전용 업로드', 'toggle'], ['전사 완료 알림', 'toggle']] },
  ];
  let cy = 192;
  for (const sec of sections) {
    await addText(f, sec.header, 16, cy, 10, 700, C.muted);
    cy += 20;
    const rowH = 48;
    addRect(f, 12, cy, SW - 24, sec.rows.length * rowH, C.surface, { r: R.md, stroke: C.border, sw: 1 });
    for (let i = 0; i < sec.rows.length; i++) {
      const [label, val] = sec.rows[i];
      await addText(f, label, 26, cy + 14 + i * rowH, 12, 500, C.text);
      if (val === 'toggle') {
        addRect(f, SW - 58, cy + 14 + i * rowH, 34, 20, C.accent, { r: 10 });
        addRect(f, SW - 28, cy + 16 + i * rowH, 16, 16, C.W, { r: 8 });
      } else if (val) {
        await addText(f, val, SW - 70, cy + 14 + i * rowH, 11, 400, C.muted);
      }
      if (i < sec.rows.length - 1) {
        addRect(f, 24, cy + (i + 1) * rowH, SW - 36, 1, C.border, { opacity: 0.7 });
      }
    }
    cy += sec.rows.length * rowH + 12;
  }

  // 로그아웃
  addRect(f, 12, cy, SW - 24, 42, C.surface, { r: R.md, stroke: C.border, sw: 1 });
  await addText(f, '로그아웃', 12, cy + 14, 12, 700, C.fail, { w: SW - 24, align: 'CENTER' });
}

// ─────────────────────────────────────────────────────
//  메인
// ─────────────────────────────────────────────────────
async function main() {
  const page = figma.currentPage;
  page.name = 'IBK STT — 디자인 시안';

  const builders = [
    buildSplash,
    buildLogin,
    buildHome,
    buildRecording,
    buildSheet,
    buildDetailDone,
    buildTranscript,
    buildDetailProc,
    buildDetailFail,
    buildSettings,
  ];

  for (let i = 0; i < builders.length; i++) {
    await builders[i](page, i * (SW + GAP));
  }

  figma.viewport.scrollAndZoomIntoView(page.children);
  figma.closePlugin(`✅ IBK STT 화면 ${builders.length}개 생성 완료!`);
}

main().catch(err => figma.closePlugin(`❌ 오류: ${err.message}`));
