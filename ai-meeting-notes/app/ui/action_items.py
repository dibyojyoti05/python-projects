import streamlit as st
from sqlalchemy.orm import joinedload
from app.database import get_db_session, ActionItem, Meeting, ActionItemStatus, PriorityLevel
from app.services.meeting_service import MeetingService


def render_action_items_board() -> None:
    """Renders cross-meeting Action Items task tracker."""
    st.markdown("## ⚡ Action Item Task Board")
    st.markdown("<p class='sub-header-text'>Track, update, and manage all assigned tasks across every meeting.</p>", unsafe_allow_html=True)

    with get_db_session() as session:
        items = (
            session.query(ActionItem)
            .options(joinedload(ActionItem.meeting))
            .order_by(ActionItem.created_at.desc())
            .all()
        )

        if not items:
            st.info("No action items found across any meetings yet.")
            return

        # Filtering
        c_filter1, c_filter2 = st.columns(2)
        with c_filter1:
            all_assignees = sorted(list(set(i.assignee for i in items if i.assignee)))
            selected_assignee = st.selectbox("Filter by Assignee:", options=["ALL"] + all_assignees)
        with c_filter2:
            selected_priority = st.selectbox("Filter by Priority:", options=["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"])

        filtered = items
        if selected_assignee != "ALL":
            filtered = [i for i in filtered if i.assignee == selected_assignee]
        if selected_priority != "ALL":
            filtered = [i for i in filtered if i.priority and i.priority.value == selected_priority]

        # Tabs for Status: Pending, In Progress, Completed
        tab_pend, tab_inprog, tab_comp = st.tabs([
            f"🟡 Pending ({len([i for i in filtered if i.status == ActionItemStatus.PENDING])})",
            f"🔵 In Progress ({len([i for i in filtered if i.status == ActionItemStatus.IN_PROGRESS])})",
            f"🟢 Completed ({len([i for i in filtered if i.status == ActionItemStatus.COMPLETED])})",
        ])

        with tab_pend:
            render_item_list([i for i in filtered if i.status == ActionItemStatus.PENDING])

        with tab_inprog:
            render_item_list([i for i in filtered if i.status == ActionItemStatus.IN_PROGRESS])

        with tab_comp:
            render_item_list([i for i in filtered if i.status == ActionItemStatus.COMPLETED])


def render_item_list(items) -> None:
    """Renders a list of action item cards."""
    if not items:
        st.write("No tasks in this category.")
        return

    for item in items:
        prio_val = item.priority.value if item.priority else "MEDIUM"
        meeting_title = item.meeting.title if item.meeting else "Meeting"

        with st.container():
            st.markdown(f"""
            <div class="action-card {prio_val.lower()}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="font-weight:600;">{item.task}</div>
                    <span class="badge badge-{prio_val.lower()}">{prio_val}</span>
                </div>
                <div style="font-size:12px; color:#9CA3AF; margin-top:8px;">
                    👤 <b>Assignee:</b> {item.assignee} &nbsp;|&nbsp; 
                    📅 <b>Deadline:</b> {item.deadline} &nbsp;|&nbsp;
                    📁 <b>Meeting:</b> {meeting_title}
                </div>
            </div>
            """, unsafe_allow_html=True)

            c1, c2, c3 = st.columns([2, 2, 2])
            with c1:
                new_status = st.selectbox(
                    "Change Status",
                    options=["PENDING", "IN_PROGRESS", "COMPLETED"],
                    index=["PENDING", "IN_PROGRESS", "COMPLETED"].index(item.status.value),
                    key=f"act_b_status_{item.id}"
                )
                if new_status != item.status.value:
                    MeetingService.update_action_item(item.id, status=new_status)
                    st.rerun()

            with c2:
                if st.button("🔗 View Meeting Notes", key=f"go_meet_{item.id}", use_container_width=True):
                    st.session_state["selected_meeting_id"] = item.meeting_id
                    st.session_state["nav_selection"] = "Meeting Notes"
                    st.rerun()

            st.markdown("<br>", unsafe_allow_html=True)

