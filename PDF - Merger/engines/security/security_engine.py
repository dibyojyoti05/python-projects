import fitz
import os

class PDFSecurityEngine:
    """Engine for encrypting, decrypting, and applying permissions to PDFs."""

    @staticmethod
    def encrypt_pdf(input_file: str, output_file: str, user_pw: str, owner_pw: str = None) -> bool:
        """
        Encrypt a PDF with a user and owner password.
        """
        if not os.path.exists(input_file):
            raise FileNotFoundError("Input file not found.")
            
        try:
            doc = fitz.open(input_file)
            
            # If owner_pw is not provided, use user_pw
            owner_pw = owner_pw if owner_pw else user_pw
            
            # Permissions: by default restrict everything except printing
            perm = int(
                fitz.PDF_PERM_PRINT | fitz.PDF_PERM_ACCESSIBILITY
            )
            
            doc.save(
                output_file, 
                encryption=fitz.PDF_ENCRYPT_AES_256, 
                owner_pw=owner_pw, 
                user_pw=user_pw, 
                permissions=perm
            )
            doc.close()
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to encrypt PDF: {e}")

    @staticmethod
    def decrypt_pdf(input_file: str, output_file: str, password: str) -> bool:
        """
        Decrypt a PDF if the correct password is provided.
        """
        if not os.path.exists(input_file):
            raise FileNotFoundError("Input file not found.")
            
        try:
            doc = fitz.open(input_file)
            if doc.needs_pass:
                if not doc.authenticate(password):
                    raise ValueError("Incorrect password provided.")
            
            # Save without encryption
            doc.save(output_file)
            doc.close()
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to decrypt PDF: {e}")
