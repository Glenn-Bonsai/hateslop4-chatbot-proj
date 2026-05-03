# llm/vector_store/test_image_retriever.py
#
# [역할]
# image_retriever.py의 retrieve_image() 단위 테스트.
# 실제 Chroma DB와 OpenAI 임베딩을 사용하므로,
# 반드시 build_image_store()를 먼저 실행한 뒤 테스트할 것.

import pytest
from llm.vector_store.image_retriever import retrieve_image
from llm.vector_store.data.dummy_responses import DUMMY_RESPONSES


class TestRetrieveImage:

    def test_returns_string_for_matching_response(self):
        """유사한 캡션이 있을 때 image_url 문자열을 반환한다."""
        result = retrieve_image(DUMMY_RESPONSES[0])  # 박도원 - 유리 조각
        assert result is not None
        assert isinstance(result, str)
        assert result.endswith(".png")

    def test_returns_none_for_unrelated_response(self):
        """캡션과 전혀 관련 없는 텍스트 입력 시 None을 반환한다."""
        result = retrieve_image("오늘 날씨가 맑고 기온은 25도입니다.")
        assert result is None

    def test_returns_none_for_empty_string(self):
        """빈 문자열 입력 시 None을 반환한다."""
        result = retrieve_image("")
        assert result is None

    def test_all_dummy_responses_return_string_or_none(self):
        """모든 더미 샘플에 대해 str 또는 None만 반환한다."""
        for response in DUMMY_RESPONSES:
            result = retrieve_image(response)
            assert result is None or isinstance(result, str)

    def test_character_specific_response(self):
        """캐릭터별 대표 응답이 해당 캐릭터 이미지와 매칭되는지 확인한다."""
        cases = [
            (DUMMY_RESPONSES[0], "park_dowon"),   # 박도원
            (DUMMY_RESPONSES[3], "chiki"),         # 치키
            (DUMMY_RESPONSES[6], "kim_dohyun"),    # 김도현
            (DUMMY_RESPONSES[9], "cha_seoyeon"),   # 차서연
            (DUMMY_RESPONSES[12], "umma"),         # 엄마
        ]
        for response, expected_keyword in cases:
            result = retrieve_image(response)
            if result is not None:
                assert expected_keyword in result, (
                    f"'{response[:20]}...' → '{result}'에 '{expected_keyword}' 포함되지 않음"
                )