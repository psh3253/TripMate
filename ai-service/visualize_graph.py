"""
LangGraph 시각화 스크립트

실행: python visualize_graph.py
"""
import sys
sys.path.insert(0, '.')

from app.agents.multi_agent_planner import MultiAgentTravelPlanner
from app.config import settings


def main():
    if not settings.OPENAI_API_KEY:
        print("Error: OPENAI_API_KEY not set in .env")
        return

    # 플래너 인스턴스 생성
    print("Creating MultiAgentTravelPlanner...")
    planner = MultiAgentTravelPlanner(openai_api_key=settings.OPENAI_API_KEY)

    # 그래프 가져오기
    graph = planner.graph

    print("=" * 60)
    print("LangGraph 멀티 에이전트 여행 플래너 구조")
    print("=" * 60)

    # 1. Mermaid 다이어그램 출력
    print("\n[Mermaid 다이어그램]")
    print("아래 코드를 https://mermaid.live 에 붙여넣으세요:\n")
    try:
        mermaid = graph.get_graph().draw_mermaid()
        print(mermaid)
    except Exception as e:
        print(f"Mermaid 생성 실패: {e}")

    # 2. ASCII 다이어그램
    print("\n" + "=" * 60)
    print("[ASCII 다이어그램]")
    print("=" * 60 + "\n")
    try:
        ascii_graph = graph.get_graph().draw_ascii()
        print(ascii_graph)
    except Exception as e:
        print(f"ASCII 생성 실패: {e}")

    # 3. PNG 저장 시도
    print("\n" + "=" * 60)
    print("[PNG 이미지 저장]")
    print("=" * 60)
    try:
        png_data = graph.get_graph().draw_mermaid_png()
        with open("graph_visualization.png", "wb") as f:
            f.write(png_data)
        print("✅ graph_visualization.png 파일로 저장됨")
    except Exception as e:
        print(f"PNG 저장 실패 (정상): {e}")
        print("💡 PNG 생성을 위해서는 playwright 설치 필요:")
        print("   pip install playwright")
        print("   playwright install chromium")


if __name__ == "__main__":
    main()
