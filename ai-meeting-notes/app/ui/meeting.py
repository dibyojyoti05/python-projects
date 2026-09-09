from datetime import datetime
import streamlit as st

from app.services.meeting_service import MeetingService
from app.services.export_service import ExportService
from app.utils.logger import logger


def render_meeting_details() -> None:
    """Renders comprehensive meeting notes view with multi-level summaries, action item editing, and export."""
    meeting_id = st.session_state.get("selected_meeting_id")

    if not meeting_id:
        st.warning("⚠️ No meeting selected. Please choose a meeting from History or Dashboard.")
        if st.button("⬅️ Go to History"):
            st.session_state["nav_selection"] = "History"
            st.rerun()
        return

    meeting = MeetingService.get_meeting(meeting_id)
    if not meeting:
        st.error(f"Meeting with ID {meeting_id} could not be found.")
        return

    # Header Bar
    render_meeting_header(meeting)

    # Export Toolbar
    render_export_bar(meeting)

    # Top KPI counts
    kp_count = len(meeting.summary.key_points) if meeting.summary and meeting.summary.key_points else 0
    dec_count = len(meeting.summary.decisions) if meeting.summary and meeting.summary.decisions else 0
    act_count = len(meeting.action_items) if meeting.action_items else 0
    part_count = len(meeting.participants) if meeting.participants else 0

    col_k1, col_k2, col_k3, col_k4 = st.columns(4)
    with col_k1:
        st.markdown(f"<div class='metric-card'><div class='metric-value'>{kp_count}</div><div class='metric-label'>Key Points</div></div>", unsafe_allow_html=True)
    with col_k2:
        st.markdown(f"<div class='metric-card'><div class='metric-value' style='color:#10B981;'>{dec_count}</div><div class='metric-label'>Decisions</div></div>", unsafe_allow_html=True)
    with col_k3:
        st.markdown(f"<div class='metric-card'><div class='metric-value' style='color:#8B5CF6;'>{act_count}</div><div class='metric-label'>Action Items</div></div>", unsafe_allow_html=True)
    with col_k4:
        st.markdown(f"<div class='metric-card'><div class='metric-value' style='color:#EC4899;'>{part_count}</div><div class='metric-label'>Participants</div></div>", unsafe_allow_html=True)

    st.markdown("---")

    # Main Content Columns
    c_main, c_side = st.columns([3, 2])

    with c_main:
        # Multi-Level Summary Section
        st.subheader("📋 Meeting Summary")
        summary_level = st.radio(
            "Select Summary Detail Level:",
            options=["Quick Summary", "Standard Summary", "Detailed Summary"],
            horizontal=True,
            help="Switch between concise executive overview and comprehensive meeting notes."
        )

        if meeting.summary:
            if summary_level == "Quick Summary":
                st.info(meeting.summary.quick_summary)
            elif summary_level == "Standard Summary":
                st.markdown(meeting.summary.standard_summary or meeting.summary.quick_summary)
            else:
                st.markdown(meeting.summary.detailed_summary or meeting.summary.standard_summary or meeting.summary.quick_summary)

        # Key Points
        st.markdown("### 💡 Key Discussion Points")
        if meeting.summary and meeting.summary.key_points:
            for kp in meeting.summary.key_points:
                st.markdown(f"- {kp}")
        else:
            st.write("No specific key points detected.")

        # Decisions Made
        st.markdown("### 🎯 Decisions Made")
        if meeting.summary and meeting.summary.decisions:
            for dec in meeting.summary.decisions:
                st.markdown(f"""
                <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10B981; padding: 10px 14px; border-radius: 6px; margin-bottom: 8px;">
                    <span style="color:#10B981; font-weight:600;">✓ Decision:</span> {dec}
                </div>
                """, unsafe_allow_html=True)
        else:
            st.write("No explicit decisions detected in this meeting.")

        # Open Questions / Issues
        if meeting.summary and meeting.summary.questions:
            st.markdown("### ❓ Questions & Open Issues")
            for q in meeting.summary.questions:
                st.markdown(f"- **Issue/Question:** {q}")

    with c_side:
        # Action Items Section
        st.subheader(f"⚡ Action Items ({act_count})")
        if not meeting.action_items:
            st.info("No action items were detected for this meeting.")
        else:
            for item in meeting.action_items:
                render_action_item_card(item)

        st.markdown("---")

        # Participants Section
        st.subheader("👥 Attendees & Participants")
        if meeting.participants:
            for p in meeting.participants:
                role_info = f" • <span style='color:#9CA3AF;'>{p.role}</span>" if p.role else ""
                st.markdown(f"• **{p.name}**{role_info}", unsafe_allow_html=True)
        else:
            st.write("Not available or not detected.")

    st.markdown("---")

    # Collapsible Original Transcript Section
    render_transcript_viewer(meeting)


def render_meeting_header(meeting) -> None:
    """Renders header metadata block."""
    date_str = meeting.date.strftime("%B %d, %Y • %I:%M %p") if meeting.date else "Not available"
    duration_str = f"{meeting.duration_minutes:.1f} mins" if meeting.duration_minutes else "Not available"
    proc_time = f"{meeting.processing_time_seconds:.1f}s" if meeting.processing_time_seconds else "—"

    st.markdown(f"# {meeting.title}")
    st.markdown(f"""
    <div style="display:flex; flex-wrap:wrap; gap:16px; font-size:13px; color:#9CA3AF; margin-top:-8px; margin-bottom:16px;">
        <span>📅 <b>Date:</b> {date_str}</span>
        <span>⏱️ <b>Duration:</b> {duration_str}</span>
        <span>📁 <b>Source:</b> {meeting.source_filename or 'Manual'}</span>
        <span>⚡ <b>Processed in:</b> {proc_time}</span>
        <span>🤖 <b>Model:</b> {meeting.summary.model_used if meeting.summary else 'Gemini'}</span>
    </div>
    """, unsafe_allow_html=True)


def render_export_bar(meeting) -> None:
    """Renders multi-format export buttons."""
    c1, c2, c3, c4, c5 = st.columns([1, 1, 1, 1, 2])

    with c1:
        pdf_bytes = ExportService.export_to_pdf_bytes(meeting)
        st.download_button(
            label="📄 PDF Export",
            data=pdf_bytes,
            file_name=f"{meeting.title[:30]}_notes.pdf",
            mime="application/pdf",
            use_container_width=True
        )

    with c2:
        docx_bytes = ExportService.export_to_docx_bytes(meeting)
        st.download_button(
            label="📝 DOCX Export",
            data=docx_bytes,
            file_name=f"{meeting.title[:30]}_notes.docx",
            mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            use_container_width=True
        )

    with c3:
        md_text = ExportService.export_to_markdown(meeting)
        st.download_button(
            label="📑 Markdown",
            data=md_text,
            file_name=f"{meeting.title[:30]}_notes.md",
            mime="text/markdown",
            use_container_width=True
        )

    with c4:
        txt_text = ExportService.export_to_txt(meeting)
        st.download_button(
            label="📜 Plain TXT",
            data=txt_text,
            file_name=f"{meeting.title[:30]}_notes.txt",
            mime="text/plain",
            use_container_width=True
        )

    with c5:
        if st.button("🗑️ Delete Meeting", help="Permanently delete this meeting record"):
            MeetingService.delete_meeting(meeting.id)
            st.success("Meeting deleted.")
            st.session_state["nav_selection"] = "History"
            st.rerun()


def render_action_item_card(item) -> None:
    """Renders an interactive action item card with status and priority toggles."""
    prio_class = item.priority.value.lower() if item.priority else "medium"
    status_val = item.status.value if item.status else "PENDING"
    is_completed = status_val == "COMPLETED"

    card_class = f"action-card {prio_class} {'completed' if is_completed else ''}"

    st.markdown(f"""
    <div class="{card_class}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="font-weight:600; color:{'#9CA3AF; text-decoration:line-through;' if is_completed else '#FFFFFF;'}">
                {item.task}
            </div>
            <span class="badge badge-{prio_class}">{item.priority.value if item.priority else 'MEDIUM'}</span>
        </div>
        <div style="font-size:12px; color:#9CA3AF; margin-top:8px;">
            👤 <b>Assigned:</b> {item.assignee} &nbsp;|&nbsp; 📅 <b>Deadline:</b> {item.deadline}
        </div>
    </div>
    """, unsafe_allow_html=True)

    with st.expander("✏️ Update Status / Priority", expanded=False):
        c_st, c_pr = st.columns(2)
        with c_st:
            new_status = st.selectbox(
                "Status",
                options=["PENDING", "IN_PROGRESS", "COMPLETED"],
                index=["PENDING", "IN_PROGRESS", "COMPLETED"].index(status_val),
                key=f"status_sel_{item.id}"
            )
        with c_pr:
            current_prio = item.priority.value if item.priority else "MEDIUM"
            new_prio = st.selectbox(
                "Priority",
                options=["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                index=["LOW", "MEDIUM", "HIGH", "CRITICAL"].index(current_prio),
                key=f"prio_sel_{item.id}"
            )

        if st.button("Save Changes", key=f"save_act_{item.id}", use_container_width=True):
            MeetingService.update_action_item(item.id, status=new_status, priority=new_prio)
            st.rerun()


def render_transcript_viewer(meeting) -> None:
    """Renders the collapsible, searchable transcript section."""
    with st.expander("📜 Original Meeting Transcript", expanded=False):
        if not meeting.transcript:
            st.write("No transcript text stored.")
            return

        raw_transcript = meeting.transcript.raw_text or ""
        word_count = meeting.transcript.word_count or len(raw_transcript.split())

        st.markdown(f"**Word Count:** {word_count:,} words  |  **Language:** {meeting.transcript.language.upper()}")

        search_query = st.text_input("🔍 Search within transcript:", placeholder="Type a keyword, speaker name, or topic...")

        display_text = raw_transcript
        if search_query and search_query.strip():
            lines = raw_transcript.splitlines()
            matching_lines = [line for line in lines if search_query.lower() in line.lower()]
            st.info(f"Found {len(matching_lines)} matching lines:")
            display_text = "\n\n".join(matching_lines)

        st.text_area("Transcript Content", value=display_text, height=320, disabled=True)

        st.download_button(
            label="⬇️ Download Raw Transcript (.txt)",
            data=raw_transcript,
            file_name=f"{meeting.title[:30]}_raw_transcript.txt",
            mime="text/plain"
        )

