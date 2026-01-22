
from PIL import Image, ImageDraw
import sys

def add_rounded_corners(input_path, output_path, radius=60):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        # Create a mask of the same size
        mask = Image.new('L', img.size, 0)
        draw = ImageDraw.Draw(mask)
        
        # Draw a rounded rectangle on the mask
        draw.rounded_rectangle([(0, 0), img.size], radius=radius, fill=255)
        
        # Apply the mask to the image
        result = Image.new('RGBA', img.size)
        result.paste(img, (0, 0), mask=mask)
        
        result.save(output_path, "PNG")
        print(f"Successfully saved rounded image to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 2:
        radius = int(sys.argv[3]) if len(sys.argv) > 3 else 60
        add_rounded_corners(sys.argv[1], sys.argv[2], radius)
    else:
        print("Usage: python3 add_rounded_corners.py <input> <output> [radius]")
