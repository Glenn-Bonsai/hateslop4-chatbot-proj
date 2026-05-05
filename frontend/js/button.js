// ═══════════════════════════════════════════════
//  button.js  —  Phase 1 버튼 선택 UI 동작 로직
//  담당: 게임 상태 / 타이머 / 선택지 렌더링 /
//        버튼 클릭 처리 / 씬 업데이트 / 피 방울 생성
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
//  게임 상태
// ─────────────────────────────────────────────
const GAME_STATE = {
  timer:     { h:0, m:47, s:12 },
  clues:     { cur:2, total:7 },
  heartRate: 72,
  trust:     28,
};

// ─────────────────────────────────────────────
//  선택지 데이터
//  TODO: 백엔드 연동 시 GET /available-buttons 로 교체
//        disabled 여부는 disabled_button_ids 수신 후 적용
// ─────────────────────────────────────────────
const CHOICES = [
  { id:600, iconType:'door',  text:'문을 연다',   trustDelta:-5, disabled:false },
  { id:601, iconType:'lock',  text:'문을 잠근다', trustDelta:+5, disabled:false },
];

// ─────────────────────────────────────────────
//  아이콘 SVG 맵
// ─────────────────────────────────────────────
const ICONS = {
  door:
    `<svg viewBox="0 0 24 24"><rect x="3" y="2" width="14" height="20" rx="1"/>
     <path d="M17 9l4 3-4 3"/>
     <circle cx="14.5" cy="12" r=".8" fill="rgba(0,200,170,0.85)" stroke="none"/></svg>`,
  question:
    `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/>
     <path d="M12 8a2 2 0 011.886 2.667C13.5 11.5 12 12 12 13"/>
     <circle cx="12" cy="16.5" r=".8" fill="rgba(0,200,170,0.85)" stroke="none"/></svg>`,
  lock:
    `<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/>
     <path d="M8 11V7a4 4 0 018 0v4"/></svg>`,
};

// ─────────────────────────────────────────────
//  피 방울 생성
// ─────────────────────────────────────────────
function createDrips() {
  const container = document.getElementById('dripContainer');
  const drips = [
    { left:'12%', len:'22px', dur:'7s',  delay:'1.5s' },
    { left:'28%', len:'14px', dur:'9s',  delay:'4.2s' },
    { left:'43%', len:'30px', dur:'11s', delay:'0.8s' },
    { left:'61%', len:'18px', dur:'8s',  delay:'3.0s' },
    { left:'75%', len:'25px', dur:'10s', delay:'6.5s' },
    { left:'88%', len:'12px', dur:'13s', delay:'2.1s' },
  ];
  drips.forEach(d => {
    const el = document.createElement('div');
    el.className = 'drip';
    el.style.left = d.left;
    el.style.setProperty('--len', d.len);
    el.style.setProperty('--dur', d.dur);
    el.style.setProperty('--delay', d.delay);
    container.appendChild(el);
  });
}

// ─────────────────────────────────────────────
//  타이머
// ─────────────────────────────────────────────
const timerEl = document.getElementById('timerDisplay');
let total = GAME_STATE.timer.h * 3600 + GAME_STATE.timer.m * 60 + GAME_STATE.timer.s;

setInterval(() => {
  if (total <= 0) return;
  total--;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  timerEl.textContent =
    String(h).padStart(2,'0') + ':' +
    String(m).padStart(2,'0') + ':' +
    String(s).padStart(2,'0');
  if (total < 300) timerEl.classList.add('urgent');
}, 1000);

// ─────────────────────────────────────────────
//  선택지 렌더링
// ─────────────────────────────────────────────
function renderChoices(choices) {
  const sec = document.getElementById('choicesSection');
  sec.innerHTML = '';

  choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn' + (c.disabled ? ' disabled' : '');
    btn.dataset.id = c.id;
    btn.innerHTML = `<span class="choice-text">${c.text}</span>`;
    if (!c.disabled) btn.addEventListener('click', () => onChoice(c, btn));
    sec.appendChild(btn);
  });
}

// ─────────────────────────────────────────────
//  버튼 클릭 처리
// ─────────────────────────────────────────────
function onChoice(choice, btn) {
  // 선택 하이라이트
  document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  // 클릭 플래시 연출
  const fl = document.getElementById('flashOverlay');
  fl.classList.add('on');
  setTimeout(() => fl.classList.remove('on'), 140);

  // 상태 업데이트
  GAME_STATE.trust     = Math.max(0, Math.min(100, GAME_STATE.trust + choice.trustDelta));
  GAME_STATE.heartRate = Math.min(130, GAME_STATE.heartRate + Math.abs(choice.trustDelta) * 2);

  console.log('[선택]', choice.id, choice.text);

  // ── FUTURE: 백엔드 연동 시 아래로 교체 ──────────
  // sendChoiceToBackend(choice);
}

// ─────────────────────────────────────────────
//  씬 이미지 교체
// ─────────────────────────────────────────────
function setSceneImage(url) {
  if (!url) return;
  const img = document.getElementById('sceneImage');
  const fig = document.getElementById('sceneFigure');
  img.src = url;
  img.style.display = 'block';
  if (fig) fig.style.display = 'none';
}

// ─────────────────────────────────────────────
//  씬 전체 업데이트 (백엔드 응답 수신 시 호출)
// ─────────────────────────────────────────────
function updateScene({ imageUrl, speaker, dialogue, choices }) {
  if (imageUrl !== undefined) setSceneImage(imageUrl);
  if (speaker) {
    document.getElementById('speakerName').textContent = speaker.name;
    document.getElementById('speakerRole').textContent = speaker.role;
  }
  if (dialogue) {
    document.getElementById('dialogueText').innerHTML = dialogue.replace(/\n/g, '<br>');
  }
  if (choices) renderChoices(choices);
}

// ─────────────────────────────────────────────
//  초기화
// ─────────────────────────────────────────────
renderChoices(CHOICES);
createDrips();

// 전역 API — 백엔드 연동 시 updateScene() 호출
window.GameUI = { updateScene, renderChoices, setSceneImage };

// ── FUTURE BACKEND INTEGRATION ───────────────────────────
// async function sendChoiceToBackend(choice) {
//   const session_id = sessionStorage.getItem('session_id');
//   const res = await fetch('/finalize', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       session_id,
//       last_button_id: choice.id,
//       context: [choice.text],
//     })
//   });
//   const data = await res.json();
//   // data.disabled_button_ids → 비활성화할 버튼 ID 목록
//   // data.session_id          → chatroom.html 이동 시 사용
//   applyDisabledButtons(data.disabled_button_ids);
// }
//
// function applyDisabledButtons(ids = []) {
//   document.querySelectorAll('.choice-btn').forEach(btn => {
//     if (ids.includes(Number(btn.dataset.id))) {
//       btn.classList.add('disabled');
//       btn.style.pointerEvents = 'none';
//     }
//   });
// }
//
// 마지막 버튼 선택 완료 후 chatroom으로 이동:
// sessionStorage.setItem('session_id', data.session_id);
// window.location.href = 'chatroom.html';
