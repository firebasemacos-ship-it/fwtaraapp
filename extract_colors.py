
from PIL import Image
from collections import Counter
import sys

def get_dominant_colors(image_path, num_colors=20):
    try:
        image = Image.open(image_path)
        image = image.convert('RGB')
        # Resize but keep somewhat large to preserve thin lines
        image.thumbnail((500, 500)) 
        pixels = list(image.getdata())
        
        # Filter out dark background and pure white to find the Gold
        filtered_pixels = []
        for r, g, b in pixels:
            brightness = (r + g + b) / 3
            # Filter matches: Dark (<50 brightness) or Near White (>240 brightness)
            if 60 < brightness < 230:
                filtered_pixels.append((r, g, b))

        if not filtered_pixels:
            print("No colors found after filtering.")
            return

        counts = Counter(filtered_pixels)
        dominant = counts.most_common(num_colors)
        
        print("Dominant Filtered colors (RGB):")
        for color, count in dominant:
            print(f"RGB: {color}, Hex: #{color[0]:02x}{color[1]:02x}{color[2]:02x} (Count: {count})")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        get_dominant_colors(sys.argv[1])
    else:
        print("Usage: python3 extract_colors.py <image_path>")
