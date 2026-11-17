"""Ciao, AI! — Streamlit 래퍼

본 앱은 Next.js로 만들어져 Streamlit 서버에서 직접 실행되지 않습니다.
Vercel 등에 배포한 Ciao, AI! 주소를 이 화면 안에 띄워 줍니다.

배포 주소 설정 (둘 중 하나):
  1) Streamlit Cloud → 앱 Settings → Secrets 에  APP_URL = "https://<배포주소>.vercel.app/rome"
  2) 아래 DEFAULT_APP_URL 값을 직접 수정
"""

import os

import streamlit as st
import streamlit.components.v1 as components

DEFAULT_APP_URL = ""  # 예: "https://ciao-ai.vercel.app/rome"


def get_app_url() -> str:
    try:
        url = st.secrets.get("APP_URL", "")
    except Exception:  # secrets.toml 이 없을 때
        url = ""
    return (url or os.environ.get("APP_URL", "") or DEFAULT_APP_URL).strip()


st.set_page_config(page_title="Ciao, AI! — 로마 여행 플래너", page_icon="🇮🇹", layout="wide")

app_url = get_app_url()

if not app_url:
    st.title("Ciao, AI!")
    st.warning("아직 앱 주소가 설정되지 않았습니다.")
    st.markdown(
        """
1. Next.js 앱을 먼저 **Vercel**에 배포합니다.
2. 배포 주소를 Streamlit **Settings → Secrets** 에 다음처럼 입력합니다.

```toml
APP_URL = "https://<배포주소>.vercel.app/rome"
```
"""
    )
    st.stop()

st.markdown(
    f"**Ciao, AI!** · 휴대폰에서는 [새 창에서 열기]({app_url})가 더 편합니다. "
    "저장한 장소·일정은 이 브라우저에 저장됩니다."
)
components.iframe(app_url, height=900, scrolling=True)
