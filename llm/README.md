# 🤖 LLM

> 죽기 24시간 전에 — GPT 프롬프트 · RAG 파이프라인 · 이미지 유사도 검색

---

## 📁 폴더 구조

```
LLM/
├── prompts/
│   ├── system_executor.txt         # 시스템 집행자 System Prompt
│   ├── system_protagonist_m.txt    # 주인공 System Prompt (남)
│   ├── system_protagonist_f.txt    # 주인공 System Prompt (여)
│   ├── npc_kim_dohyun.txt          # 김도현 System Prompt
│   ├── npc_cha_seoyeon.txt         # 차서연 System Prompt
│   ├── npc_mom.txt                 # 엄마 System Prompt
│   └── npc_lee_jiwoo.txt           # 이지우 System Prompt
├── few_shots/
│   ├── kim_dohyun_examples.json    # 김도현 모범 대화 3~5쌍
│   ├── cha_seoyeon_examples.json   # 차서연 모범 대화 3~5쌍
│   ├── mom_examples.json           # 엄마 모범 대화 3~5쌍
│   └── lee_jiwoo_examples.json     # 이지우 모범 대화 3~5쌍
├── rag/
│   ├── chunking.py                 # 스토리 문서 청킹 스크립트
│   ├── embedding.py                # 청크 임베딩 생성 및 ChromaDB 저장
│   └── retrieval.py                # 유저 발화 → 유사 청크 검색
├── image/
│   ├── caption_embedding.py        # 이미지 캡션 임베딩 생성 및 저장
│   └── image_search.py             # LLM 응답 → 코사인 유사도 → Top-1 이미지 선택
├── jailbreak_guard.py              # Jailbreak 방어 로직 (가스라이팅 방어 규칙)
└── token_manager.py                # 토큰 사용량 관리 · 대화 요약 로직
```

---

## 🎮 이 폴더에서 할 작업

### 1. System Prompt 설계
- **시스템 집행자** : 유저를 조롱하고 진실에 접근할 때 경고하는 역할의 프롬프트
- **주인공** : 남/여 선택에 따라 분기되는 프롬프트 (유저가 범인임을 절대 발설 금지 규칙 포함)
- **주변 인물 4명** : 각 캐릭터 성격 · 비밀 · 말투를 반영한 개별 프롬프트
- 루프 회차 · 보유 단서를 프롬프트에 **동적으로 주입**하는 구조 구현

> ‼️ 프로듀서에게 캐릭터 배경 스토리 + 대화 샘플을 받은 후 작업

### 2. Few-shot 예시 작성
- 캐릭터별 모범 대화 3~5쌍 JSON으로 정리
- GPT 호출 시 messages 배열에 자동 삽입되는 구조로 구현

### 3. Jailbreak 방어 로직
- 유저가 "너 살인마지?" 등 직접적인 진실 유도 발화 시 집행자가 회피 응답
- System Prompt에 가스라이팅 방어 규칙을 강하게 명시
- 방어 실패 케이스 테스트 및 프롬프트 재튜닝

### 4. RAG 파이프라인 구현
- 스토리 문서를 캐릭터별 배경 · 사건 일지 · 단서로 **청킹**
- `text-embedding-ada-002`로 임베딩 생성 후 **ChromaDB 저장**
  - 메타데이터: 루프 회차, 공개 레벨 포함
- 유저 발화 임베딩 → ChromaDB 검색 → 유사 청크를 프롬프트에 주입

> ‼️ 프로듀서에게 스토리 문서를 받아야 청킹 작업 가능

### 5. 이미지 유사도 검색
- 프로듀서 제공 이미지에 캡션(설명 텍스트) 작성
  - GPT-4o 멀티모달 기능으로 자동 캡션 생성 스크립트 활용 가능
- 캡션 임베딩 생성 후 ChromaDB 저장
- LLM 응답 문장 임베딩 생성 → 코사인 유사도 계산 → Top-1 이미지 선택
- 선택된 이미지 URL을 백엔드로 반환

> ‼️ 이미지 자료는 프로듀서에게 수령 후 작업

### 6. 토큰 관리
- 개발 단계: `gpt-3.5-turbo` 사용
- 배포/시연 단계: `gpt-4o` 전환
- 대화 10턴 초과 시 이전 대화를 요약하여 토큰 절약하는 **메모리 요약 로직** 구현

---

## ▶️ 실행 방법

```bash
# 청킹 및 ChromaDB 저장 (최초 1회 실행)
python rag/chunking.py
python rag/embedding.py

# 이미지 캡션 임베딩 저장 (이미지 자료 수령 후)
python image/caption_embedding.py
```

> ⚠️ 위 스크립트 실행 전 `.env`에 `OPENAI_API_KEY`가 설정되어 있어야 합니다.

---

## 🔐 환경변수 (.env)

```
OPENAI_API_KEY=xx-xxxxx
```

---

## 📌 개발 단계별 GPT 모델

| 단계 | 모델 | 비고 |
|------|------|------|
| 개발 · 테스트 | `gpt-3.5-turbo` | 토큰 비용 절약 |
| 시연 · 배포 | `gpt-4o` | 최종 품질 |
| 임베딩 | `text-embedding-ada-002` | 전 단계 공통 |
