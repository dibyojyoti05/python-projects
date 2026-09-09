import streamlit as st
from app.services.meeting_service import MeetingService
from app.config.settings import settings


def render_dashboard() -> None:
    """Renders the executive overview dashboard."""
    st.markdown("## 📊 Executive Dashboard")
    st.markdown("<p class='sub-header-text'>Overview of meeting summaries, extracted action items, and processing health.</p>", unsafe_allow_html=True)

    metrics = MeetingService.get_dashboard_metrics()

    # KPI Metric Cards
    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{metrics['total_meetings']}</div>
            <div class="metric-label">Total Meetings</div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value" style="color:#10B981;">{metrics['processed_meetings']}</div>
            <div class="metric-label">Processed</div>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value" style="color:#8B5CF6;">{metrics['total_action_items']}</div>
            <div class="metric-label">Total Action Items</div>
        </div>
        """, unsafe_allow_html=True)

    with col4:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value" style="color:#F59E0B;">{metrics['pending_action_items']}</div>
            <div class="metric-label">Pending Actions</div>
        </div>
        """, unsafe_allow_html=True)

    with col5:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value" style="color:#10B981;">{metrics['completed_action_items']}</div>
            <div class="metric-label">Completed Actions</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")

    # Action Items Needing Attention & Recent Meetings
    c_left, c_right = st.columns([3, 2])

    with c_left:
        st.subheader("⚡ Urgent & Open Action Items")
        if not metrics["recent_actions"]:
            st.info("🎉 No pending action items! All tasks are up to date.")
        else:
            for item in metrics["recent_actions"]:
                prio_class = item.priority.value.lower() if item.priority else "medium"
                status_val = item.status.value if item.status else "PENDING"
                meeting_title = item.meeting.title if item.meeting else "Meeting"

                with st.container():
                    st.markdown(f"""
                    <div class="action-card {prio_class}">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong>{item.task}</strong>
                            <span class="badge badge-{prio_class}">{item.priority.value if item.priority else 'MEDIUM'}</span>
                        </div>
                        <div style="font-size:12px; color:#9CA3AF; margin-top:6px;">
                            👤 <b>Assignee:</b> {item.assignee} &nbsp;|&nbsp; 
                            📅 <b>Deadline:</b> {item.deadline} &nbsp;|&nbsp;
                            📁 <b>Meeting:</b> {meeting_title}
                        </div>
                    </div>
                    """, unsafe_allow_html=True)

                    # Quick status changer
                    c_act1, c_act2 = st.columns([4, 1])
                    with c_act2:
                        if st.button("Mark Done", key=f"quick_done_{item.id}", use_container_width=True):
                            MeetingService.update_action_item(item.id, status="COMPLETED")
                            st.rerun()

    with c_right:
        st.subheader("🗓️ Recent Meetings")
        if not metrics["recent_meetings"]:
            st.info("No meetings processed yet. Upload your first transcript or audio file!")
            if st.button("➕ Upload Meeting", type="primary", use_container_width=True):
                st.session_state["nav_selection"] = "Upload"
                st.rerun()
        else:
            for meeting in metrics["recent_meetings"]:
                date_str = meeting.date.strftime("%b %d, %Y") if meeting.date else ""
                actions_count = len(meeting.action_items) if meeting.action_items else 0

                with st.container():
                    st.markdown(f"""
                    <div class="glass-card" style="padding:14px; margin-bottom:10px;">
                        <div style="font-weight:600; font-size:15px; color:#60A5FA;">{meeting.title}</div>
                        <div style="font-size:12px; color:#9CA3AF; margin-top:4px;">
                            📅 {date_str} &nbsp;•&nbsp; ⚡ {actions_count} Action Items &nbsp;•&nbsp; ⏱️ {meeting.duration_minutes or '—'}m
                        </div>
                    </div>
                    """, unsafe_allow_html=True)

                    if st.button("View Meeting Notes →", key=f"view_rec_{meeting.id}", use_container_width=True):
                        st.session_state["selected_meeting_id"] = meeting.id
                        st.session_state["nav_selection"] = "Meeting Notes"
                        st.rerun()

