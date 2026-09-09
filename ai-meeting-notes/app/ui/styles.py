import streamlit as st


def inject_custom_css() -> None:
    """Injects modern, professional, polished CSS for the application."""
    st.markdown(
        """
        <style>
        /* Modern Clean Styling */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        html, body, [class*="css"] {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Metric / KPI Card */
        .metric-card {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 18px 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            backdrop-filter: blur(10px);
            margin-bottom: 12px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
        }

        .metric-value {
            font-size: 28px;
            font-weight: 700;
            color: #3B82F6;
            margin-bottom: 2px;
        }

        .metric-label {
            font-size: 13px;
            font-weight: 500;
            color: #9CA3AF;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Glassmorphism Section Card */
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 18px;
        }

        /* Badge Pills */
        .badge {
            display: inline-block;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 600;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .badge-critical { background-color: #EF4444; color: #FFFFFF; }
        .badge-high { background-color: #F97316; color: #FFFFFF; }
        .badge-medium { background-color: #3B82F6; color: #FFFFFF; }
        .badge-low { background-color: #6B7280; color: #FFFFFF; }

        .badge-pending { background-color: #F59E0B; color: #FFFFFF; }
        .badge-in_progress { background-color: #3B82F6; color: #FFFFFF; }
        .badge-completed { background-color: #10B981; color: #FFFFFF; }

        /* Action Item Row */
        .action-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-left: 4px solid #3B82F6;
            border-radius: 8px;
            padding: 14px 18px;
            margin-bottom: 10px;
        }
        .action-card.critical { border-left-color: #EF4444; }
        .action-card.high { border-left-color: #F97316; }
        .action-card.completed { border-left-color: #10B981; opacity: 0.8; }

        /* Progress Steps */
        .step-active {
            color: #3B82F6;
            font-weight: 600;
        }
        .step-done {
            color: #10B981;
        }

        /* Header Subtitle */
        .sub-header-text {
            color: #9CA3AF;
            font-size: 15px;
            margin-top: -10px;
            margin-bottom: 24px;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

