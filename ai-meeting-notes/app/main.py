import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import streamlit as st
from app.config.settings import settings
from app.database import init_db
from app.demo_data import seed_demo_data
from app.ui import (
    inject_custom_css,
    render_dashboard,
    render_upload,
    render_meeting_details,
    render_history,
    render_action_items_board,
    render_settings,
)


def main():
    # Set Streamlit Page Configuration
    st.set_page_config(
        page_title="AI Meeting Notes Summarizer",
        page_icon="🎙️",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    # Inject polished modern custom styling
    inject_custom_css()

    # Initialize Database and seed demo data on first load
    if "db_initialized" not in st.session_state:
        init_db()
        seed_demo_data(force=False)
        st.session_state["db_initialized"] = True

    # Sidebar Navigation
    with st.sidebar:
        st.markdown("""
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
            <span style="font-size:28px;">🎙️</span>
            <div>
                <h3 style="margin:0; font-size:18px; font-weight:700; color:#60A5FA;">NotePulse AI</h3>
                <p style="margin:0; font-size:11px; color:#9CA3AF;">Meeting Intelligence Platform</p>
            </div>
        </div>
        """, unsafe_allow_html=True)

        if "nav_selection" not in st.session_state:
            st.session_state["nav_selection"] = "Dashboard"

        nav_options = [
            "Dashboard",
            "Upload & Summarize",
            "Meeting Notes",
            "Action Items",
            "History",
            "Settings",
        ]

        current_index = nav_options.index(st.session_state["nav_selection"]) if st.session_state["nav_selection"] in nav_options else 0

        selection = st.radio(
            "Navigation",
            options=nav_options,
            index=current_index,
            label_visibility="collapsed",
        )
        st.session_state["nav_selection"] = selection

        st.markdown("---")

        # Sidebar Status Indicators
        st.markdown("<p style='font-size:11px; font-weight:600; color:#6B7280; text-transform:uppercase;'>System Status</p>", unsafe_allow_html=True)
        if settings.is_gemini_ready:
            st.markdown("🟢 **AI Provider:** Gemini Live")
        else:
            st.markdown("🟡 **AI Provider:** Mock Mode")

        if settings.is_whisper_ready:
            st.markdown("🟢 **Transcription:** Whisper Live")
        else:
            st.markdown("⚪ **Transcription:** Mock Mode")

        st.markdown(f"🗄️ **DB:** SQLite (Active)")

        st.markdown("<br><hr>", unsafe_allow_html=True)
        st.markdown("<p style='font-size:11px; color:#6B7280; text-align:center;'>AI Meeting Notes Summarizer v1.0<br>Gemini 3.1 Pro Architecture</p>", unsafe_allow_html=True)

    # Route page based on selection
    if selection == "Dashboard":
        render_dashboard()
    elif selection == "Upload & Summarize":
        render_upload()
    elif selection == "Meeting Notes":
        render_meeting_details()
    elif selection == "Action Items":
        render_action_items_board()
    elif selection == "History":
        render_history()
    elif selection == "Settings":
        render_settings()


if __name__ == "__main__":
    main()

