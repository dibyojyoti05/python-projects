import fitz
import os
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QScrollArea, 
    QPushButton, QSpinBox, QSizePolicy
)
from PySide6.QtGui import QImage, QPixmap
from PySide6.QtCore import Qt
from services.history_service import HistoryService

class PDFViewerWidget(QWidget):
    """An advanced interactive widget for rendering, navigating, and inspecting PDF pages."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.current_doc = None
        self.current_file_path = None
        self.current_page = 0
        self.zoom = 1.5
        self.rotation = 0  # 0, 90, 180, 270

        self._setup_ui()

    def _setup_ui(self):
        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(0, 0, 0, 0)

        # Toolbar
        toolbar = QHBoxLayout()

        self.first_btn = QPushButton("|<")
        self.first_btn.setToolTip("First Page")
        self.first_btn.clicked.connect(self.first_page)
        
        self.prev_btn = QPushButton("< Prev")
        self.prev_btn.clicked.connect(self.prev_page)

        self.page_spin = QSpinBox()
        self.page_spin.setRange(1, 1)
        self.page_spin.setValue(1)
        self.page_spin.valueChanged.connect(self.on_spin_page_changed)

        self.page_label = QLabel("of 0")
        self.next_btn = QPushButton("Next >")
        self.next_btn.clicked.connect(self.next_page)

        self.last_btn = QPushButton(">|")
        self.last_btn.setToolTip("Last Page")
        self.last_btn.clicked.connect(self.last_page)

        toolbar.addWidget(self.first_btn)
        toolbar.addWidget(self.prev_btn)
        toolbar.addWidget(QLabel("Page:"))
        toolbar.addWidget(self.page_spin)
        toolbar.addWidget(self.page_label)
        toolbar.addWidget(self.next_btn)
        toolbar.addWidget(self.last_btn)

        toolbar.addSpacing(15)

        # Zoom buttons
        zoom_in_btn = QPushButton("Zoom +")
        zoom_in_btn.clicked.connect(self.zoom_in)
        zoom_out_btn = QPushButton("Zoom -")
        zoom_out_btn.clicked.connect(self.zoom_out)
        zoom_reset_btn = QPushButton("Fit / 100%")
        zoom_reset_btn.clicked.connect(self.zoom_reset)

        self.zoom_label = QLabel("150%")

        toolbar.addWidget(zoom_out_btn)
        toolbar.addWidget(self.zoom_label)
        toolbar.addWidget(zoom_in_btn)
        toolbar.addWidget(zoom_reset_btn)

        toolbar.addSpacing(15)

        # Rotate buttons
        rot_left_btn = QPushButton("Rotate ↺")
        rot_left_btn.clicked.connect(self.rotate_ccw)
        rot_right_btn = QPushButton("Rotate ↻")
        rot_right_btn.clicked.connect(self.rotate_cw)

        toolbar.addWidget(rot_left_btn)
        toolbar.addWidget(rot_right_btn)

        toolbar.addStretch()

        main_layout.addLayout(toolbar)

        # Scroll Area for rendering PDF image
        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setAlignment(Qt.AlignCenter)

        self.image_label = QLabel("Open a PDF file to preview its pages.")
        self.image_label.setAlignment(Qt.AlignCenter)
        self.image_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)

        self.scroll_area.setWidget(self.image_label)
        main_layout.addWidget(self.scroll_area)

        self.setLayout(main_layout)
        self._update_controls()

    def load_pdf(self, file_path: str):
        """Load a PDF file into the viewer."""
        try:
            if not os.path.exists(file_path):
                self.image_label.setText(f"File not found: {file_path}")
                return

            if self.current_doc:
                self.current_doc.close()

            self.current_doc = fitz.open(file_path)
            self.current_file_path = file_path
            self.current_page = 0
            self.rotation = 0

            page_count = self.current_doc.page_count
            self.page_spin.blockSignals(True)
            self.page_spin.setRange(1, max(1, page_count))
            self.page_spin.setValue(1)
            self.page_spin.blockSignals(False)

            self.page_label.setText(f"of {page_count}")
            self.render_page()

            # Record in DB recent documents
            HistoryService.record_recent_document(file_path, page_count, current_page=1)
        except Exception as e:
            self.image_label.setText(f"Error loading PDF: {e}")
        finally:
            self._update_controls()

    def render_page(self):
        """Render the current page with the applied zoom and rotation."""
        if not self.current_doc or self.current_doc.page_count == 0:
            return

        try:
            page = self.current_doc.load_page(self.current_page)
            mat = fitz.Matrix(self.zoom, self.zoom).prerotate(self.rotation)
            pix = page.get_pixmap(matrix=mat, alpha=False)

            fmt = QImage.Format_RGB888
            qimg = QImage(pix.samples, pix.width, pix.height, pix.stride, fmt)
            pixmap = QPixmap.fromImage(qimg)
            self.image_label.setPixmap(pixmap)
            self.zoom_label.setText(f"{int(self.zoom * 100)}%")

            self.page_spin.blockSignals(True)
            self.page_spin.setValue(self.current_page + 1)
            self.page_spin.blockSignals(False)

            if self.current_file_path:
                HistoryService.record_recent_document(
                    self.current_file_path,
                    self.current_doc.page_count,
                    current_page=self.current_page + 1
                )
        except Exception as e:
            self.image_label.setText(f"Rendering error: {e}")
        finally:
            self._update_controls()

    def on_spin_page_changed(self, val: int):
        if self.current_doc:
            target_idx = val - 1
            if 0 <= target_idx < self.current_doc.page_count:
                self.current_page = target_idx
                self.render_page()

    def first_page(self):
        if self.current_doc and self.current_page > 0:
            self.current_page = 0
            self.render_page()

    def prev_page(self):
        if self.current_doc and self.current_page > 0:
            self.current_page -= 1
            self.render_page()

    def next_page(self):
        if self.current_doc and self.current_page < self.current_doc.page_count - 1:
            self.current_page += 1
            self.render_page()

    def last_page(self):
        if self.current_doc and self.current_page < self.current_doc.page_count - 1:
            self.current_page = self.current_doc.page_count - 1
            self.render_page()

    def zoom_in(self):
        if self.zoom < 4.0:
            self.zoom += 0.25
            self.render_page()

    def zoom_out(self):
        if self.zoom > 0.5:
            self.zoom -= 0.25
            self.render_page()

    def zoom_reset(self):
        self.zoom = 1.0
        self.rotation = 0
        self.render_page()

    def rotate_cw(self):
        self.rotation = (self.rotation + 90) % 360
        self.render_page()

    def rotate_ccw(self):
        self.rotation = (self.rotation - 90) % 360
        self.render_page()

    def _update_controls(self):
        has_doc = self.current_doc is not None and self.current_doc.page_count > 0
        self.page_spin.setEnabled(has_doc)
        self.first_btn.setEnabled(has_doc and self.current_page > 0)
        self.prev_btn.setEnabled(has_doc and self.current_page > 0)
        self.next_btn.setEnabled(has_doc and self.current_page < (self.current_doc.page_count - 1 if has_doc else 0))
        self.last_btn.setEnabled(has_doc and self.current_page < (self.current_doc.page_count - 1 if has_doc else 0))
