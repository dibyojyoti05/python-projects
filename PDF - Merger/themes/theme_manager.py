class ThemeManager:
    """Manages application themes and stylesheets."""

    DARK_THEME = """
        QMainWindow { 
            background-color: #181825; 
        }
        QWidget { 
            color: #cdd6f4; 
            font-family: 'Segoe UI', Arial, sans-serif; 
            font-size: 13px; 
        }
        QTabWidget::pane { 
            border: 1px solid #313244; 
            background-color: #1e1e2e; 
            border-radius: 8px;
            padding: 4px;
        }
        QTabBar::tab { 
            background: #313244; 
            color: #a6adc8;
            padding: 8px 16px; 
            border-top-left-radius: 6px; 
            border-top-right-radius: 6px; 
            margin-right: 3px;
            font-weight: 500;
        }
        QTabBar::tab:selected { 
            background: #89b4fa; 
            color: #11111b; 
            font-weight: bold;
        }
        QTabBar::tab:hover:!selected {
            background: #45475a;
            color: #cdd6f4;
        }
        QPushButton { 
            background-color: #89b4fa; 
            color: #11111b; 
            padding: 8px 14px; 
            border-radius: 5px; 
            font-weight: 600;
            border: none;
        }
        QPushButton:hover { 
            background-color: #b4befe; 
        }
        QPushButton:pressed {
            background-color: #74c7ec;
        }
        QPushButton:disabled {
            background-color: #45475a;
            color: #6c7086;
        }
        QListWidget, QTextEdit, QLineEdit, QComboBox, QTableWidget { 
            background-color: #11111b; 
            color: #cdd6f4;
            border: 1px solid #45475a; 
            border-radius: 5px; 
            padding: 6px;
            selection-background-color: #89b4fa;
            selection-color: #11111b;
        }
        QHeaderView::section {
            background-color: #313244;
            color: #cdd6f4;
            padding: 6px;
            border: 1px solid #45475a;
            font-weight: bold;
        }
        QProgressBar {
            border: 1px solid #45475a;
            border-radius: 5px;
            text-align: center;
            background-color: #11111b;
            color: #cdd6f4;
            height: 14px;
        }
        QProgressBar::chunk {
            background-color: #a6e3a1;
            border-radius: 4px;
        }
        QScrollArea {
            border: 1px solid #313244;
            border-radius: 6px;
            background-color: #11111b;
        }
        QLabel {
            color: #cdd6f4;
        }
    """

    LIGHT_THEME = """
        QMainWindow { 
            background-color: #f4f5f8; 
        }
        QWidget { 
            color: #2e3440; 
            font-family: 'Segoe UI', Arial, sans-serif; 
            font-size: 13px; 
        }
        QTabWidget::pane { 
            border: 1px solid #d8dee9; 
            background-color: #ffffff; 
            border-radius: 8px;
            padding: 4px;
        }
        QTabBar::tab { 
            background: #e5e9f0; 
            color: #4c566a;
            padding: 8px 16px; 
            border-top-left-radius: 6px; 
            border-top-right-radius: 6px; 
            margin-right: 3px;
            font-weight: 500;
        }
        QTabBar::tab:selected { 
            background: #5e81ac; 
            color: #ffffff; 
            font-weight: bold;
        }
        QTabBar::tab:hover:!selected {
            background: #eceff4;
        }
        QPushButton { 
            background-color: #5e81ac; 
            color: #ffffff; 
            padding: 8px 14px; 
            border-radius: 5px; 
            font-weight: 600;
            border: none;
        }
        QPushButton:hover { 
            background-color: #81a1c1; 
        }
        QPushButton:pressed {
            background-color: #4c566a;
        }
        QPushButton:disabled {
            background-color: #d8dee9;
            color: #9aa2b1;
        }
        QListWidget, QTextEdit, QLineEdit, QComboBox, QTableWidget { 
            background-color: #ffffff; 
            color: #2e3440;
            border: 1px solid #d8dee9; 
            border-radius: 5px; 
            padding: 6px;
            selection-background-color: #5e81ac;
            selection-color: #ffffff;
        }
        QHeaderView::section {
            background-color: #eceff4;
            color: #2e3440;
            padding: 6px;
            border: 1px solid #d8dee9;
            font-weight: bold;
        }
        QProgressBar {
            border: 1px solid #d8dee9;
            border-radius: 5px;
            text-align: center;
            background-color: #e5e9f0;
            color: #2e3440;
            height: 14px;
        }
        QProgressBar::chunk {
            background-color: #a3be8c;
            border-radius: 4px;
        }
        QScrollArea {
            border: 1px solid #d8dee9;
            border-radius: 6px;
            background-color: #ffffff;
        }
        QLabel {
            color: #2e3440;
        }
    """

    @classmethod
    def get_theme(cls, theme_name: str = "dark") -> str:
        if theme_name.lower() == "light":
            return cls.LIGHT_THEME
        return cls.DARK_THEME
