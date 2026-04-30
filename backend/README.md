# ⚙️ Backend

> 죽기 24시간 전에 — FastAPI 서버

---

## 📁 폴더 구조

```
Backend/
├── main.py                 # FastAPI 진입점, 라우터 등록
├── requirements.txt        # 패키지 목록
├── .env                    # 환경변수 (API 키 등, Git 제외)
├── routers/
│   ├── chat.py             # 채팅 엔드포인트 (/chat)
│   ├── image.py            # 이미지 유사도 검색 엔드포인트 (/image)
│   ├── recommend.py        # 추천 메시지 엔드포인트 (/recommend)
│   └── loop.py             # 루프 리셋 이벤트 엔드포인트 (/loop/reset)
├── services/
│   ├── llm_service.py      # LLM 폴더와 연동 — GPT 호출 로직
│   ├── rag_service.py      # RAG 파이프라인 연동 — ChromaDB 검색
│   └── image_service.py    # 이미지 유사도 계산 로직
├── models/
│   └── schemas.py          # 요청/응답 데이터 구조 정의 (Pydantic)
└── state/
    └── game_state.json     # 루프 회차 · 보유 단서 · 유저 상태 저장
```

---

## 🎮 이 폴더에서 할 작업

### 1. FastAPI 서버 기초 세팅
- 라우터 구조 설계 및 엔드포인트 등록
- CORS 설정 (프론트엔드 `localhost:3000` 허용)

### 2. 게임 상태 관리 (JSON)
- 루프 회차, 보유 단서 목록, 선택 캐릭터(남/여), 현재 대화 상대를 `game_state.json`에 저장
- 대화 10턴 초과 시 이전 대화 요약 후 저장하는 **메모리 요약 로직** 구현

### 3. LLM 연동
- `llm_service.py`에서 LLM 폴더의 프롬프트 + GPT API 호출
- 루프 회차 · 보유 단서를 프롬프트에 동적 주입
- `is_critical` 플래그 판단 후 프론트에 함께 반환

### 4. 루프 종료 조건 판단 로직
- GPT 응답에서 "이번 루프 끝" 시점 감지
- 키워드 감지 방식 또는 GPT 판단 방식 중 선택하여 구현

### 5. 단서 감지 로직
- GPT 응답에 새 단서 포함 여부 판단 (별도 프롬프트 or 파싱 로직)
- 새 단서 감지 시 `game_state.json` 및 ChromaDB에 저장

### 6. 최종 반전 연출 트리거
- 거울 장면 발동 조건 정의 및 프론트에 신호 전달
- 고정 스크립트 or GPT 생성 텍스트 반환 (LLM 팀과 협의)

### 7. 에러 핸들링
- GPT 응답 지연 / API 오류 시 유저에게 보여줄 fallback 메시지 처리
- 시연 중 터질 경우를 대비한 예외 처리 필수

---

## ▶️ 실행 방법

```bash
# 1. 패키지 설치
pip install -r requirements.txt

# 2. 환경변수 설정 확인 (.env 파일)
# OPENAI_API_KEY=xx-xxxxx

# 3. 서버 실행
uvicorn main:app --reload
```

서버 실행 후 `http://localhost:8000/docs` 에서 API 문서 자동 확인 가능 (Swagger UI)

---

## 🔗 API 명세

| 메서드 | 엔드포인트 | 요청 | 응답 |
|--------|-----------|------|------|
| `POST` | `/chat` | `{character_id, user_message, loop_count}` | `{response, is_critical}` |
| `GET` | `/recommend` | `{character_id, loop_count}` | `{messages: [str, str, str]}` |
| `GET` | `/image` | `{llm_response}` | `{image_url}` |
| `POST` | `/loop/reset` | `{loop_count}` | `{status, next_loop}` |

---

## 🔐 환경변수 (.env)

```
OPENAI_API_KEY=xx-xxxxx
CHROMA_DB_PATH=./chroma_db
```

> ⚠️ `.env` 파일은 절대 Git에 커밋하지 마세요. `.gitignore`에 반드시 추가하세요.
