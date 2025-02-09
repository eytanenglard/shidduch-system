import os 
from datetime import datetime

# הגדרת הנתיב הקבוע
FIXED_DIRECTORY_PATH = r"C:\Users\eytan\Desktop\שידוכים\shidduch-system\src"

def scan_directory(directory_path):
    """
    Scan a directory and save its structure and file contents to a report file
    
    Args:
        directory_path (str): Path to the directory to scan
    """
    try:
        # Create output file name with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = os.path.join(directory_path, f"directory_scan_{timestamp}.txt")
        
        with open(output_file, 'w', encoding='utf-8') as report:
            # Write directory structure
            report.write("=== Directory Structure ===\n\n")
            for root, dirs, files in os.walk(directory_path):
                # Calculate the current level for indentation
                level = root.replace(directory_path, '').count(os.sep)
                indent = '  ' * level
                
                # Write current directory
                folder_name = os.path.basename(root) or os.path.basename(directory_path)
                report.write(f"{indent}[{folder_name}]\n")
                
                # Write files in current directory
                sub_indent = '  ' * (level + 1)
                for file in files:
                    report.write(f"{sub_indent}{file}\n")
            
            # Write contents of each file
            report.write("\n=== File Contents ===\n")
            for root, dirs, files in os.walk(directory_path):
                for file in files:
                    # Skip the report file itself if it shows up
                    if file == os.path.basename(output_file):
                        continue
                        
                    file_path = os.path.join(root, file)
                    report.write(f"\n--- Content of {file_path} ---\n")
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            report.write(content + "\n")
                    except Exception as e:
                        report.write(f"Could not read file: {str(e)}\n")
        
        print(f"Scan complete! Results saved to: {output_file}")
                    
    except Exception as e:
        print(f"Error during scanning: {str(e)}")

def main():
    if os.path.isdir(FIXED_DIRECTORY_PATH):
        scan_directory(FIXED_DIRECTORY_PATH)
    else:
        print(f"Error: The directory {FIXED_DIRECTORY_PATH} does not exist.")

if __name__ == "__main__":
    main()