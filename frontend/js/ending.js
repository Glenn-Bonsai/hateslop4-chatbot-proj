// ═══════════════════════════════════════════════
//  ending.js  —  루프3 사망 엔딩 화면
//  흐름: 치키 대사 순차 타이핑 → 탭으로 다음 진행
//        특정 구간에서 치키 이미지 교체
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
//  치키 이미지 목록
//  실제 파일명에 맞게 수정해주세요
// ─────────────────────────────────────────────
const CHIKI_IMAGES = {
  default:  'images/chiki_img.png',         // 기본 치키
  smile:    'images/chiki_smile.png',        // 웃는 치키 — 실제 파일명으로 수정
  laugh:    'images/chiki_laugh.png',        // 더 세게 웃는 치키 — 실제 파일명으로 수정
  close:    'images/chiki_close.png',        // 치키가 가까이 다가옴 — 실제 파일명으로 수정
  whisper:  'images/chiki_whisper.png',      // 귓속말 제스처 — 실제 파일명으로 수정
};

// 모래시계는 별도 이미지 (치키 이미지 아님 — 필요시 오버레이 가능)
// 현재 구현: 대사로만 처리, 필요시 아래 주석 해제해서 삽입 가능

// ─────────────────────────────────────────────
//  대사 시퀀스
//  image:   해당 대사 시작 시 치키 이미지 교체 (없으면 유지)
//  text:    화면에 타이핑될 텍스트 (HTML 태그 사용 가능)
//  speed:   타이핑 속도 (ms/글자), 기본 40
//  pause:   타이핑 완료 후 자동 대기 (ms), 0이면 탭 대기
//  pauseBeforeType: 이미지 교체 후 타이핑 시작 전 대기 (ms)
// ─────────────────────────────────────────────
const SCRIPT = [
  {
    image: 'default',
    text: '……아아.\n결국 또 여기까지 왔네 🐰',
    speed: 45,
  },
  {
    text: '이번엔 꽤 오래 버텼다?\n치키 조금 놀랐어. 히히.',
    speed: 40,
  },
  {
    text: '범인 찾았어? 누가 널 죽였는지… 왜 죽였는지… \n다 알아냈어? ☁️',
    speed: 38,
  },
  {
    text: '……근데 있지.\n너 계속 착각하고 있었어.\n이 게임은 원래부터\n\'범인 찾기\' 같은 게 아니었거든 ⏳',
    speed: 42,
  },
  {
    image: 'smile',
    pauseBeforeType: 400,
    text: '너는 계속 자기가 피해자라고 믿었지. 그래야 편하니까 🙂\n\n근데 이상하지 않았어?\n왜 다들 널 그렇게 무서워했을까. \n왜 죽은 사람들 이름이… 전부 네 주변에만 있었을까 💭',
    speed: 38,
  },
  {
    image: 'laugh',
    pauseBeforeType: 300,
    text: '<span class="name-em">김하윤. 박주원. 나영.</span> 다 기억나? 🐰',
    speed: 48,
  },
  {
    text: '치키는 처음부터 다 알고 있었어. 네가 어떤 사람이었는지. 무슨 짓을 했는지.',
    speed: 38,
  },
  {
    text: '왜냐하면—\n\n치키는 이 루프의 <span class="ominous">관리자</span>니까.\n죽은 사람들을 대신해서 너를 여기 붙잡아두는 <span class="ominous">집행자</span> 🐰\n\n도망치게 하면 안 되거든.',
    speed: 40,
  },
  {
    // 모래시계 이미지가 있다면 여기서 별도 처리 가능
    // 현재는 텍스트로만 표현
    text: '그래서 계속 반복된 거야 ⏳\n\n죽기 24시간 전.\n네가 끝까지 외면했던 순간을 다시 보게 하려고.',
    speed: 42,
  },
  {
    image: 'close',
    pauseBeforeType: 600,
    text: '이제 알겠어? 왜 아무도 널 구해주지 않았는지.\n왜 넌 매번 죽어야 했는지.\n왜 치키가 계속 웃고 있었는지 🐰',
    speed: 38,
  },
  {
    image: 'whisper',
    pauseBeforeType: 500,
    text: '이번엔…\n\n정말 끝낼 수 있을까?',
    speed: 52,
    isLast: true,
  },
];

// ─────────────────────────────────────────────
//  상태
// ─────────────────────────────────────────────
let currentIdx = 0;
let isTyping = false;
let typeTimeout = null;
let waitingForTap = false;

// ─────────────────────────────────────────────
//  DOM 레퍼런스
// ─────────────────────────────────────────────
const chikiImg   = document.getElementById('chiki-img');
const bubbleText = document.getElementById('bubble-text');
const cursor     = document.getElementById('cursor');
const tapHint    = document.getElementById('tap-hint');
const app        = document.getElementById('app');

// ─────────────────────────────────────────────
//  치키 이미지 교체 (페이드)
// ─────────────────────────────────────────────
function changeChikiImage(key) {
  const src = CHIKI_IMAGES[key];
  if (!src || chikiImg.src.endsWith(src.split('/').pop())) return;

  chikiImg.classList.add('fade-out');
  chikiImg.style.opacity = '0';

  setTimeout(() => {
    chikiImg.src = src;
    chikiImg.onerror = () => { chikiImg.style.display = 'none'; };
    chikiImg.style.opacity = '1';
    chikiImg.classList.remove('fade-out');
    chikiImg.classList.add('fade-in');
    setTimeout(() => chikiImg.classList.remove('fade-in'), 400);
  }, 300);
}

// ─────────────────────────────────────────────
//  HTML 인식 타이핑 (태그 건너뜀)
// ─────────────────────────────────────────────
function typeHTML(html, speed, onDone) {
  // HTML을 파싱해서 텍스트 노드와 태그를 분리
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // 렌더링 순서를 [(type, content)] 배열로
  const chunks = [];
  temp.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      // 텍스트: 한 글자씩
      [...node.textContent].forEach(ch => chunks.push({ type: 'char', ch }));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // 태그: 통째로 (내부 텍스트도 한번에)
      chunks.push({ type: 'html', html: node.outerHTML });
    }
  });

  bubbleText.innerHTML = '';
  let i = 0;

  function next() {
    if (i >= chunks.length) {
      onDone();
      return;
    }
    const chunk = chunks[i++];
    if (chunk.type === 'char') {
      // \n → <br>
      if (chunk.ch === '\n') {
        bubbleText.appendChild(document.createElement('br'));
      } else {
        bubbleText.appendChild(document.createTextNode(chunk.ch));
      }
      typeTimeout = setTimeout(next, speed);
    } else {
      // HTML 태그 통째로 삽입
      const span = document.createElement('span');
      span.innerHTML = chunk.html;
      bubbleText.appendChild(span);
      typeTimeout = setTimeout(next, speed * 2); // 태그 후 약간 지연
    }
  }

  next();
}

// ─────────────────────────────────────────────
//  현재 대사 표시
// ─────────────────────────────────────────────
function showLine(idx) {
  if (idx >= SCRIPT.length) {
    endSequence();
    return;
  }

  const line = SCRIPT[idx];
  isTyping = true;
  waitingForTap = false;
  tapHint.style.display = 'none';
  cursor.classList.remove('hidden');

  // 이미지 교체
  if (line.image) {
    changeChikiImage(line.image);
  }

  const startTyping = () => {
    typeHTML(line.text, line.speed || 40, () => {
      // 타이핑 완료
      isTyping = false;
      cursor.classList.add('hidden');

      if (line.isLast) {
        // 마지막 대사 — 아무것도 안 함 (화면 유지)
        tapHint.style.display = 'none';
        return;
      }

      // 탭 대기
      waitingForTap = true;
      tapHint.style.display = 'block';
    });
  };

  // 이미지 교체 후 약간 대기 후 타이핑
  const delay = line.pauseBeforeType || 0;
  if (delay > 0) {
    setTimeout(startTyping, delay);
  } else {
    startTyping();
  }
}

// ─────────────────────────────────────────────
//  탭 이벤트 — 타이핑 중이면 즉시 완성, 아니면 다음 대사
// ─────────────────────────────────────────────
function handleTap() {
  if (isTyping) {
    // 즉시 완성
    clearTimeout(typeTimeout);
    isTyping = false;
    cursor.classList.add('hidden');

    const line = SCRIPT[currentIdx];
    // HTML 파싱해서 전체 삽입
    bubbleText.innerHTML = line.text.replace(/\n/g, '<br>');

    waitingForTap = true;
    tapHint.style.display = 'block';
    return;
  }

  if (waitingForTap) {
    waitingForTap = false;
    tapHint.style.display = 'none';
    currentIdx++;
    showLine(currentIdx);
  }
}

// ─────────────────────────────────────────────
//  마지막 대사 이후 — 화면 암전 후 종료
// ─────────────────────────────────────────────
function endSequence() {
  // 필요하다면 여기서 다음 페이지로 이동하거나 암전 처리
  // 현재: 화면 유지 (마지막 대사에 isLast: true 설정됨)
}

// ─────────────────────────────────────────────
//  이벤트 등록
// ─────────────────────────────────────────────
app.addEventListener('click', handleTap);
app.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleTap();
}, { passive: false });

// ─────────────────────────────────────────────
//  시작
// ─────────────────────────────────────────────
(function init() {
  // suspect.js의 goToEnding()에서 이 페이지를 로드하거나
  // scene-ending을 이 파일로 대체하는 방식으로 연동
  showLine(0);
})();