
from PIL import Image
import sys

def remove_background(input_path, output_path, tolerance=30):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()
        
        # Get background color from top-left pixel
        bg_color = datas[0]
        
        newData = []
        for item in datas:
            # Check if pixel is close to background color
            if (abs(item[0] - bg_color[0]) < tolerance and 
                abs(item[1] - bg_color[1]) < tolerance and 
                abs(item[2] - bg_color[2]) < tolerance):
                newData.append((255, 255, 255, 0)) # Transparent
            else:
                newData.append(item)
        
        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Successfully saved transparent image to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 2:
        remove_background(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python3 remove_bg.py <input> <output>")
