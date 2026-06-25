import os
import barcode
from barcode.writer import ImageWriter

codes = [
    "22AG1A05B5", "22AG1A05C2", "22AG1A05D7", "22AG1A05E3", "22AG1A05F1",
    "22AG1A05G6", "22AG1A05H9", "22AG1A05J5", "22AG1A05K8", "22AG1A05L4",
    "22AG1A05M2", "22AG1A05N9", "22AG1A05P7", "22AG1A05Q3", "22AG1A05R6",
    "22AG1A05S5", "22AG1A05T1", "22AG1A05U8", "22AG1A05V4", "22AG1A05W3",
    "22AG1A05X7", "22AG1A05Y1", "22AG1A05Z6", "22AG1A0603", "22AG1A0609",
    "22AG1A0614", "22AG1A0618", "22AG1A0620", "22AG1A0626", "22AG1A0631",
    "22AG1A0635", "22AG1A0642", "22AG1A0648", "22AG1A0654", "22AG1A0658",
    "22AG1A0662", "22AG1A0666", "22AG1A0670", "22AG1A0675", "22AG1A0679",
]

# Use Code128 barcode format (supports alphanumeric data)
barcode_class = barcode.get_barcode_class('code128')

output_dir = r"C:\ROHIT\Clg Projects\malpracticeDetection\generate_barcodes"
os.makedirs(output_dir, exist_ok=True)

for code in codes:
    barcode_obj = barcode_class(code, writer=ImageWriter())
    filename = os.path.join(output_dir, code)
    barcode_obj.save(filename)
    print(f"Saved barcode for {code} as {filename}.png")

print(f"\nAll barcodes saved to: {output_dir}")