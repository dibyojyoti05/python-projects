import streamlit as st
from app.services.meeting_service import MeetingService
from app.services.export_service import ExportService


def render_history() -> None:
    """Renders the meeting archive and search interface."""
    st.markdown("## 📚 Meeting History & Archive")
    st.markdown("<p class='sub-header-text'>Search, filter, review, and export all past processed meetings.</p>", unsafe_allow_html=True)

    # Search & Filter Controls
    c_search, c_filter = st.columns([3, 1])
    with c_search:
        search_query = st.text_input(
            "🔍 Search meetings:",
            placeholder="Search by title, participant, keyword, decision, or action item...",
        )
    with c_filter:
        status_filter = st.selectbox(
            "Status Filter",
            options=["ALL", "COMPLETED", "PROCESSING", "FAILED"],
            index=0
        )

    meetings = MeetingService.list_meetings(
        search_query=search_query,
        status_filter=status_filter
    )

    if not meetings:
        st.info("No meetings matched your search criteria. Try a different query or upload a new meeting.")
        return

    st.markdown(f"**Showing {len(meetings)} meetings**")

    for meeting in meetings:
        date_str = meeting.date.strftime("%B %d, %Y") if meeting.date else "Not specified"
        duration_str = f"{meeting.duration_minutes:.1f} mins" if meeting.duration_minutes else "—"
        actions_count = len(meeting.action_items) if meeting.action_items else 0
        summary_snippet = meeting.summary.quick_summary if meeting.summary else "No summary available."

        with st.container():
            st.markdown(f"""
            <div class="glass-card" style="margin-bottom: 12px; padding: 18px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h4 style="margin:0 0 6px 0; color:#60A5FA;">{meeting.title}</h4>
                        <div style="font-size:12px; color:#9CA3AF; margin-bottom:8px;">
                            📅 <b>Date:</b> {date_str} &nbsp;•&nbsp; 
                            ⏱️ <b>Duration:</b> {duration_str} &nbsp;•&nbsp; 
                            📁 <b>Source:</b> {meeting.source_filename or 'Manual'} &nbsp;•&nbsp;
                            ⚡ <b>Action Items:</b> {actions_count}
                        </div>
                    </div>
                    <span class="badge badge-{meeting.status.value.lower()}">{meeting.status.value}</span>
                </div>
                <p style="font-size: 13px; color: #D1D5DB; margin-top: 4px; margin-bottom: 12px;">
                    {summary_snippet[:220]}...
                </p>
            </div>
            """, unsafe_allow_html=True)

            c_btn1, c_btn2, c_btn3, c_btn4 = st.columns([2, 1, 1, 1])
            with c_btn1:
                if st.button("📖 View Full Notes", key=f"hist_view_{meeting.id}", use_container_width=True):
                    st.session_state["selected_meeting_id"] = meeting.id
                    st.session_state["nav_selection"] = "Meeting Notes"
                    st.rerun()

            with c_btn2:
                pdf_bytes = ExportService.export_to_pdf_bytes(meeting)
                st.download_button(
                    label="📄 PDF",
                    data=pdf_bytes,
                    file_name=f"{meeting.title[:25]}_notes.pdf",
                    mime="application/pdf",
                    key=f"hist_pdf_{meeting.id}",
                    use_container_width=True
                )

            with c_btn3:
                md_text = ExportService.export_to_markdown(meeting)
                st.download_button(
                    label="📑 MD",
                    data=md_text,
                    file_name=f"{meeting.title[:25]}_notes.md",
                    mime="text/markdown",
                    key=f"hist_md_{meeting.id}",
                    use_container_width=True
                )

            with c_btn4:
                if st.button("🗑️ Delete", key=f"hist_del_{meeting.id}", use_container_width=True):
                    MeetingService.delete_meeting(meeting.id)
                    st.success("Meeting deleted.")
                    st.rerun()

            st.markdown("<br>", unsafe_allow_html=True)

