import os
import sys

def generate_directory_structure_map(folder_path):
    # Normalize the folder path to an absolute path
    try:
        abs_folder_path = os.path.abspath(folder_path)
    except TypeError:
        print(f"Error: Invalid folder path provided: {folder_path}")
        return

    # Check if the provided path is a valid directory
    if not os.path.isdir(abs_folder_path):
        print(f"Error: The path '{abs_folder_path}' is not a valid directory or does not exist.")
        return

    folder_basename = os.path.basename(abs_folder_path)
    if not folder_basename:
        folder_basename = "root_directory"

    output_filename = f"directory_map_of_{folder_basename.replace(' ', '_').lower()}.txt"
    output_filepath = os.path.join(abs_folder_path, output_filename)

    map_lines = []

    map_lines.append(f"Directory Map for: {abs_folder_path}")
    map_lines.append("=" * (len(abs_folder_path) + 20))
    map_lines.append("")

    for current_root, directories, files in os.walk(abs_folder_path, topdown=True):
        
        # --- SHIFTED LOGIC: Handle node_modules ---
        # We define a list for folders we want to SHOW but NOT ENTER
        ignored_dirs_to_display = []
        
        if 'node_modules' in directories:
            # Remove from 'directories' so os.walk does NOT go inside
            directories.remove('node_modules')
            # Add to our local list so we DO print it in the map
            ignored_dirs_to_display.append('node_modules')
        # ------------------------------------------

        relative_path = os.path.relpath(current_root, abs_folder_path)
        if relative_path == '.':
            level = 0
        else:
            level = relative_path.count(os.sep) + 1

        indent = "    " * level 

        if level == 0:
            map_lines.append(f"{os.path.basename(current_root)}/")
        else:
            map_lines.append(f"{indent[:-4]}{'└── ' if level > 0 else ''}{os.path.basename(current_root)}/")

        sub_indent = "    " * (level + 1)

        # Merge files and the ignored directories (like node_modules) for display purposes
        # This ensures node_modules appears alphabetically alongside files
        all_items = files + ignored_dirs_to_display
        all_items.sort()
        
        for i, item_name in enumerate(all_items):
            # Skip the output file itself
            if os.path.join(current_root, item_name) == output_filepath:
                continue
            
            # Determine prefix (├── or └──)
            # Check if this is the last item in the list AND there are no sub-directories remaining to traverse
            is_last_item = (i == len(all_items) - 1) and (not directories)
            prefix = "└── " if is_last_item else "├── "
            
            # Special formatting for node_modules
            if item_name == 'node_modules':
                 map_lines.append(f"{sub_indent}{prefix}node_modules/ [Content Ignored]")
            else:
                # Normal file processing
                full_file_path = os.path.abspath(os.path.join(current_root, item_name))
                map_lines.append(f"{sub_indent}{prefix}{item_name}  (Full Path: {full_file_path})")

    try:
        with open(output_filepath, 'w', encoding='utf-8') as map_file:
            for line in map_lines:
                map_file.write(line + "\n")
        print(f"\nSuccessfully created directory map: {output_filepath}")
        print("Note: 'node_modules' folders are listed but their contents were ignored.")
    except IOError as e:
        print(f"Error: Could not write to file {output_filepath}. Reason: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_folder_url = sys.argv[1]
        print(f"Processing folder from command line argument: {target_folder_url}")
    else:
        target_folder_url = input("Please enter the URL (local path) of the folder to map: ")

    generate_directory_structure_map(target_folder_url)