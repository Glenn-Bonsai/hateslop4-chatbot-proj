# 함수 1
def retrieve_image(response_text: str) -> str | None:
    # LLM 응답 텍스트를 입력받아
    # 이미지 캡션 DB에서 코사인 유사도 검색
    # Top-1 image_url 반환, 유사도 IMAGE_THRESHOLD 미만이면 None 반환
    pass

# 함수 2
def build_image_store(image_dir: str) -> None:
    # image_dir 안의 이미지 캡션을 읽어서
    # 임베딩 후 Chroma DB에 저장하는 1회성 함수
    pass