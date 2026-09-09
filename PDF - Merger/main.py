import sys
import logging
from PySide6.QtWidgets import QApplication
from core.config import setup_logging, settings
from db.database import init_db
from services.settings_service import SettingsService
from themes.theme_manager import ThemeManager
from ui.main_window import MainWindow

# Initialize rotating file logging
setup_logging()
logger = logging.getLogger("main")

def main():
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    
    # Initialize database tables
    try:
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")

    app = QApplication(sys.argv)
    app.setStyle("Fusion") 

    # Apply saved theme preference
    saved_theme = SettingsService.get_setting("THEME", "dark")
    app.setStyleSheet(ThemeManager.get_theme(saved_theme))

    window = MainWindow()
    window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
