import io
from typing import Optional, Tuple
import qrcode
from qrcode.constants import ERROR_CORRECT_H, ERROR_CORRECT_M
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer, SquareModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
import qrcode.image.svg
from PIL import Image

class QRGeneratorService:
    @staticmethod
    def generate_png(
        url: str,
        fg_color: str = "#000000",
        bg_color: str = "#ffffff",
        logo_bytes: Optional[bytes] = None,
        rounded: bool = False
    ) -> bytes:
        qr = qrcode.QRCode(
            version=4, # Starts at 4, scales up automatically if url is long
            error_correction=ERROR_CORRECT_H if logo_bytes else ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Convert hex colors to RGB tuples
        def hex_to_rgb(hex_code: str) -> Tuple[int, int, int]:
            hex_clean = hex_code.lstrip('#')
            if len(hex_clean) != 6:
                return (0, 0, 0)
            return (
                int(hex_clean[0:2], 16),
                int(hex_clean[2:4], 16),
                int(hex_clean[4:6], 16)
            )

        fg_rgb = hex_to_rgb(fg_color)
        bg_rgb = hex_to_rgb(bg_color)
        
        module_drawer = RoundedModuleDrawer() if rounded else SquareModuleDrawer()

        if logo_bytes:
            # We need to process the logo
            logo_img = Image.open(io.BytesIO(logo_bytes))
            # Image factory parameters
            img = qr.make_image(
                image_factory=StyledPilImage,
                module_drawer=module_drawer,
                color_mask=SolidFillColorMask(front_color=fg_rgb, back_color=bg_rgb),
                embeded_image_path=io.BytesIO(logo_bytes)
            )
        else:
            img = qr.make_image(
                image_factory=StyledPilImage,
                module_drawer=module_drawer,
                color_mask=SolidFillColorMask(front_color=fg_rgb, back_color=bg_rgb)
            )

        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        return img_byte_arr.getvalue()

    @staticmethod
    def generate_svg(url: str, fg_color: str = "#000000", bg_color: str = "#ffffff") -> bytes:
        # Note: SVG generation in pure qrcode library doesn't easily support centered logos via Pillow,
        # so this is a simplified SVG generator.
        factory = qrcode.image.svg.SvgPathImage
        qr = qrcode.QRCode(
            version=1,
            error_correction=ERROR_CORRECT_M,
            box_size=10,
            border=4,
            image_factory=factory
        )
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image()
        
        # Modify the XML string manually to inject colors if needed, but for now return base SVG.
        # Alternatively, let's just let it return default SVG which is scalable.
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr)
        return img_byte_arr.getvalue()
