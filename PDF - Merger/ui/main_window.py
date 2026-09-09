import sys
import os
import time
import subprocess
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QPushButton, QLabel, QFileDialog, QListWidget, 
    QTabWidget, QMessageBox, QListWidgetItem, QAbstractItemView,
    QLineEdit, QFormLayout, QTextEdit, QProgressBar, QComboBox,
    QTableWidget, QTableWidgetItem, QHeaderView, QGroupBox, QApplication
)
from PySide6.QtCore import Qt, QThreadPool, QUrl
from PySide6.QtGui import QDesktopServices

from engines.merge.merger import PDFMergerEngine
from engines.split.splitter import PDFSplitterEngine
from engines.pdf.core import PDFCoreEngine
from engines.compression.compressor import PDFCompressorEngine
from engines.conversion.converter import PDFConverterEngine
from engines.ocr.ocr_engine import OCRengine
from engines.security.security_engine import PDFSecurityEngine
from engines.ai.ai_engine import AIEngine
from engines.cloud.aws_s3 import CloudEngine
from ui.viewer import PDFViewerWidget
from utils.worker import Worker
from services.history_service import HistoryService
from services.settings_service import SettingsService
from themes.theme_manager import ThemeManager
from core.config import settings

class BaseAsyncTab(QWidget):
    """Base tab providing thread pool execution, progress bar, and audit logging."""
    def __init__(self):
        super().__init__()
        self.threadpool = QThreadPool()
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 0)
        self.progress_bar.hide()
        
        self.current_op_type = "UNKNOWN"
        self.current_inputs = []
        self.current_output = None
        self.start_timestamp = 0

    def start_worker(self, func, op_type: str, input_files, output_file=None, *args, **kwargs):
        self.current_op_type = op_type
        self.current_inputs = input_files
        self.current_output = output_file
        self.start_timestamp = time.time()

        self.progress_bar.show()
        worker = Worker(func, *args, **kwargs)
        worker.signals.finished.connect(self.on_worker_finished)
        worker.signals.error.connect(self.on_worker_error)
        worker.signals.result.connect(self.on_worker_result)
        self.threadpool.start(worker)

    def on_worker_finished(self):
        self.progress_bar.hide()

    def on_worker_error(self, err_tuple):
        duration_ms = int((time.time() - self.start_timestamp) * 1000)
        error_msg = str(err_tuple[1])
        HistoryService.log_operation(
            operation_type=self.current_op_type,
            input_files=self.current_inputs,
            output_file=self.current_output,
            status="FAILED",
            error_message=error_msg,
            duration_ms=duration_ms
        )
        QMessageBox.critical(self, "Operation Failed", error_msg)

    def on_worker_result(self, result):
        duration_ms = int((time.time() - self.start_timestamp) * 1000)
        HistoryService.log_operation(
            operation_type=self.current_op_type,
            input_files=self.current_inputs,
            output_file=self.current_output,
            status="SUCCESS",
            duration_ms=duration_ms
        )
        QMessageBox.information(self, "Success", "Operation completed successfully!")

class MergeTab(BaseAsyncTab):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()
        self.file_list = QListWidget()
        self.file_list.setSelectionMode(QAbstractItemView.ExtendedSelection)
        self.file_list.setDragDropMode(QAbstractItemView.InternalMove)
        
        layout.addWidget(QLabel("Drag and drop to reorder files:"))
        layout.addWidget(self.file_list)
        
        btn_layout = QHBoxLayout()
        add_btn = QPushButton("Add PDFs")
        add_btn.clicked.connect(self.add_files)
        remove_btn = QPushButton("Remove Selected")
        remove_btn.clicked.connect(self.remove_files)
        merge_btn = QPushButton("Merge PDFs")
        merge_btn.clicked.connect(self.merge_files)
        
        btn_layout.addWidget(add_btn)
        btn_layout.addWidget(remove_btn)
        btn_layout.addWidget(merge_btn)
        
        layout.addLayout(btn_layout)
        layout.addWidget(self.progress_bar)
        self.setLayout(layout)

    def add_files(self):
        files, _ = QFileDialog.getOpenFileNames(self, "Select PDFs", "", "PDF Files (*.pdf)")
        if files:
            for f in files:
                item = QListWidgetItem(os.path.basename(f))
                item.setData(Qt.UserRole, f)
                self.file_list.addItem(item)

    def remove_files(self):
        for item in self.file_list.selectedItems():
            self.file_list.takeItem(self.file_list.row(item))

    def merge_files(self):
        if self.file_list.count() < 2:
            QMessageBox.warning(self, "Validation Error", "Need at least 2 PDFs to merge.")
            return
        save_path, _ = QFileDialog.getSaveFileName(self, "Save Merged PDF", "merged.pdf", "PDF Files (*.pdf)")
        if save_path:
            input_files = [self.file_list.item(i).data(Qt.UserRole) for i in range(self.file_list.count())]
            self.start_worker(
                PDFMergerEngine.merge_pdfs,
                "MERGE",
                input_files,
                save_path,
                input_files,
                save_path
            )

class SplitTab(BaseAsyncTab):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()
        self.file_input = QLineEdit()
        self.file_input.setReadOnly(True)
        self.range_input = QLineEdit()
        self.range_input.setPlaceholderText("e.g. 1-3, 5-7")
        
        btn_layout = QHBoxLayout()
        sel_btn = QPushButton("Select PDF")
        sel_btn.clicked.connect(self.select_file)
        split_btn = QPushButton("Split PDF")
        split_btn.clicked.connect(self.split_file)
        
        btn_layout.addWidget(sel_btn)
        btn_layout.addWidget(split_btn)
        
        form = QFormLayout()
        form.addRow("PDF File:", self.file_input)
        form.addRow("Page Ranges:", self.range_input)
        
        layout.addLayout(form)
        layout.addLayout(btn_layout)
        layout.addWidget(self.progress_bar)
        self.setLayout(layout)

    def select_file(self):
        file, _ = QFileDialog.getOpenFileName(self, "Select PDF", "", "PDF Files (*.pdf)")
        if file:
            self.file_input.setText(file)

    def split_file(self):
        file = self.file_input.text()
        ranges_txt = self.range_input.text()
        if not file or not ranges_txt:
            QMessageBox.warning(self, "Validation Error", "Please select a file and specify page ranges.")
            return
        ranges = []
        try:
            for r in ranges_txt.split(','):
                start, end = r.split('-')
                ranges.append((int(start.strip()), int(end.strip())))
        except Exception:
            QMessageBox.warning(self, "Format Error", "Invalid range format. Use format like '1-3, 5-7'.")
            return
            
        out_dir = QFileDialog.getExistingDirectory(self, "Select Output Directory")
        if out_dir:
            self.start_worker(
                PDFSplitterEngine.split_by_ranges,
                "SPLIT",
                file,
                out_dir,
                file,
                ranges,
                out_dir
            )

class ConvertTab(BaseAsyncTab):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()
        self.file_input = QLineEdit()
        self.file_input.setReadOnly(True)
        self.format_cb = QComboBox()
        self.format_cb.addItems(["To Images (PNG)", "To Text (.txt)", "To Word (.docx)", "To Excel (.xlsx)"])
        
        btn_layout = QHBoxLayout()
        sel_btn = QPushButton("Select PDF")
        sel_btn.clicked.connect(self.select_file)
        conv_btn = QPushButton("Convert")
        conv_btn.clicked.connect(self.convert_file)
        
        btn_layout.addWidget(sel_btn)
        btn_layout.addWidget(conv_btn)
        
        form = QFormLayout()
        form.addRow("PDF File:", self.file_input)
        form.addRow("Format:", self.format_cb)
        
        layout.addLayout(form)
        layout.addLayout(btn_layout)
        layout.addWidget(self.progress_bar)
        self.setLayout(layout)

    def select_file(self):
        file, _ = QFileDialog.getOpenFileName(self, "Select PDF", "", "PDF Files (*.pdf)")
        if file:
            self.file_input.setText(file)

    def convert_file(self):
        file = self.file_input.text()
        if not file:
            QMessageBox.warning(self, "Validation Error", "Select a PDF file first.")
            return
            
        fmt = self.format_cb.currentText()
        if "Images" in fmt:
            out_dir = QFileDialog.getExistingDirectory(self, "Select Output Directory")
            if out_dir:
                self.start_worker(
                    PDFConverterEngine.pdf_to_images,
                    "CONVERT_IMAGE",
                    file,
                    out_dir,
                    file,
                    out_dir
                )
        elif "Text" in fmt:
            out, _ = QFileDialog.getSaveFileName(self, "Save Text", "extracted.txt", "Text (*.txt)")
            if out:
                self.start_worker(
                    PDFConverterEngine.extract_text,
                    "CONVERT_TEXT",
                    file,
                    out,
                    file,
                    out
                )
        elif "Word" in fmt:
            out, _ = QFileDialog.getSaveFileName(self, "Save Word Document", "converted.docx", "Word (*.docx)")
            if out:
                self.start_worker(
                    PDFConverterEngine.pdf_to_word,
                    "CONVERT_WORD",
                    file,
                    out,
                    file,
                    out
                )
        elif "Excel" in fmt:
            out, _ = QFileDialog.getSaveFileName(self, "Save Excel Spreadsheet", "tables.xlsx", "Excel (*.xlsx)")
            if out:
                self.start_worker(
                    PDFConverterEngine.pdf_to_excel,
                    "CONVERT_EXCEL",
                    file,
                    out,
                    file,
                    out
                )

class CompressTab(BaseAsyncTab):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()
        self.file_input = QLineEdit()
        self.file_input.setReadOnly(True)
        
        btn_layout = QHBoxLayout()
        sel_btn = QPushButton("Select PDF")
        sel_btn.clicked.connect(self.select_file)
        comp_btn = QPushButton("Compress PDF")
        comp_btn.clicked.connect(self.compress_file)
        
        btn_layout.addWidget(sel_btn)
        btn_layout.addWidget(comp_btn)
        
        form = QFormLayout()
        form.addRow("PDF File:", self.file_input)
        
        layout.addLayout(form)
        layout.addLayout(btn_layout)
        layout.addWidget(self.progress_bar)
        self.setLayout(layout)

    def select_file(self):
        file, _ = QFileDialog.getOpenFileName(self, "Select PDF", "", "PDF Files (*.pdf)")
        if file:
            self.file_input.setText(file)

    def compress_file(self):
        file = self.file_input.text()
        if not file:
            QMessageBox.warning(self, "Validation Error", "Select a PDF file to compress.")
            return
        out, _ = QFileDialog.getSaveFileName(self, "Save Compressed PDF", "compressed.pdf", "PDF (*.pdf)")
        if out:
            self.start_worker(
                PDFCompressorEngine.compress_pdf,
                "COMPRESS",
                file,
                out,
                file,
                out
            )

class OCRTab(BaseAsyncTab):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()
        self.file_input = QLineEdit()
        self.file_input.setReadOnly(True)
        
        btn_layout = QHBoxLayout()
        sel_btn = QPushButton("Select PDF")
        sel_btn.clicked.connect(self.select_file)
        ocr_btn = QPushButton("Run OCR")
        ocr_btn.clicked.connect(self.run_ocr)
        
        btn_layout.addWidget(sel_btn)
        btn_layout.addWidget(ocr_btn)
        
        form = QFormLayout()
        form.addRow("Scanned PDF:", self.file_input)
        
        layout.addLayout(form)
        layout.addLayout(btn_layout)
        layout.addWidget(self.progress_bar)
        self.setLayout(layout)

    def select_file(self):
        file, _ = QFileDialog.getOpenFileName(self, "Select PDF", "", "PDF Files (*.pdf)")
        if file:
            self.file_input.setText(file)

    def run_ocr(self):
        file = self.file_input.text()
        if not file:
            QMessageBox.warning(self, "Validation Error", "Select a scanned PDF file.")
            return
        out, _ = QFileDialog.getSaveFileName(self, "Save OCR Text", "ocr_result.txt", "Text (*.txt)")
        if out:
            self.start_worker(
                OCRengine.ocr_to_text,
                "OCR",
                file,
                out,
                file,
                out
            )

class SecurityTab(BaseAsyncTab):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()
        self.file_input = QLineEdit()
        self.file_input.setReadOnly(True)
        self.pw_input = QLineEdit()
        self.pw_input.setEchoMode(QLineEdit.Password)
        
        btn_layout = QHBoxLayout()
        sel_btn = QPushButton("Select PDF")
        sel_btn.clicked.connect(self.select_file)
        enc_btn = QPushButton("Encrypt (AES-256)")
        enc_btn.clicked.connect(self.encrypt_file)
        dec_btn = QPushButton("Decrypt")
        dec_btn.clicked.connect(self.decrypt_file)
        
        btn_layout.addWidget(sel_btn)
        btn_layout.addWidget(enc_btn)
        btn_layout.addWidget(dec_btn)
        
        form = QFormLayout()
        form.addRow("PDF File:", self.file_input)
        form.addRow("Password:", self.pw_input)
        
        layout.addLayout(form)
        layout.addLayout(btn_layout)
        layout.addWidget(self.progress_bar)
        self.setLayout(layout)

    def select_file(self):
        file, _ = QFileDialog.getOpenFileName(self, "Select PDF", "", "PDF Files (*.pdf)")
        if file:
            self.file_input.setText(file)

    def encrypt_file(self):
        file = self.file_input.text()
        pw = self.pw_input.text()
        if not file or not pw:
            QMessageBox.warning(self, "Validation Error", "Select a file and enter a password.")
            return
        out, _ = QFileDialog.getSaveFileName(self, "Save Encrypted PDF", "encrypted.pdf", "PDF (*.pdf)")
        if out:
            self.start_worker(
                PDFSecurityEngine.encrypt_pdf,
                "ENCRYPT",
                file,
                out,
                file,
                out,
                pw
            )

    def decrypt_file(self):
        file = self.file_input.text()
        pw = self.pw_input.text()
        if not file or not pw:
            QMessageBox.warning(self, "Validation Error", "Select an encrypted file and enter its password.")
            return
        out, _ = QFileDialog.getSaveFileName(self, "Save Decrypted PDF", "decrypted.pdf", "PDF (*.pdf)")
        if out:
            self.start_worker(
                PDFSecurityEngine.decrypt_pdf,
                "DECRYPT",
                file,
                out,
                file,
                out,
                pw
            )

class AITab(BaseAsyncTab):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()
        self.text_input = QTextEdit()
        self.text_input.setPlaceholderText("Paste extracted PDF text here...")
        
        self.result_output = QTextEdit()
        self.result_output.setReadOnly(True)
        
        btn_layout = QHBoxLayout()
        sum_btn = QPushButton("Summarize Document")
        sum_btn.clicked.connect(self.summarize)
        kw_btn = QPushButton("Extract Keywords")
        kw_btn.clicked.connect(self.extract_kw)
        
        btn_layout.addWidget(sum_btn)
        btn_layout.addWidget(kw_btn)
        
        layout.addWidget(QLabel("Input Text:"))
        layout.addWidget(self.text_input)
        layout.addLayout(btn_layout)
        layout.addWidget(self.progress_bar)
        layout.addWidget(QLabel("AI Output:"))
        layout.addWidget(self.result_output)
        self.setLayout(layout)

    def summarize(self):
        text = self.text_input.toPlainText().strip()
        if not text:
            QMessageBox.warning(self, "Input Required", "Please enter or paste text to summarize.")
            return
        self.start_worker(
            AIEngine.summarize_text,
            "AI_SUMMARY",
            "Text Buffer",
            None,
            text
        )
            
    def extract_kw(self):
        text = self.text_input.toPlainText().strip()
        if not text:
            QMessageBox.warning(self, "Input Required", "Please enter or paste text to extract keywords.")
            return
        self.start_worker(
            AIEngine.extract_keywords,
            "AI_KEYWORDS",
            "Text Buffer",
            None,
            text
        )
            
    def on_worker_result(self, result):
        super().on_worker_result(result)
        self.result_output.setPlainText(str(result))

class CloudTab(BaseAsyncTab):
    """AWS S3 Cloud Upload & Download Tab."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()

        # Upload Group
        upload_group = QGroupBox("Upload to AWS S3")
        upload_layout = QVBoxLayout()
        self.up_file_input = QLineEdit()
        self.up_file_input.setReadOnly(True)
        self.up_bucket_input = QLineEdit()
        self.up_bucket_input.setPlaceholderText("e.g. my-company-pdf-bucket")
        self.up_key_input = QLineEdit()
        self.up_key_input.setPlaceholderText("Optional S3 Object Key (e.g. docs/report.pdf)")

        up_btn_layout = QHBoxLayout()
        up_sel_btn = QPushButton("Select File")
        up_sel_btn.clicked.connect(self.select_upload_file)
        up_run_btn = QPushButton("Upload to S3")
        up_run_btn.clicked.connect(self.upload_to_s3)
        up_btn_layout.addWidget(up_sel_btn)
        up_btn_layout.addWidget(up_run_btn)

        up_form = QFormLayout()
        up_form.addRow("Local File:", self.up_file_input)
        up_form.addRow("S3 Bucket:", self.up_bucket_input)
        up_form.addRow("S3 Key:", self.up_key_input)
        upload_layout.addLayout(up_form)
        upload_layout.addLayout(up_btn_layout)
        upload_group.setLayout(upload_layout)

        # Download Group
        down_group = QGroupBox("Download from AWS S3")
        down_layout = QVBoxLayout()
        self.down_bucket_input = QLineEdit()
        self.down_bucket_input.setPlaceholderText("S3 Bucket Name")
        self.down_key_input = QLineEdit()
        self.down_key_input.setPlaceholderText("Remote Object Key in S3")

        down_btn_layout = QHBoxLayout()
        down_run_btn = QPushButton("Download from S3")
        down_run_btn.clicked.connect(self.download_from_s3)
        down_btn_layout.addWidget(down_run_btn)

        down_form = QFormLayout()
        down_form.addRow("S3 Bucket:", self.down_bucket_input)
        down_form.addRow("S3 Key:", self.down_key_input)
        down_layout.addLayout(down_form)
        down_layout.addLayout(down_btn_layout)
        down_group.setLayout(down_layout)

        layout.addWidget(upload_group)
        layout.addWidget(down_group)
        layout.addWidget(self.progress_bar)
        layout.addStretch()
        self.setLayout(layout)

        # Load default bucket if set
        default_bucket = SettingsService.get_setting("AWS_BUCKET_NAME", "")
        if default_bucket:
            self.up_bucket_input.setText(default_bucket)
            self.down_bucket_input.setText(default_bucket)

    def select_upload_file(self):
        file, _ = QFileDialog.getOpenFileName(self, "Select PDF to Upload", "", "PDF Files (*.pdf)")
        if file:
            self.up_file_input.setText(file)
            if not self.up_key_input.text():
                self.up_key_input.setText(f"uploads/{os.path.basename(file)}")

    def upload_to_s3(self):
        file = self.up_file_input.text()
        bucket = self.up_bucket_input.text().strip()
        key = self.up_key_input.text().strip() or None
        if not file or not bucket:
            QMessageBox.warning(self, "Validation Error", "Select a local file and provide an S3 bucket name.")
            return

        self.start_worker(
            CloudEngine.upload_to_s3,
            "S3_UPLOAD",
            file,
            f"s3://{bucket}/{key or os.path.basename(file)}",
            file,
            bucket,
            key
        )

    def download_from_s3(self):
        bucket = self.down_bucket_input.text().strip()
        key = self.down_key_input.text().strip()
        if not bucket or not key:
            QMessageBox.warning(self, "Validation Error", "Provide S3 bucket name and remote object key.")
            return

        out, _ = QFileDialog.getSaveFileName(self, "Save Downloaded PDF", os.path.basename(key) or "downloaded.pdf", "PDF (*.pdf)")
        if out:
            self.start_worker(
                CloudEngine.download_from_s3,
                "S3_DOWNLOAD",
                f"s3://{bucket}/{key}",
                out,
                bucket,
                key,
                out
            )

class HistoryTab(QWidget):
    """Audit History Tab showing database records of all PDF operations."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()

        # Filter bar
        top_bar = QHBoxLayout()
        top_bar.addWidget(QLabel("Filter by Operation:"))
        self.filter_cb = QComboBox()
        self.filter_cb.addItems(["ALL", "MERGE", "SPLIT", "COMPRESS", "CONVERT_IMAGE", "CONVERT_TEXT", "CONVERT_WORD", "CONVERT_EXCEL", "OCR", "ENCRYPT", "DECRYPT", "S3_UPLOAD", "S3_DOWNLOAD"])
        self.filter_cb.currentTextChanged.connect(self.load_history)
        top_bar.addWidget(self.filter_cb)
        top_bar.addStretch()

        refresh_btn = QPushButton("Refresh")
        refresh_btn.clicked.connect(self.load_history)
        top_bar.addWidget(refresh_btn)

        clear_btn = QPushButton("Clear History")
        clear_btn.clicked.connect(self.clear_history)
        top_bar.addWidget(clear_btn)

        layout.addLayout(top_bar)

        # Table
        self.table = QTableWidget()
        self.table.setColumnCount(7)
        self.table.setHorizontalHeaderLabels([
            "ID", "Timestamp", "Operation", "Status", "Input Source", "Output File", "Duration (ms)"
        ])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(4, QHeaderView.Stretch)
        self.table.horizontalHeader().setSectionResizeMode(5, QHeaderView.Stretch)
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)

        layout.addWidget(self.table)

        # Action Buttons
        btn_bar = QHBoxLayout()
        open_file_btn = QPushButton("Open Selected Output File")
        open_file_btn.clicked.connect(self.open_selected_file)
        open_folder_btn = QPushButton("Open Containing Folder")
        open_folder_btn.clicked.connect(self.open_selected_folder)

        btn_bar.addWidget(open_file_btn)
        btn_bar.addWidget(open_folder_btn)
        btn_bar.addStretch()

        layout.addLayout(btn_bar)
        self.setLayout(layout)
        self.load_history()

    def load_history(self):
        op_filter = self.filter_cb.currentText()
        records = HistoryService.get_history(limit=200, op_type=op_filter)
        self.table.setRowCount(len(records))

        for row, rec in enumerate(records):
            self.table.setItem(row, 0, QTableWidgetItem(str(rec["id"])))
            self.table.setItem(row, 1, QTableWidgetItem(str(rec["created_at"])))
            self.table.setItem(row, 2, QTableWidgetItem(str(rec["operation_type"])))
            
            status_item = QTableWidgetItem(str(rec["status"]))
            if rec["status"] == "SUCCESS":
                status_item.setForeground(Qt.green)
            else:
                status_item.setForeground(Qt.red)
            self.table.setItem(row, 3, status_item)

            self.table.setItem(row, 4, QTableWidgetItem(str(rec["input_files"])))
            self.table.setItem(row, 5, QTableWidgetItem(str(rec["output_file"])))
            self.table.setItem(row, 6, QTableWidgetItem(str(rec["duration_ms"])))

    def clear_history(self):
        reply = QMessageBox.question(
            self, "Confirm Clear", "Are you sure you want to clear all operation history?",
            QMessageBox.Yes | QMessageBox.No
        )
        if reply == QMessageBox.Yes:
            HistoryService.clear_history()
            self.load_history()

    def open_selected_file(self):
        row = self.table.currentRow()
        if row < 0:
            QMessageBox.warning(self, "Selection Required", "Please select a row first.")
            return
        path = self.table.item(row, 5).text()
        if path and os.path.exists(path):
            QDesktopServices.openUrl(QUrl.fromLocalFile(path))
        else:
            QMessageBox.warning(self, "File Not Found", f"The output file does not exist on disk: {path}")

    def open_selected_folder(self):
        row = self.table.currentRow()
        if row < 0:
            QMessageBox.warning(self, "Selection Required", "Please select a row first.")
            return
        path = self.table.item(row, 5).text()
        if path and os.path.exists(path):
            folder = path if os.path.isdir(path) else os.path.dirname(path)
            QDesktopServices.openUrl(QUrl.fromLocalFile(folder))
        else:
            QMessageBox.warning(self, "Folder Not Found", "Output path does not exist.")

class SettingsTab(QWidget):
    """Settings & API Credentials Tab."""
    def __init__(self, main_window):
        super().__init__()
        self.main_window = main_window
        layout = QVBoxLayout()

        form = QFormLayout()

        # OpenAI Key
        self.openai_input = QLineEdit()
        self.openai_input.setEchoMode(QLineEdit.Password)
        self.openai_input.setPlaceholderText("sk-...")
        form.addRow("OpenAI API Key:", self.openai_input)

        # AWS Credentials
        self.aws_key_input = QLineEdit()
        self.aws_key_input.setPlaceholderText("AKIA...")
        form.addRow("AWS Access Key ID:", self.aws_key_input)

        self.aws_secret_input = QLineEdit()
        self.aws_secret_input.setEchoMode(QLineEdit.Password)
        self.aws_secret_input.setPlaceholderText("AWS Secret Access Key")
        form.addRow("AWS Secret Key:", self.aws_secret_input)

        self.aws_region_input = QLineEdit()
        self.aws_region_input.setPlaceholderText("us-east-1")
        form.addRow("AWS Region:", self.aws_region_input)

        self.aws_bucket_input = QLineEdit()
        self.aws_bucket_input.setPlaceholderText("Default S3 Bucket Name")
        form.addRow("AWS S3 Bucket:", self.aws_bucket_input)

        # Theme selector
        self.theme_cb = QComboBox()
        self.theme_cb.addItems(["Dark (Catppuccin)", "Light (Corporate)"])
        form.addRow("Application Theme:", self.theme_cb)

        # Database info display
        db_info = QLabel(settings.DATABASE_URL)
        db_info.setStyleSheet("color: #89b4fa; font-weight: bold;")
        form.addRow("Database Connection:", db_info)

        app_ver = QLabel(f"{settings.APP_NAME} v{settings.APP_VERSION}")
        form.addRow("Suite Version:", app_ver)

        layout.addLayout(form)

        save_btn = QPushButton("Save Settings")
        save_btn.clicked.connect(self.save_settings)
        layout.addWidget(save_btn)
        layout.addStretch()

        self.setLayout(layout)
        self.load_settings()

    def load_settings(self):
        all_s = SettingsService.get_all_settings()
        self.openai_input.setText(all_s.get("OPENAI_API_KEY", ""))
        self.aws_key_input.setText(all_s.get("AWS_ACCESS_KEY_ID", ""))
        self.aws_secret_input.setText(all_s.get("AWS_SECRET_ACCESS_KEY", ""))
        self.aws_region_input.setText(all_s.get("AWS_DEFAULT_REGION", "us-east-1"))
        self.aws_bucket_input.setText(all_s.get("AWS_BUCKET_NAME", ""))

        current_theme = all_s.get("THEME", "dark")
        self.theme_cb.setCurrentIndex(1 if current_theme == "light" else 0)

    def save_settings(self):
        SettingsService.set_setting("OPENAI_API_KEY", self.openai_input.text().strip())
        SettingsService.set_setting("AWS_ACCESS_KEY_ID", self.aws_key_input.text().strip())
        SettingsService.set_setting("AWS_SECRET_ACCESS_KEY", self.aws_secret_input.text().strip())
        SettingsService.set_setting("AWS_DEFAULT_REGION", self.aws_region_input.text().strip() or "us-east-1")
        SettingsService.set_setting("AWS_BUCKET_NAME", self.aws_bucket_input.text().strip())

        new_theme = "light" if "Light" in self.theme_cb.currentText() else "dark"
        SettingsService.set_setting("THEME", new_theme)
        
        # Apply theme immediately
        app = QApplication.instance()
        if app:
            app.setStyleSheet(ThemeManager.get_theme(new_theme))

        QMessageBox.information(self, "Saved", "Settings and credentials saved successfully!")

class ViewerTab(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout()
        self.viewer = PDFViewerWidget()
        
        controls = QHBoxLayout()
        open_btn = QPushButton("Open PDF File")
        open_btn.clicked.connect(self.open_pdf)
        controls.addWidget(open_btn)
        controls.addStretch()
        
        layout.addLayout(controls)
        layout.addWidget(self.viewer)
        self.setLayout(layout)
        
    def open_pdf(self):
        file, _ = QFileDialog.getOpenFileName(self, "Open PDF", "", "PDF Files (*.pdf)")
        if file:
            self.viewer.load_pdf(file)

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle(f"{settings.APP_NAME} - 100% Production Edition")
        self.resize(1240, 820)
        
        self.tabs = QTabWidget()
        
        # Register all functional modules
        self.tabs.addTab(ViewerTab(), "Live Viewer")
        self.tabs.addTab(MergeTab(), "Merge PDFs")
        self.tabs.addTab(SplitTab(), "Split PDF")
        self.tabs.addTab(ConvertTab(), "Convert PDF")
        self.tabs.addTab(CompressTab(), "Compress PDF")
        self.tabs.addTab(OCRTab(), "OCR Scanned")
        self.tabs.addTab(SecurityTab(), "Security")
        self.tabs.addTab(AITab(), "AI Features")
        self.tabs.addTab(CloudTab(), "Cloud S3")
        self.tabs.addTab(HistoryTab(), "Operation History")
        self.tabs.addTab(SettingsTab(self), "Settings")
        
        self.setCentralWidget(self.tabs)
