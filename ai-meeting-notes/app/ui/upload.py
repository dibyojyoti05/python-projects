import time
from pathlib import Path
import streamlit as st

from app.config.settings import settings
from app.services import (
    FileService,
    TranscriptionService,
    SummarizationService,
    MeetingService,
)
from app.utils.logger import logger
from app.utils.security import compute_file_hash
from app.utils.validators import validate_file_type, validate_transcript_text


def render_upload() -> None:
    """Renders the file upload and direct transcript processing interface."""
    st.markdown("## 🎙️ AI Meeting Notes Summarizer")
    st.markdown("<p class='sub-header-text'>Turn long meetings into clear summaries, confirmed decisions, and actionable next steps.</p>", unsafe_allow_html=True)

    tab_upload, tab_paste = st.tabs(["📁 Upload Meeting File", "✍️ Paste Meeting Transcript"])

    with tab_upload:
        render_file_upload_form()

    with tab_paste:
        render_direct_paste_form()


def render_file_upload_form() -> None:
    """Handles drag & drop file upload and processing pipeline."""
    st.markdown("""
    <div style="background: rgba(59, 130, 246, 0.05); border: 2px dashed rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <h4 style="margin: 0; color: #60A5FA;">Upload Meeting File</h4>
        <p style="font-size: 13px; color: #9CA3AF; margin-top: 6px;">
            Supported formats: <b>PDF • DOCX • TXT • MD • MP3 • WAV • M4A • WEBM • MP4 • MOV</b> (Max {max_mb} MB)
        </p>
    </div>
    """.format(max_mb=settings.MAX_FILE_SIZE_MB), unsafe_allow_html=True)

    user_title = st.text_input(
        "Meeting Title (Optional)",
        placeholder="e.g., Q3 Product Roadmap & Infrastructure Planning",
        help="Leave blank to let AI automatically generate a descriptive title from content."
    )

    uploaded_file = st.file_uploader(
        "Choose a meeting recording or transcript",
        type=["txt", "md", "docx", "pdf", "mp3", "wav", "m4a", "webm", "mp4", "mov"],
        help="Upload transcript document or audio/video recording."
    )

    if uploaded_file is not None:
        # Check duplicate hash cache
        try:
            content_bytes = uploaded_file.getvalue()
            file_hash = compute_file_hash(content_bytes)
            existing_meeting = MeetingService.find_meeting_by_hash(file_hash)

            if existing_meeting and "force_reprocess" not in st.session_state:
                st.info(f"💡 This exact file was previously processed as **'{existing_meeting.title}'**.")
                c_prev, c_reproc = st.columns(2)
                with c_prev:
                    if st.button("📂 Use Previous Result", type="primary", use_container_width=True):
                        st.session_state["selected_meeting_id"] = existing_meeting.id
                        st.session_state["nav_selection"] = "Meeting Notes"
                        st.rerun()
                with c_reproc:
                    if st.button("🔄 Process Again", use_container_width=True):
                        st.session_state["force_reprocess"] = True
                        st.rerun()
                return

        except Exception as e:
            logger.warning(f"Failed to check duplicate hash: {e}")

        # Action Button
        if st.button("🚀 Process & Generate Meeting Notes", type="primary", use_container_width=True):
            execute_processing_pipeline(uploaded_file, user_title)


def render_direct_paste_form() -> None:
    """Handles direct transcript pasting."""
    user_title = st.text_input(
        "Meeting Title (Optional)",
        key="paste_title",
        placeholder="e.g., Engineering Architecture Sync",
    )

    transcript_text = st.text_area(
        "Meeting Transcript",
        height=280,
        placeholder="Paste your meeting notes or raw transcript here...\n\nSarah: Let's discuss our Q3 objectives...\nMichael: We have completed the UI redesign...",
    )

    if st.button("🚀 Analyze Pasted Transcript", type="primary", use_container_width=True):
        is_valid, err = validate_transcript_text(transcript_text)
        if not is_valid:
            st.error(f"Validation Error: {err}")
            return

        execute_text_pipeline(transcript_text, user_title)


def execute_processing_pipeline(uploaded_file, user_title: str) -> None:
    """Executes the complete multi-stage file processing pipeline with visual status updates."""
    status_container = st.container()
    progress_bar = st.progress(0.0)

    with status_container:
        st.markdown("### ⚙️ Processing Meeting Pipeline")
        status_text = st.empty()

        start_time = time.time()
        meeting_id = None

        try:
            # Stage 1: Save & Validate
            status_text.markdown("⏳ **Stage 1/5:** Validating and saving uploaded file...")
            progress_bar.progress(0.15)
            saved_path, clean_name, file_hash, file_size = FileService.save_uploaded_file(uploaded_file)
            is_valid, category, _ = validate_file_type(clean_name)

            meeting_id = MeetingService.create_or_update_meeting_record(
                source_filename=clean_name,
                file_type=category,
                file_hash=file_hash,
                file_size_bytes=file_size,
                user_title=user_title
            )

            # Stage 2: Extract Text or Transcribe Audio/Video
            progress_bar.progress(0.35)
            transcription_result = None

            if category == "text":
                status_text.markdown("📄 **Stage 2/5:** Extracting text from document...")
                raw_transcript = FileService.extract_text_from_file(saved_path)
            else:
                status_text.markdown("🎙️ **Stage 2/5:** Transcribing media file with Speech-to-Text...")
                trans_service = TranscriptionService()
                transcription_result = trans_service.process_media_file(saved_path)
                raw_transcript = transcription_result.raw_text

            # Stage 3: AI Analysis & Multi-Level Summarization
            status_text.markdown("🧠 **Stage 3/5:** Running AI analysis and grounding checks...")
            progress_bar.progress(0.60)

            def progress_cb(msg: str, pct: float):
                status_text.markdown(f"🤖 **Stage 3/5:** {msg}")
                progress_bar.progress(pct)

            sum_service = SummarizationService()
            analysis_result = sum_service.analyze_meeting(
                raw_transcript=raw_transcript,
                user_title=user_title,
                progress_callback=progress_cb
            )

            # Stage 4: Structure & Action Item Extraction
            status_text.markdown("⚡ **Stage 4/5:** Structuring decisions, action items, and participants...")
            progress_bar.progress(0.85)

            # Stage 5: Database Commit
            status_text.markdown("💾 **Stage 5/5:** Saving meeting notes and action items to database...")
            progress_bar.progress(0.95)

            elapsed_seconds = round(time.time() - start_time, 2)
            model_name = getattr(sum_service.provider, "model_name", "Mock AI Model")

            MeetingService.save_analysis_results(
                meeting_id=meeting_id,
                raw_transcript=raw_transcript,
                analysis=analysis_result,
                transcription_result=transcription_result,
                duration_seconds=elapsed_seconds,
                model_used=model_name
            )

            progress_bar.progress(1.0)
            status_text.markdown("✅ **Processing Complete!** Redirecting to meeting notes...")
            time.sleep(0.8)

            # Reset reprocess flag and redirect
            st.session_state.pop("force_reprocess", None)
            st.session_state["selected_meeting_id"] = meeting_id
            st.session_state["nav_selection"] = "Meeting Notes"
            st.rerun()

        except Exception as e:
            logger.error(f"Pipeline error: {e}", exc_info=True)
            if meeting_id:
                MeetingService.mark_meeting_failed(meeting_id, str(e))
            st.error(f"❌ Processing Error: {e}")


def execute_text_pipeline(raw_transcript: str, user_title: str) -> None:
    """Executes the AI summarization pipeline for directly pasted text."""
    status_container = st.container()
    progress_bar = st.progress(0.0)

    with status_container:
        st.markdown("### ⚙️ Processing Transcript")
        status_text = st.empty()
        start_time = time.time()
        meeting_id = None

        try:
            status_text.markdown("⏳ **Stage 1/3:** Validating and preparing transcript...")
            progress_bar.progress(0.2)

            file_hash = compute_file_hash(raw_transcript.encode("utf-8"))
            meeting_id = MeetingService.create_or_update_meeting_record(
                source_filename="Pasted Transcript",
                file_type="text",
                file_hash=file_hash,
                file_size_bytes=len(raw_transcript.encode("utf-8")),
                user_title=user_title
            )

            status_text.markdown("🧠 **Stage 2/3:** Analyzing meeting transcript with AI...")
            progress_bar.progress(0.6)

            sum_service = SummarizationService()
            analysis_result = sum_service.analyze_meeting(
                raw_transcript=raw_transcript,
                user_title=user_title
            )

            status_text.markdown("💾 **Stage 3/3:** Saving structured notes to database...")
            progress_bar.progress(0.9)

            elapsed_seconds = round(time.time() - start_time, 2)
            model_name = getattr(sum_service.provider, "model_name", "AI Model")

            MeetingService.save_analysis_results(
                meeting_id=meeting_id,
                raw_transcript=raw_transcript,
                analysis=analysis_result,
                transcription_result=None,
                duration_seconds=elapsed_seconds,
                model_used=model_name
            )

            progress_bar.progress(1.0)
            status_text.markdown("✅ **Processing Complete!**")
            time.sleep(0.5)

            st.session_state["selected_meeting_id"] = meeting_id
            st.session_state["nav_selection"] = "Meeting Notes"
            st.rerun()

        except Exception as e:
            logger.error(f"Text pipeline error: {e}", exc_info=True)
            if meeting_id:
                MeetingService.mark_meeting_failed(meeting_id, str(e))
            st.error(f"❌ Error: {e}")

