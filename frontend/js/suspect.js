// ═══════════════════════════════════════════════
//  suspect.js  —  범인 선택 화면 로직
//  흐름: 치키 등장 → 범인 선택 → 확인 멘트
//        → 밤 → 사망 이미지 → 다음 루프(or 엔딩)
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
//  세션 데이터 로드
// ─────────────────────────────────────────────
const SESSION_ID = sessionStorage.getItem('session_id');
const LAST_BTN_ID = parseInt(sessionStorage.getItem('last_button_id') || '0', 10);
const LOOP_NUM = parseInt(sessionStorage.getItem('loop_num') || '1', 10);
const BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "https://hateslop4-dead24.onrender.com";

// ─────────────────────────────────────────────
//  범인 NPC → 사망 이미지 매핑
// ─────────────────────────────────────────────
const VILLAIN_MAP = {
  511: '엄마', 608: '엄마', 609: '엄마', 610: '엄마', 611: '엄마',
  612: '엄마', 613: '엄마', 614: '엄마', 615: '엄마', 620: '엄마',
  600: '김도현', 602: '김도현', 604: '김도현', 606: '김도현',
  708: '김도현', 709: '김도현', 710: '김도현', 711: '김도현',
  712: '김도현', 713: '김도현', 714: '김도현', 715: '김도현',
  724: '김도현', 725: '김도현', 728: '김도현', 731: '김도현',
  732: '김도현', 733: '김도현', 739: '김도현', 746: '김도현',
  747: '김도현', 749: '김도현', 750: '김도현', 752: '김도현',
  753: '김도현', 754: '김도현', 755: '김도현', 759: '김도현',
  760: '김도현', 761: '김도현', 762: '김도현', 764: '김도현',
  621: '박도원', 622: '박도원', 624: '박도원', 626: '박도원', 628: '박도원',
  716: '박도원', 717: '박도원', 718: '박도원', 719: '박도원',
  720: '박도원', 721: '박도원', 722: '박도원', 723: '박도원',
  742: '박도원', 745: '박도원', 748: '박도원', 751: '박도원',
  758: '박도원', 765: '박도원',
  700: '차서연', 701: '차서연', 702: '차서연', 703: '차서연',
  704: '차서연', 705: '차서연', 706: '차서연', 707: '차서연',
  726: '차서연', 727: '차서연', 729: '차서연', 730: '차서연',
  734: '차서연', 735: '차서연', 736: '차서연', 737: '차서연',
  738: '차서연', 740: '차서연', 741: '차서연', 743: '차서연',
  744: '차서연', 756: '차서연', 757: '차서연', 763: '차서연',
};

const DEATH_IMAGE_MAP = {
  '김도현': 'https://res.cloudinary.com/dqu0dyn5k/image/upload/v1778550922/%E1%84%89%E1%85%A1%E1%84%86%E1%85%A1%E1%86%BC_%E1%84%8E%E1%85%AE%E1%84%85%E1%85%A1%E1%86%A8%E1%84%89%E1%85%A1_leqyal.png',
  '차서연': 'https://res.cloudinary.com/dqu0dyn5k/image/upload/v1778550915/%E1%84%89%E1%85%A1%E1%84%86%E1%85%A1%E1%86%BC_%E1%84%91%E1%85%B5_%E1%84%90%E1%85%A9_%E1%84%92%E1%85%A1%E1%84%82%E1%85%B3%E1%86%AB_%E1%84%89%E1%85%A1%E1%84%85%E1%85%A1%E1%86%B7_jwvvkz.png',
  '박도원': 'https://res.cloudinary.com/dqu0dyn5k/image/upload/v1778550917/%E1%84%89%E1%85%A1%E1%84%86%E1%85%A1%E1%86%BC2_%E1%84%8F%E1%85%A1%E1%86%AF_h0io4f.png',
  '엄마':   'https://res.cloudinary.com/dqu0dyn5k/image/upload/v1778550920/%E1%84%89%E1%85%A1%E1%84%86%E1%85%A1%E1%86%BC_%E1%84%B0%E1%85%A1%E1%86%BC_wqnnyz.png',
};

const NPC_INFO = {
  '김도현': { color: '#6a7f99', role: '내담자', initials: '도현', profile: 'https://res.cloudinary.com/dqu0dyn5k/image/upload/v1778595803/chat/%EA%B9%80%EB%8F%84%ED%98%84/%EA%B9%80%EB%8F%84%ED%98%84_%ED%94%84%EB%A1%9C%ED%95%84.png'},
  '차서연': { color: '#5a8870', role: '신경과 의사', initials: '서연', profile: 'https://res.cloudinary.com/dqu0dyn5k/image/upload/v1778595780/chat/%EC%B0%A8%EC%84%9C%EC%97%B0/%EC%B0%A8%EC%84%9C%EC%97%B0_%ED%94%84%EB%A1%9C%ED%95%84.png'},
  '박도원': { color: '#7a6a5a', role: '청소부', initials: '도원', profile: 'https://res.cloudinary.com/dqu0dyn5k/image/upload/v1778595793/chat/%EB%B0%95%EB%8F%84%EC%9B%90/%EB%B0%95%EB%8F%84%EC%9B%90_%ED%94%84%EB%A1%9C%ED%95%84.png' },
  '엄마':   { color: '#8a7040', role: '가족', initials: '엄마', displayName: '윤미경', profile: 'https://res.cloudinary.com/dqu0dyn5k/image/upload/v1778595813/chat/%EC%97%84%EB%A7%88/%EC%97%84%EB%A7%88_%ED%94%84%EB%A1%9C%ED%95%84.png' },
};

// ─────────────────────────────────────────────
//  상태
// ─────────────────────────────────────────────
let selectedSuspect = null;
const ACTUAL_VILLAIN = VILLAIN_MAP[LAST_BTN_ID] || '김도현';

// ─────────────────────────────────────────────
//  씬 전환
// ─────────────────────────────────────────────
function showScene(id) {
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function fadeToScene(id, delay = 0) {
  setTimeout(() => showScene(id), delay);
}

// ─────────────────────────────────────────────
//  이미지 로드 헬퍼
// ─────────────────────────────────────────────
function loadImg(imgEl, src, fallbackEl) {
  if (!src) {
    imgEl.style.display = 'none';
    if (fallbackEl) fallbackEl.style.display = 'flex';
    return;
  }
  const encoded = src.startsWith('http') ? src : (() => {
    const parts = src.split('/');
    const filename = parts.pop();
    return parts.join('/') + '/' + encodeURIComponent(filename);
  })();
  imgEl.style.display = 'block';
  if (fallbackEl) fallbackEl.style.display = 'none';
  imgEl.src = encoded;
  imgEl.onerror = () => {
    imgEl.style.display = 'none';
    if (fallbackEl) fallbackEl.style.display = 'flex';
  };
}

// ─────────────────────────────────────────────
//  범인 선택 카드 렌더링
// ─────────────────────────────────────────────
function renderSuspectCards() {
  const grid = document.getElementById('suspect-grid');
  const npcs = ['김도현', '차서연', '박도원', '엄마'];
  grid.innerHTML = npcs.map(name => {
    const info = NPC_INFO[name];
    return `
      <div class="suspect-card" data-name="${name}" onclick="selectSuspect('${name}', this)">
        <div class="suspect-avatar" style="border-color:${info.color}33;">
          <img src="${info.profile}" alt="${info.initials}"
               style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
               onerror="this.style.display='none';this.parentElement.innerHTML+='<span class=\\'avatar-initials\\' style=\\'color:${info.color};position:absolute;\\'>${info.initials}</span>'">
        </div>
        <div class="suspect-name">${info.displayName ?? name}</div>
        <div class="suspect-role">${info.role}</div>
      </div>
    `;
  }).join('');
}

function selectSuspect(name, el) {
  selectedSuspect = name;
  document.querySelectorAll('.suspect-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const btn = document.getElementById('confirm-btn');
  btn.classList.add('visible');
}

// ─────────────────────────────────────────────
//  확정 버튼 클릭
// ─────────────────────────────────────────────
function confirmSuspect() {
  if (!selectedSuspect) return;
  document.getElementById('chiki-confirm-text').innerHTML =
    `내가 <span class="highlight">${selectedSuspect}</span>으로부터 지켜줄게~! 🐰✨<br>걱정 마, 치키가 옆에 있을게.`;
  showScene('scene-confirm');
  fadeToScene('scene-night', 3000);
  loadImg(
    document.getElementById('night-img'),
    'https://res.cloudinary.com/dqu0dyn5k/image/upload/v1778550920/%E1%84%89%E1%85%A1%E1%84%86%E1%85%A1%E1%86%BC_%E1%84%B0%E1%85%A1%E1%86%BC_wqnnyz.png',
    document.getElementById('night-fallback')
  );
  setTimeout(() => { goToDeath(); }, 5500);
}

// ─────────────────────────────────────────────
//  사망 씬
// ─────────────────────────────────────────────
function goToDeath() {
  showScene('scene-death');
  const deathImg = DEATH_IMAGE_MAP[ACTUAL_VILLAIN] || DEATH_IMAGE_MAP['김도현'];
  loadImg(
    document.getElementById('death-img'),
    deathImg,
    document.getElementById('death-fallback')
  );
  notifyDeath();
  setTimeout(() => {
    if (LOOP_NUM >= 3) {
      goToEnding();
    } else {
      goToMorning();
    }
  }, 3500);
}

// ─────────────────────────────────────────────
//  아침 씬 (다음 루프)
// ─────────────────────────────────────────────
function goToMorning() {
  const nextLoop = LOOP_NUM + 1;
  showScene('scene-morning');
  document.getElementById('next-loop-badge').textContent = `LOOP ${nextLoop}`;
  document.getElementById('next-loop-title').textContent = `${nextLoop}번째 하루`;
  loadImg(
    document.getElementById('morning-img'),
    'https://res.cloudinary.com/dqu0dyn5k/image/upload/v1778550044/bg_room_yn5qfy.png',
    document.getElementById('morning-fallback')
  );
  sessionStorage.setItem('loop_num', String(nextLoop));
  sessionStorage.removeItem('timer_start');
}

function tapMorning() {
  window.location.href = '/button';
}

// ─────────────────────────────────────────────
//  엔딩 전환 — 글리치 + 사운드 + 블랙아웃
// ─────────────────────────────────────────────
function goToEnding() {
  // 1. 현재 씬 위에 글리치 오버레이 생성
  const overlay = document.createElement('div');
  overlay.id = 'glitch-transition-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:#000;opacity:0;pointer-events:all;
  `;
  document.body.appendChild(overlay);

  // 2. Web Audio: 지지직 + 팍 사운드
  playGlitchSound();

  // 3. 화면 지지직 CSS 글리치 (0~900ms)
  const appEl = document.querySelector('#app') || document.body;
  appEl.classList.add('ending-glitch-anim');

  // 4. 900ms 후 팍 — 블랙아웃
  setTimeout(() => {
    appEl.classList.remove('ending-glitch-anim');
    overlay.style.transition = 'opacity 0.08s ease';
    overlay.style.opacity = '1';
  }, 900);

  // 5. 블랙아웃 완료 후 ending 페이지로
  setTimeout(() => {
    window.location.href = '/ending';
  }, 1100);
}

// ─────────────────────────────────────────────
//  Web Audio: 지지직 + 팍 컷오프
// ─────────────────────────────────────────────
function playGlitchSound() {
  try {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();

    const duration = 1.0;
    const sampleRate = actx.sampleRate;
    const bufSize = Math.floor(sampleRate * duration);
    const buf = actx.createBuffer(1, bufSize, sampleRate);
    const data = buf.getChannelData(0);

    // 화이트 노이즈 생성
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const src = actx.createBufferSource();
    src.buffer = buf;

    const gain = actx.createGain();
    const filter = actx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, actx.currentTime);
    filter.frequency.linearRampToValueAtTime(600, actx.currentTime + duration);
    filter.Q.value = 0.7;

    const now = actx.currentTime;

    // 볼륨 곡선: 빠르게 올라오다 → 지지직 떨림 → 팍 컷
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.04);

    // 지지직 스터터링 (볼륨 떨림)
    const stutterCount = 14;
    for (let i = 0; i < stutterCount; i++) {
      const t = now + 0.04 + i * (0.76 / stutterCount);
      const v = 0.15 + Math.random() * 0.35;
      gain.gain.linearRampToValueAtTime(v, t);
      gain.gain.linearRampToValueAtTime(Math.random() * 0.08, t + 0.025);
    }

    // 팍 — 즉각 컷오프 (0.88초 시점)
    gain.gain.linearRampToValueAtTime(0.5, now + 0.85);
    gain.gain.setValueAtTime(0, now + 0.88);  // 즉각 컷

    src.connect(filter);
    filter.connect(gain);
    gain.connect(actx.destination);
    src.start(now);
    src.stop(now + duration);
  } catch (e) {
    console.warn('[Web Audio] 재생 실패:', e.message);
  }
}

// ─────────────────────────────────────────────
//  글리치 CSS 애니메이션 (suspect 페이지 전체)
//  suspect.html <head> 또는 suspect.css에 추가 필요
// ─────────────────────────────────────────────
(function injectGlitchStyle() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes endingGlitch {
      0%   { transform:translate(0);   filter:none; }
      10%  { transform:translate(-3px,0); filter:brightness(1.3) contrast(1.2); }
      12%  { transform:translate(3px,0);  filter:brightness(0.7); }
      14%  { transform:translate(0);   filter:none; }
      30%  { transform:translate(0);   filter:none; }
      32%  { transform:translate(-4px,1px); filter:hue-rotate(30deg) brightness(1.4); }
      34%  { transform:translate(4px,-1px); filter:hue-rotate(-20deg); }
      36%  { transform:translate(0);   filter:none; }
      55%  { transform:translate(0);   filter:none; }
      57%  { transform:translate(-2px,0); filter:brightness(1.5) contrast(1.3); }
      58%  { transform:translate(2px,0);  filter:brightness(0.6); }
      60%  { transform:translate(0);   filter:none; }
      75%  { transform:translate(0);   filter:none; }
      77%  { transform:translate(-5px,0); filter:brightness(1.8) contrast(1.5); }
      79%  { transform:translate(5px,0);  filter:brightness(0.4) contrast(1.8); }
      82%  { transform:translate(-3px,0); filter:brightness(2.0); }
      85%  { transform:translate(0);   filter:brightness(0.3); }
      90%  { transform:translate(-6px,0); filter:brightness(2.5) contrast(2); }
      93%  { transform:translate(0);   filter:brightness(0.1); }
      100% { transform:translate(0);   filter:none; }
    }
    .ending-glitch-anim {
      animation: endingGlitch 0.9s steps(1) forwards;
    }
  `;
  document.head.appendChild(style);
})();

// ─────────────────────────────────────────────
//  백엔드 연동
// ─────────────────────────────────────────────
async function notifyDeath() {
  if (!SESSION_ID) return;
  try {
    await fetch(`${BASE_URL}/player-dead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: SESSION_ID }),
    });
    if (LOOP_NUM < 3) {
      const res = await fetch(`${BASE_URL}/new-loop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: SESSION_ID }),
      });
      const data = await res.json();
      console.log('[new-loop]', data);
    }
  } catch (e) {
    console.warn('[백엔드 미연결] 오프라인 모드:', e.message);
  }
}

// ─────────────────────────────────────────────
//  초기화
// ─────────────────────────────────────────────
(function init() {
  const deathCause = sessionStorage.getItem('death_cause');
  sessionStorage.removeItem('death_cause');

  if (deathCause === 'timer') {
    showScene('scene-death');
    loadImg(
      document.getElementById('death-img'),
      'https://res.cloudinary.com/dqu0dyn5k/image/upload/v1778550922/%E1%84%89%E1%85%A1%E1%84%86%E1%85%A1%E1%86%BC_%E1%84%8E%E1%85%AE%E1%84%85%E1%85%A1%E1%86%A8%E1%84%89%E1%85%A1_leqyal.png',
      document.getElementById('death-fallback')
    );
    setTimeout(() => {
      if (LOOP_NUM >= 3) goToEnding();
      else goToMorning();
    }, 3500);
  } else {
    renderSuspectCards();
    showScene('scene-select');
  }
})();
