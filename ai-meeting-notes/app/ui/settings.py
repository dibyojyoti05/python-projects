import streamlit as st
from app.config.settings import settings
from app.utils.security import mask_secret
from app.demo_data.seed import seed_demo_data


def render_settings() -> None:
    """Renders system configuration, API readiness, and demo data management."""
    st.markdown("## ⚙️ Application Settings & Configuration")
    st.markdown("<p class='sub-header-text'>Inspect system providers, API configurations, and chunking parameters.</p>", unsafe_allow_html=True)

    # Provider Readiness
    st.subheader("🔌 API & Provider Status")

    c_gem, c_whisp = st.columns(2)
    with c_gem:
        st.markdown("""
        <div class="glass-card">
            <h4>Google Gemini AI</h4>
            <p style="font-size:13px; color:#9CA3AF;">Primary intelligence provider for meeting summarization and structured extraction.</p>
        </div>
        """, unsafe_allow_html=True)
        if settings.is_gemini_ready:
            st.success(f"✅ Gemini API Key Configured ({mask_secret(settings.GEMINI_API_KEY)})")
        else:
            st.warning("⚠️ Gemini API Key is not set in `.env` (Running in Mock Mode)")

        st.text_input("Active Gemini Model", value=settings.GEMINI_MODEL, disabled=True)

    with c_whisp:
        st.markdown("""
        <div class="glass-card">
            <h4>Whisper Speech-to-Text</h4>
            <p style="font-size:13px; color:#9CA3AF;">Audio & video transcription provider with timestamp extraction.</p>
        </div>
        """, unsafe_allow_html=True)
        if settings.is_whisper_ready:
            st.success(f"✅ Whisper API Key Configured ({mask_secret(settings.WHISPER_API_KEY)})")
        else:
            st.info("ℹ️ Whisper API Key not set (Using Mock Transcription Provider)")

    st.markdown("---")

    # Processing & Chunking Parameters
    st.subheader("📐 Chunking & Length Management")
    c_p1, c_p2, c_p3 = st.columns(3)
    with c_p1:
        st.number_input("Max Upload Size (MB)", value=settings.MAX_FILE_SIZE_MB, disabled=True)
    with c_p2:
        st.number_input("Chunk Size (characters)", value=settings.CHUNK_SIZE, disabled=True)
    with c_p3:
        st.number_input("Chunk Overlap (characters)", value=settings.CHUNK_OVERLAP, disabled=True)

    st.markdown("---")

    # Database & Storage
    st.subheader("🗄️ Database & Storage")
    st.text_input("Database Connection URL", value=settings.DATABASE_URL, disabled=True)
    st.text_input("Upload Storage Path", value=str(settings.UPLOAD_DIR), disabled=True)

    st.markdown("---")

    # Demo Data Management
    st.subheader("🧪 Demo Data & Environment Reset")
    st.write("Reset or re-seed sample meetings for portfolio demonstration.")

    c_seed1, c_seed2 = st.columns([1, 3])
    with c_seed1:
        if st.button("🌱 Re-Seed Demo Meetings", type="secondary", use_container_width=True):
            seed_demo_data(force=True)
            st.success("Successfully seeded 3 rich sample meetings!")
            st.rerun()

