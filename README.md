# hateslop4-chatbot-proj

# 엔지니어 파트 필수 구현 요구사항

## 원문
> LLM 모델을 활용하여, 캐릭터의 성격/세계관 등이 담긴 챗봇 구현
> - 항상 캐릭터의 컨셉이 유지된 답변이 잘 나올 수 있도록 최적화 (필수)
>   - RAG와 프롬프트 엔지니어링을 활용 (모델 gpt-4o 사용 가능, 팀당 대략 300~400회)
> - DB내 있는 이미지와 답변 문장의 임베딩 벡터 유사도를 통한 적절한 이미지 출력 (필수)
> - javascript, html을 활용하여 채팅 인터페이스를 동적으로 구현 (필수)

---

## 역할 분담

| | 엔지니어 A | 엔지니어 B |
|---|---|---|
| LLM | Phase 3 (RAG) + chat_node.py 최종 수정 | Phase 4 (이미지 임베딩) |
| 추가 담당 | Phase 6 (백엔드 API) | Phase 5 (채팅 UI) |

**브랜치 규칙**
- 엔지니어 A: `RAG`
- 엔지니어 B: `image`

**chat_node.py 수정 규칙**
- 엔지니어 A, B 각자 Phase 3/4 작업 중 chat_node.py를 직접 수정하지 않는다.
- 각자 수정할 내용을 별도 함수/파일로 작성해 전달한다.
- Phase 3, 4가 모두 완료된 후 엔지니어 A(본인)가 chat_node.py를 한 번에 수정한다.

**병행 가능한 구간**
- Phase 3/4/5/6 전부 동시 진행 가능
- Phase 7(통합 테스트)은 3/4/5/6 완료 후 진행

---

## Phase 3/4 동시 진행 합의사항 ✅

### 공통 상수 (config.py 맨 아래에 추가)

```python
# ── LLM 모델 설정 ──────────────────────
LLM_MODEL_DEFAULT = "gpt-3.5-turbo"
LLM_MODEL_HEAVY   = "gpt-4o"
LLM_TEMPERATURE   = 0.7
LLM_MAX_TOKENS    = 300               # NPC 응답 최대 토큰 수 (2~4문장 기준)

# ── 대화 기록 ──────────────────────────
MESSAGE_SUMMARY_THRESHOLD = 10        # 이 횟수 초과 시 LLM 요약
MAX_HISTORY_TURNS         = 6         # LLM에 전달할 최근 N턴 (실제 메시지 수 = N×2)

# ── Phase 3: RAG ──────────────────────
CHROMA_PATH      = "./llm/vector_store/db"
STORY_COLLECTION = "story_chunks"
RAG_TOP_K        = 3                  # 루프 3회 고정 → 루프별 문서 누락 방지

# ── Phase 4: 이미지 ───────────────────
IMAGE_COLLECTION = "image_captions"
IMAGE_THRESHOLD  = 0.7

# ── 공통 ──────────────────────────────
EMBEDDING_MODEL = "text-embedding-3-small"
```

### 납품 함수 시그니처

```python
# retriever.py — Phase 3 (엔지니어 A)
def retrieve_story_context(user_input: str, loop: int) -> str:
    # 반환값: 프롬프트에 바로 붙일 수 있는 문자열. 없으면 빈 문자열.
    pass

# image_retriever.py — Phase 4 (엔지니어 B)
def retrieve_image(response_text: str) -> str | None:
    # 반환값: image_url 문자열. 유사도 threshold 미만이면 None.
    pass

def build_image_store(image_dir: str) -> None:
    # 이미지 캡션을 임베딩해서 Chroma DB에 저장하는 1회성 함수.
    pass
```

### config.py 수정 규칙
- 엔지니어 A는 `# ── Phase 3: RAG ──` 섹션에만 추가
- 엔지니어 B는 `# ── Phase 4: 이미지 ──` 섹션에만 추가
- 공통 상수는 `# ── 공통 ──` 섹션에 추가 (둘이 협의 후)

### 더미 데이터
- 위치: `llm/vector_store/data/dummy_responses.py`
- 용도: Phase 4 개발 중 실제 LLM 응답 없이 테스트할 때 사용 (엔지니어 B 전용)

---

## 스토리 매핑 구조 (data-logic 브랜치 완료) ✅

### 핵심 구조
- 유저가 버튼을 선택할 때마다 `button_history`에 **마지막 버튼 ID(int) 1개만** 저장
- 버튼 선택 완료 시 `BUTTON_STORY_MAP[last_button_id]` → `story_id` 확정
- 스토리 중복 제거: `used_stories` 기반으로 마지막 버튼 비활성화 (프론트 disabled 처리)
- 범인 확정: `FLESHY_THRESHOLD = 67` 초과 NPC → 범인

### 버튼 ID 규칙
```
백의 자리 = 선택 화면 번호, 나머지 = 해당 화면의 옵션 순번
Sheet1 선택1 고정: 100 (집에 있는다)
Sheet2 선택1 고정: 101 (출근한다)
선택2: 200번대 / 선택3: 300번대 / 선택4: 400번대
선택5: 500번대 / 선택6: 600번대 / 선택7: 700번대
```

### 스토리/버튼 흐름
```
프론트: 버튼 클릭 → {last_button_id, context(텍스트 목록)} 전송
백엔드: BUTTON_STORY_MAP[last_button_id] → story_id 확정
        STORIES[story_id] → NPC 스탯 챗봇에 전달
        used_stories 기반 → disabled_button_ids 반환
프론트: disabled_button_ids → 해당 버튼 비활성화
LLM:    context → 오늘의 배경으로 시스템 프롬프트에 주입
        NPC 스탯 → 말투/태도 분기에 사용
```

### 완료된 파일 (data-logic 브랜치)
- [x] `stories.py` — `STORIES`(85개) + `BUTTON_STORY_MAP` (`dict[int, str]`) 완성
- [x] `state.py` — `button_history`, `context`, `first_button` 필드 정리, `past_sequences` 제거
- [x] `button_node.py` — `record_button()`, `get_disabled_buttons()`, `get_story()` 수정
- [x] `loop_node.py` — `past_sequences` 제거, `context`/`first_button`/`is_loop_reset` 초기화 추가
- [x] `config.py` — `FLESHY_THRESHOLD = 67` 추가, 주석 수정
- [x] `stories.py` — 주석 수정

---

## 개발 단계별 계획

### Phase 2 — LLM 캐릭터 코어 ✅ 완료

**Phase 2 마무리 작업**
- [x] `cha_seoyeon.py`, `umma.py`, `park_dowon.py` 코드 합치기
- [x] `chat_node.py` stub 함수 3개 → import로 교체
- [x] 프로듀서에게 받은 Few-Shot 샘플 추가 (치키 4개, 김도현 나머지, 차서연/엄마/박도원)
- [x] `config.py` 수치/스토리/버튼 조합 완성 (data-logic 브랜치)
- [x] 사망 트리거 목록

**프로듀서 제공 자료**
- [x] 치키 Few-Shot 샘플 나머지 4개
- [x] 김도현 Few-Shot 샘플 나머지
- [x] 차서연 Few-Shot 샘플
- [x] 엄마 Few-Shot 샘플
- [x] 박도원 Few-Shot 샘플
- [x] 스토리별 버튼 조합
- [x] 스토리별 NPC 수치
- [x] NPC 수치 항목 최종 확정
- [x] 사망 트리거 목록
- [x] NPC별 프로필 이미지

**구현 완료**
- `state.py`, `config.py`, `graph.py`, `runner.py`
- `prompts/base.py`, `prompts/executor.py`, `prompts/kim_dohyun.py`
- `nodes/router.py`, `nodes/loop_node.py`, `nodes/button_node.py`, `nodes/chat_node.py`
- `stories.py`

---

### Phase 3 — RAG 파이프라인 ✅ 완료

**브랜치**: `RAG` → `main` 머지 완료

**프로듀서 제공 자료**
- [x] 캐릭터별 배경 스토리 전문
- [x] 게임 세계관 설정 문서
- [x] 사건 일지 및 단서 목록
- [x] 루프 회차별 공개 가능 정보 범위

**구현 내용**
1. 프로듀서 제공 `.md` 파일을 읽어 Chroma DB에 저장 (청킹 없음, 파일 1개 = 문서 1개)
2. OpenAI 임베딩(`text-embedding-3-small`)으로 벡터 변환
3. Chroma DB 저장 — 루프 회차·공개 레벨 메타데이터 포함
4. 검색 API — 유저 발화 + 루프 회차 필터 → 유사 문서 반환
5. 프롬프트 주입 — 시스템 프롬프트 끝에 RAG 블록 삽입
6. `chat_node.py` 통합 완료 (RAG + 이미지 동시 반영)

**추가된 파일**
```
llm/vector_store/
├── build_store.py          ← 벡터 DB 구축 스크립트 (1회성 실행)
├── retriever.py            ← 유사 문서 검색 함수
├── rag_inject.py           ← RAG 결과를 시스템 프롬프트에 주입하는 접착제
└── data/
    ├── characters/         ← 캐릭터 배경 문서 (프로듀서 제공, .md)
    │   ├── 김도현.md / 김도현_loop2.md
    │   ├── 박도원.md / 박도원_loop2.md / 박도원_loop3.md
    │   ├── 엄마.md / 엄마_loop2.md / 엄마_loop3.md
    │   ├── 차서연.md / 차서연_loop2.md
    │   └── 치키.md / 치키_loop2.md / 치키_loop3.md
    ├── world/              ← 세계관 설정 문서 (프로듀서 제공, .md)
    │   ├── 세계관.md
    │   ├── loop1.md / loop2.md / loop3.md
    └── clues/              ← 루트별/기본 단서 문서
        ├── 기본단서1_녹음테이프.md
        ├── 기본단서2_가족사진.md
        ├── 기본단서3_약병과 처방 기록.md
        ├── AB단서0_김도현상담일지_route101.md
        ├── AB단서1_USB_route101_loop2.md
        ├── AB단서2_발신자표시제한전화_route101_loop2.md
        └── AB단서3_택배상자_속_일기장_route101.md
```

**파일 네이밍 규칙 (프로듀서 전달 사항)**
```
data/characters/{캐릭터명}.md          → 전 루프 공개
data/characters/{캐릭터명}_loop{N}.md  → 루프 N 이상에서만 검색 노출
data/world/{파일명}.md                 → 전 루프 공개 세계관 문서
data/world/{파일명}_loop{N}.md         → 루프 N 이상에서만 검색 노출
```

**완료 작업**
- [x] `config.py` Phase 3 섹션 상수 추가 (`CHROMA_PATH` 절대경로로 수정)
- [x] `build_store.py` 작성 및 테스트 통과
- [x] `retriever.py` 작성 및 테스트 통과
- [x] `rag_inject.py` 작성 및 테스트 통과
- [x] `chat_node.py` RAG 연동 (`get_enriched_system_prompt()` 주입)
- [x] `chat_node.py` 이미지 연동 (`retrieve_image()` + 반환값 3개로 변경)
- [x] `chat_node.py` 버그 수정 (`TOTAL_LOOPS` import 경로, 반환 타입 어노테이션)
- [x] 실제 `.md` 파일 → `data/characters/`, `data/world/`, `data/clues/`에 추가
- [x] `python -m vector_store.build_store --reset` 으로 DB 재구축
- [x] 루프별 문서 공개 범위 확인 후 파일명 `_loop{N}` 적용

**토큰 최적화**
- [x] `config.py` — `LLM_MAX_TOKENS = 300`, `MAX_HISTORY_TURNS = 6` 추가
- [x] `chat_node.py` — 슬라이딩 윈도우: `messages[-MAX_HISTORY_TURNS*2:]` 적용
- [x] `chat_node.py` — RAG 컨텍스트 캐시(`_rag_cache`) 추가
- [x] `chat_node.py` — `ChatOpenAI(max_tokens=LLM_MAX_TOKENS)` 적용

| 최적화 항목 | 예상 절감 |
|---|---|
| 슬라이딩 윈도우 (6턴 고정) | ~300 tok/호출 |
| `max_tokens=300` | ~100~500 tok/호출 |
| RAG 캐시 히트 시 | 임베딩 API 1회 절감 |

**chat_node.py 수정 내용 (완료)**
```python
# generate_npc_response() — RAG 주입
system_prompt = get_enriched_system_prompt(
    system_prompt = system_prompt,
    user_input    = user_input,
    loop          = state["loop_count"],
    character     = npc_name,
)

# chat_node() — 이미지 검색 + 반환값 변경
image_url = retrieve_image(response)
return GameState(**updated_state), response, image_url
```

---

### Phase 4 — 이미지 유사도 검색 ✅ 완료

**브랜치**: `image`

**프로듀서 제공 자료**
- [x] 게임에서 사용할 이미지 파일 전체
- [x] 각 이미지가 어떤 상황/장면에서 쓰이는지 설명 (image_captions.json으로 내부 작성)

**구현 내용**
1. 이미지 DB 구성 — 이미지별 캡션(설명 텍스트) 작성 → `image_captions.json`
2. 캡션 임베딩 생성 후 Chroma DB 저장
3. LLM 응답 문장 임베딩 생성
4. 코사인 유사도 계산 → Top-1 이미지 선택 API

**추가된 파일**
```
llm/vector_store/
├── image_retriever.py          ← 이미지 유사도 검색 함수
├── test_image_retriever.py     ← 단위 테스트
└── data/
    ├── image_captions.json     ← 이미지 캡션 데이터
    ├── dummy_responses.py      ← 단위 테스트용 더미 LLM 응답 샘플
    └── images/                 ← NPC 표정 이미지 (NPC별 폴더)
        ├── 김도현/             ← 8종 (눈물, 웃음, 비꼬는 표정, 짜증 등)
        ├── 박도원/             ← 8종 (낙담, 당혹, 짜증, 어이없음 등)
        ├── 엄마/               ← 8종 (당혹, 짜증, 억지웃음, 진짜웃음 등)
        └── 차서연/             ← 7종 (공감, 당혹, 정색+짜증 등)
```

**완료 작업**
- [x] `config.py` Phase 4 섹션 상수 추가
- [x] `image_retriever.py` 작성 (build_image_store, retrieve_image)
- [x] `image_captions.json` 실제 데이터로 작성
- [x] `dummy_responses.py` 작성
- [x] `test_image_retriever.py` 작성 및 테스트 통과
- [x] 실제 이미지 파일 → `data/images/` NPC별 폴더에 추가
- [x] DB 재구축 후 테스트 전체 통과 확인

---

### Phase 5 — 채팅 인터페이스 ✅ 완료

**브랜치**: `buttonroom`, `chatroom`, `opening` → `main` 머지 완료

**프로듀서 제공 자료**
- [x] 채팅 UI 디자인 시안 (자체 디자인으로 구현)
- [x] 사망 연출 화면 디자인 (자체 구현)
- [x] NPC별 프로필 이미지 (4종 완료)

**구현 완료 작업**

**오프닝 화면** (`opening.html` + `js/opening.js` + `css/opening.css`)
- [x] Phase 0: 이름/성별 입력 폼 + `/new-game` 백엔드 연동 → `sessionStorage`에 session_id 저장
- [x] Phase 1-A: 오프닝 영상 재생 (`opening_vd.mp4`) + SKIP 버튼
- [x] Phase 1-B: 핏빛 타이머 시퀀스 연출
- [x] Phase 2: 방(room_img.png) Reveal 화면
- [x] Phase 3: 치키 등장 + 대사 순차 출력 + 플레이어 정보 박스 → `buttonroom.html` 전환

**버튼 선택 화면** (`buttonroom.html` + `js/button.js` + `css/buttonroom.css`)
- [x] 전체 7단계 버튼 트리 구현 (`scenes.json` 기반 장소/대사 출력)
- [x] 버튼 disabled 처리 (백엔드 `/available-buttons` 연동)
- [x] 백엔드 API 연동 (`/record-button`, `/finalize`, `/available-buttons`)
- [x] 오프라인 모드 지원 (백엔드 미연결 시 프론트 단독 실행)

**채팅 화면** (`chatroom.html` + `js/chat.js` + `css/chatroom.css`)
- [x] 유저 / NPC 말풍선 구분
- [x] 텍스트 입력창 + 전송 버튼
- [x] 타이머 표시 (47분 12초 카운트다운)
- [x] NPC 전환 UI (김도현 / 차서연 / 엄마 / 박도원)
- [x] 사망 연출 화면 (Loop Reset 문구 + 붉은 효과)
- [x] 게임 오버 오버레이 (`#game-over-overlay`) — 루프 소진 시 표시
- [x] 치키 트리거 시스템 (CHIKI_TRIGGERS 5종) + 드로어
- [x] 단서 수집 탭 (clue 패널, 중복 방지 포함)
- [x] 채팅 백엔드 API 연동 (`/chat`, `/player-dead`, `/new-loop`)
- [x] 이미지 렌더링 (백엔드 `image_url` 수신 후 말풍선 표시)
- [x] `/chiki-triggers`, `/clue-triggers` 백엔드 연동 (루프별 트리거 동적 로드)
- [x] → `suspect.html` 전환 (타이머 종료 또는 치키 범인 선택 시)

**용의자 선택 화면** (`suspect.html` + `js/suspect.js` + `css/suspect.css`)
- [x] Scene 1: 치키 등장 + 4명 용의자 선택 그리드 (김도현/차서연/박도원/엄마)
- [x] Scene 2: 치키 확인 멘트 (정답/오답 분기)
- [x] Scene 3: 밤 이미지 연출
- [x] Scene 4: 사망 이미지 연출 (NPC별 이미지 매핑 — VILLAIN_MAP)
- [x] Scene 5: 다음 루프 아침 (탭하면 `opening.html`로 이동)
- [x] Scene 6: 엔딩 (루프 3 소진 시)
- [x] `/new-loop` 백엔드 연동 → `is_game_over` 처리

**추가된 파일**
```
frontend/
├── opening.html           ← 게임 시작 + 치키 등장 오프닝 (4단계 흐름)
├── buttonroom.html        ← 버튼 선택 화면 (7단계)
├── chatroom.html          ← 채팅 화면
├── suspect.html           ← 범인 선택 + 결과 연출 화면 (6씬)
├── css/
│   ├── opening.css
│   ├── buttonroom.css
│   ├── chatroom.css
│   └── suspect.css
├── js/
│   ├── opening.js         ← 오프닝 흐름 + new-game 연동
│   ├── button.js          ← 버튼 트리 탐색 + 백엔드 연동
│   ├── chat.js            ← NPC 전환 / 타이머 / 치키 트리거 / 사망 연출 / 백엔드 연동
│   └── suspect.js         ← 범인 선택 + 씬 전환 + 루프 처리
├── data/
│   └── scenes.json        ← 버튼 선택 화면 씬/장소/대사 데이터
└── images/
    ├── opening_vd.mp4     ← 오프닝 영상
    ├── room_img.png       ← 방 배경 이미지
    ├── chiki_img.png      ← 치키 캐릭터 이미지
    ├── chiki.png
    ├── kim_profile.png    ← 김도현 프로필
    ├── cha_profile.png    ← 차서연 프로필
    ├── park_profile.png   ← 박도원 프로필
    ├── umma_profile.png   ← 엄마 프로필
    ├── 사망_루프.png
    ├── 사망_방.png
    ├── 사망_추락사.png
    ├── 사망_피 토 하는 사람.png
    └── 사망2_칼.png
```

---

### Phase 6 — 백엔드 API 서버 ✅ 완료

**프로듀서 제공 자료**
- 없음 (엔지니어 자체 설계)

**디렉토리 구조**
```
backend/
├── main.py               ← FastAPI 앱 진입점 + CORS + 정적 파일 서빙
├── api/
│   ├── __init__.py
│   ├── game.py           ← 게임 흐름 엔드포인트
│   ├── chat.py           ← 채팅 엔드포인트
│   └── triggers.py       ← 치키/단서 트리거 엔드포인트
├── models/
│   ├── __init__.py
│   └── schemas.py        ← 요청/응답 데이터 모델 (Pydantic)
├── session/
│   ├── __init__.py
│   └── manager.py        ← 유저별 GameState 인메모리 관리
└── tests/
    └── test_api.py       ← pytest 구조 테스트 (LLM 미호출, 16개 케이스)
```

**주요 엔드포인트**
```
POST /new-game              ← 게임 시작 (player_name, player_gender) → session_id 반환
GET  /available-buttons     ← 비활성화할 버튼 ID 목록 반환
POST /record-button         ← 버튼 클릭 시마다 호출 (마지막 ID 기록)
POST /finalize              ← 마지막 버튼 ID + context → story_id 확정, NPC 스탯 반환
POST /chat                  ← NPC와 대화 → response, image_url, is_dead, is_loop_reset 반환
POST /player-dead           ← 타이머 만료 사망 처리 → 루프 리셋
POST /new-loop              ← 루프 리셋 → loop_count, is_game_over 반환
GET  /chiki-triggers        ← 루프별 치키 트리거 목록 반환 (?loop=1~3)
GET  /clue-triggers         ← 루프별 단서 트리거 목록 반환 (?loop=1~3)
GET  /health                ← 서버 상태 확인
GET  /                      ← opening.html 반환 (루트 접속)
```

**정적 파일 서빙**
- `/frontend/**` → `frontend/` 폴더 전체 (HTML, CSS, JS, 이미지, 영상)
- `/static/images/**` → `llm/vector_store/data/images/` (NPC 표정 이미지)
- 루트 `/` → `frontend/opening.html`

**구현 완료 작업**
- [x] `schemas.py` — 요청/응답 Pydantic 모델 전체 정의
- [x] `session/manager.py` — `create_initial_state()` 기반 세션 생성/조회/갱신/삭제
- [x] `api/game.py` — 게임 흐름 6개 엔드포인트 구현
- [x] `api/chat.py` — `/chat` 엔드포인트 구현
- [x] `api/triggers.py` — `/chiki-triggers`, `/clue-triggers` 엔드포인트 구현
- [x] `main.py` — 라우터 등록, CORS 설정, 정적 파일 마운트, 전역 예외 핸들러
- [x] 버그 수정
  - `sys.path`를 `../../` → `../../llm`, `../../llm/nodes` 로 수정 (모듈 import 오류 해결)
  - `loop_node` → `loop_reset_node` 함수명 수정
  - `allow_credentials=True` + `allow_origins=["*"]` 조합 → `allow_credentials=False` 수정 (CORS 브라우저 거부 방지)

**llm/frontend/backend 역할 분담 요약**

| 항목 | LLM | Frontend | Backend |
|---|---|---|---|
| 버튼 텍스트 정의 | ❌ | ✅ | ❌ |
| 버튼 ID 누적 | ❌ | ✅ | ❌ |
| context 조합 | ❌ | ✅ | ❌ |
| 비활성화 버튼 계산 | ❌ | ❌ | ✅ `get_disabled_buttons()` |
| story_id 확정 | ❌ | ❌ | ✅ `BUTTON_STORY_MAP` |
| NPC 스탯 반환 | ❌ | ❌ | ✅ `STORIES` |
| 범인 확정 | ❌ | ❌ | ✅ Fleshy 임계값(67) |
| 세션 관리 | ❌ | ❌ | ✅ |
| context 프롬프트 주입 | ✅ | ❌ | ❌ |
| NPC 스탯 프롬프트 주입 | ✅ | ❌ | ❌ |
| LLM 호출 + 응답 생성 | ✅ | ❌ | ❌ |
| RAG 주입 | ✅ | ❌ | ❌ |
| 이미지 검색 | ✅ | ❌ | ❌ |
| 치키/단서 트리거 데이터 | ❌ | ❌ | ✅ `triggers.json` |

**백엔드 서버 실행 방법**
```bash
# 패키지 설치 (최초 1회)
pip install fastapi uvicorn python-dotenv httpx pytest

# 프로젝트 루트에서 실행
uvicorn backend.main:app --reload --port 8000

# 브라우저 접속 (자동으로 opening.html 반환)
http://localhost:8000/

# Swagger UI (엔드포인트 전체 확인)
http://localhost:8000/docs
```

---

### Phase 6 — 테스트 ✅ 완료

**테스트 파일 위치**
```
backend/tests/test_api.py
```

**테스트 구성 (총 16개 케이스, LLM 실제 호출 없음)**

| 테스트 클래스 | 케이스 수 | 검증 항목 |
|---|---|---|
| `TestNewGame` | 1 | `session_id` 반환 여부 |
| `TestAvailableButtons` | 2 | 첫 게임 빈 리스트 반환 + 404 |
| `TestRecordButton` | 2 | 200 응답 + 404 |
| `TestFinalize` | 4 | `story_id` / `npc_stats` / `disabled_button_ids` 필드 존재, 버튼 비활성화 동작 + 404 |
| `TestNewLoop` | 3 | `loop_count=2`, `is_game_over=False` + 404 |
| `TestInvalidSession` | 4 | 전 엔드포인트 잘못된 session_id → 404 |

**테스트 실행 방법**
```bash
# backend/ 폴더 안에서 실행
cd backend
pytest tests/test_api.py -v

# 특정 클래스만 실행
pytest tests/test_api.py::TestFinalize -v

# 특정 케이스만 실행
pytest tests/test_api.py::TestNewLoop::test_loop_count_increments -v
```

**테스트 설계 포인트**
- `chat_node`를 `sys.modules` 선주입으로 mock 처리 → LLM 호출 없이 구조만 검증
- `session_id` fixture는 `scope=function` → 테스트마다 독립적인 세션 사용
- `finalized_session` fixture → `record-button` + `finalize` 완료 상태에서 시작하는 테스트에 사용

**방법 2 구조 테스트 결과 (curl 기반, 완료)**

| 엔드포인트 | 결과 | 응답 |
|---|---|---|
| `POST /new-game` | ✅ | `{"session_id": "..."}` |
| `GET /available-buttons` | ✅ | `{"disabled_button_ids": []}` |
| `POST /record-button` | ✅ | `{"ok": true}` |
| `POST /finalize` | ✅ | `story_id`, `npc_stats`, `disabled_button_ids: [600]` |
| `POST /chat` | ✅ | `{"response":"테스트 응답","image_url":null,"is_dead":false,"is_loop_reset":false}` |
| `POST /new-loop` | ✅ | `{"loop_count": 2, "is_game_over": false}` |

---

### Phase 7 — 통합 연동 테스트 ✅ 완료

**테스트 구성 (토큰 절약 원칙: `/chat` 실호출 1회)**

| 단계 | 내용 | 결과 |
|---|---|---|
| 구조 테스트 | `pytest tests/test_api.py -v` (LLM 미호출, 16 케이스) | 16/16 통과 |
| 실흐름 테스트 | `test_integration.sh` — `/new-game` → 버튼 6회 → `/finalize` → `/chat` 1회 | 전 단계 성공 |

**실흐름 테스트 결과**
```
상태         : 성공
/chat 응답   : 안녕하십니까. 상담을 원하시나요?   ← 김도현 실제 LLM 응답
is_dead      : False
is_loop_reset: False
```

**테스트 실행 방법**
```bash
# 1. 구조 테스트 (서버 불필요, LLM 미호출)
cd backend && pytest tests/test_api.py -v

# 2. 실흐름 통합 테스트 (서버 실행 중일 때)
bash test_integration.sh
```

**추가된 파일**
```
test_integration.sh     ← 실흐름 curl 스크립트 (서버 실행 중일 때 사용)
```

---

### Phase 8 — 배포 ✅ 완료

**배포 환경**: Render.com (Docker 기반)

**배포 URL**: `https://hateslop4-dead24.onrender.com`

**구현 내용**
```
requirements.txt    ← 패키지 목록
.env.example        ← 환경변수 예시 (OPENAI_API_KEY 등)
Dockerfile          ← 컨테이너 빌드 설정
render.yaml         ← Render.com 서비스 배포 설정
```

**render.yaml 설정**
```yaml
services:
  - type: web
    name: hateslop4-dead24
    runtime: docker
    dockerfilePath: ./Dockerfile
    branch: main
    envVars:
      - key: OPENAI_API_KEY   # Render 대시보드에서 직접 입력
      - key: PYTHONPATH
        value: /app/llm:/app/llm/nodes
```

**주요 패키지**
```
langchain
langchain-openai
langgraph
fastapi
uvicorn
python-dotenv
chromadb
openai
httpx
pytest
```

---

## 프로듀서 제공 자료 전체 체크리스트

### Phase 2 관련
- [x] 치키 Few-Shot 샘플 나머지 4개
- [x] 김도현 Few-Shot 샘플 나머지
- [x] 차서연 Few-Shot 샘플
- [x] 엄마 Few-Shot 샘플
- [x] 박도원 Few-Shot 샘플
- [x] 스토리별 버튼 조합
- [x] 스토리별 NPC 수치
- [x] NPC 수치 항목 최종 확정
- [x] 사망 트리거 목록
- [x] NPC별 프로필 이미지 (4종 완료)

### Phase 3 관련
- [x] 캐릭터별 배경 스토리 전문
- [x] 게임 세계관 설정 문서
- [x] 사건 일지 및 단서 목록
- [x] 루프 회차별 공개 가능 정보 범위

### Phase 4 관련
- [x] 게임 사용 이미지 파일 전체 (NPC 표정 이미지 4종 × 평균 8장)
- [x] 이미지별 사용 상황/장면 설명 (image_captions.json으로 내부 작성)

### Phase 5 관련
- [x] 채팅 UI 디자인 시안 (자체 디자인으로 구현)
- [x] 사망 연출 화면 디자인 (자체 구현)
- [x] NPC별 프로필 이미지 (4종 완료)
