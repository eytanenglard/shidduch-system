import os
import datetime

def map_directory_to_file(root_dir_param):
    """
    Maps the contents of a directory (and its subdirectories) to a single text file.
    The output file is saved within the mapped directory.
    """
    # 1. Validate input path and convert to absolute path
    if not os.path.isdir(root_dir_param):
        print(f"Error: The path '{root_dir_param}' is not a valid directory or does not exist.")
        return

    abs_root_dir = os.path.abspath(root_dir_param)
    folder_name = os.path.basename(abs_root_dir)
    
    # 2. Determine output file name and path
    # Output file name includes the mapped folder's name
    output_filename = f"{folder_name}_contents.txt"
    # Output file is saved inside the mapped folder
    output_filepath = os.path.join(abs_root_dir, output_filename)

    # Convert to absolute path for reliable comparison later, to avoid reading the output file itself
    abs_output_filepath = os.path.abspath(output_filepath)

    try:
        with open(output_filepath, 'w', encoding='utf-8') as outfile:
            # Write a header to the output file
            outfile.write(f"################################################################################\n")
            outfile.write(f"# Directory Content Map For: {abs_root_dir}\n")
            outfile.write(f"# Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            outfile.write(f"################################################################################\n\n")

            # os.walk traverses the directory tree
            for current_dir_path, dir_names, file_names in os.walk(abs_root_dir, topdown=True):
                # Sort directory and file names for consistent output
                dir_names.sort()
                file_names.sort()

                # Section for the current directory being processed
                outfile.write(f"================================================================================\n")
                outfile.write(f"Directory: {current_dir_path}\n")
                outfile.write(f"================================================================================\n\n")

                if not file_names and not dir_names:
                    outfile.write("(This directory is empty.)\n\n")
                elif not file_names and dir_names: # Current directory only contains subdirectories
                    outfile.write("(This directory contains subdirectories but no files directly. See subdirectories below.)\n\n")


                # Process files in the current directory
                for file_name in file_names:
                    file_abs_path = os.path.join(current_dir_path, file_name)

                    # CRITICAL: Skip the output file itself to prevent recursion or reading partial data
                    if file_abs_path == abs_output_filepath:
                        outfile.write(f"--------------------------------------------------------------------------------\n")
                        outfile.write(f"File: {file_abs_path}\n")
                        outfile.write(f"--------------------------------------------------------------------------------\n")
                        outfile.write("[This is the output log file itself. Content not included.]\n\n")
                        continue
                    
                    # Write the full path of the file (as requested: "at the beginning of each file")
                    outfile.write(f"--------------------------------------------------------------------------------\n")
                    outfile.write(f"File: {file_abs_path}\n")
                    outfile.write(f"--------------------------------------------------------------------------------\n")
                    
                    try:
                        # Attempt to read the file content as text
                        with open(file_abs_path, 'r', encoding='utf-8') as infile:
                            content = infile.read()
                        
                        outfile.write("Content:\n")
                        outfile.write(content)
                        
                        # Ensure there's a newline if file doesn't end with one, before our separator
                        if content and not content.endswith('\n'):
                            outfile.write("\n")
                        outfile.write(f"--- End of Content for {os.path.basename(file_abs_path)} ---\n\n")

                    except UnicodeDecodeError:
                        outfile.write("[Content: This is likely a binary file or uses an encoding other than UTF-8. Content not displayed as text.]\n\n")
                    except IOError as e: # For permission errors, file not found (less likely here), etc.
                        outfile.write(f"[Content: Could not read file. Error: {e}]\n\n")
                    except Exception as e: # Catch-all for other unexpected errors during file read
                        outfile.write(f"[Content: An unexpected error occurred while reading file: {e}]\n\n")
                
                # If there were files or directories, add a small visual break before the next directory block
                # (The next directory's header will serve this purpose well)

        print(f"Successfully mapped directory '{abs_root_dir}'.")
        print(f"Output saved to: {output_filepath}")

    except IOError as e:
        print(f"Error: Could not write to output file '{output_filepath}'. OS Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    # All user-facing prompts and messages are in English
    target_directory = input("Enter the directory path to map: ")
    map_directory_to_file(target_directory)