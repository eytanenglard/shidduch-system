import os
import sys

def generate_directory_structure_map(folder_path):
    # Normalize the folder path to an absolute path
    # This handles cases like '.' or '..' and ensures consistency
    try:
        abs_folder_path = os.path.abspath(folder_path)
    except TypeError:
        print(f"Error: Invalid folder path provided: {folder_path}")
        return

    # Check if the provided path is a valid directory
    if not os.path.isdir(abs_folder_path):
        print(f"Error: The path '{abs_folder_path}' is not a valid directory or does not exist.")
        return

    # Get the base name of the folder to include in the output file's name
    folder_basename = os.path.basename(abs_folder_path)
    if not folder_basename: # Handles case where path is root like "C:\"
        folder_basename = "root_directory"


    # Define the name and full path for the output map file
    # It will be saved inside the target directory
    output_filename = f"directory_map_of_{folder_basename.replace(' ', '_').lower()}.txt"
    output_filepath = os.path.join(abs_folder_path, output_filename)

    map_lines = []

    # Header for the map file
    map_lines.append(f"Directory Map for: {abs_folder_path}")
    map_lines.append("=" * (len(abs_folder_path) + 20)) # Decorative line
    map_lines.append("") # Empty line for spacing

    # os.walk generates the file names in a directory tree by walking the tree
    # either top-down or bottom-up.
    for current_root, directories, files in os.walk(abs_folder_path, topdown=True):
        # Calculate the current depth level relative to the initial folder_path
        # This is used for indentation to show hierarchy
        # relpath gives path relative to abs_folder_path. If current_root is abs_folder_path, relpath is '.'
        relative_path = os.path.relpath(current_root, abs_folder_path)
        if relative_path == '.':
            level = 0
        else:
            level = relative_path.count(os.sep) + 1

        indent = "    " * level # 4 spaces per indentation level

        # Add the current directory being processed to the map
        # For the very first root, display its name without extra indent
        if level == 0:
            map_lines.append(f"{os.path.basename(current_root)}/")
        else:
            map_lines.append(f"{indent[:-4]}{'└── ' if level > 0 else ''}{os.path.basename(current_root)}/")

        sub_indent = "    " * (level + 1) # Indentation for files and sub-dirs within this dir

        # List files in the current directory
        # Sort files for consistent order
        files.sort()
        for i, filename in enumerate(files):
            # Important: Do not list the map file itself if it's in the current directory
            if os.path.join(current_root, filename) == output_filepath:
                continue

            full_file_path = os.path.abspath(os.path.join(current_root, filename))
            prefix = "└── " if i == (len(files) - 1 + (len(directories) if current_root == abs_folder_path else 0)) else "├── " # Check if last item overall
            map_lines.append(f"{sub_indent}{prefix}{filename}  (Full Path: {full_file_path})")


    # Write the collected map lines to the output file
    try:
        with open(output_filepath, 'w', encoding='utf-8') as map_file:
            for line in map_lines:
                map_file.write(line + "\n")
        print(f"\nSuccessfully created directory map: {output_filepath}")
    except IOError as e:
        print(f"Error: Could not write to file {output_filepath}. Reason: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# This block ensures the code runs only when the script is executed directly
# (not when imported as a module)
if __name__ == "__main__":
    # Get the folder URL (path) from the user
    if len(sys.argv) > 1:
        target_folder_url = sys.argv[1]
        print(f"Processing folder from command line argument: {target_folder_url}")
    else:
        target_folder_url = input("Please enter the URL (local path) of the folder to map: ")

    generate_directory_structure_map(target_folder_url)