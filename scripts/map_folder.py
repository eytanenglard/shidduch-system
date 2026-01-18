import os
import datetime

# רשימת הסיומות המותרות - קבצים עם סיומות אלו יועתקו עם התוכן שלהם.
# כל שאר הקבצים יופיעו רק עם השם שלהם.
ALLOWED_EXTENSIONS = {
    '.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.less',
    '.json', '.java', '.c', '.cpp', '.h', '.cs', '.php', '.rb', '.go',
    '.rs', '.swift', '.kt', '.sql', '.xml', '.yaml', '.yml', '.sh', '.bat', '.md',
    '.txt', '.ini', '.cfg', '.conf'
}

def map_directory_to_file(root_dir_param):
    """
    Maps the contents of a directory (and its subdirectories) to a single text file.
    The output file is saved within the mapped directory.
    Only content of files with allowed extensions will be included.
    """
    # 1. Validate input path and convert to absolute path
    if not os.path.isdir(root_dir_param):
        print(f"Error: The path '{root_dir_param}' is not a valid directory or does not exist.")
        return

    abs_root_dir = os.path.abspath(root_dir_param)
    folder_name = os.path.basename(abs_root_dir)
    
    # 2. Determine output file name and path
    output_filename = f"{folder_name}_contents.txt"
    output_filepath = os.path.join(abs_root_dir, output_filename)

    # Convert to absolute path for reliable comparison later
    abs_output_filepath = os.path.abspath(output_filepath)

    try:
        with open(output_filepath, 'w', encoding='utf-8') as outfile:
            # Write a header to the output file
            outfile.write(f"################################################################################\n")
            outfile.write(f"# Directory Content Map For: {abs_root_dir}\n")
            outfile.write(f"# Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            outfile.write(f"# Filter: Only content of code files ({', '.join(sorted(list(ALLOWED_EXTENSIONS)))}) is included.\n")
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
                elif not file_names and dir_names:
                    outfile.write("(This directory contains subdirectories but no files directly. See subdirectories below.)\n\n")

                # Process files in the current directory
                for file_name in file_names:
                    file_abs_path = os.path.join(current_dir_path, file_name)

                    # CRITICAL: Skip the output file itself
                    if file_abs_path == abs_output_filepath:
                        outfile.write(f"--------------------------------------------------------------------------------\n")
                        outfile.write(f"File: {file_abs_path}\n")
                        outfile.write(f"--------------------------------------------------------------------------------\n")
                        outfile.write("[This is the output log file itself. Content not included.]\n\n")
                        continue
                    
                    # Write the full path of the file
                    outfile.write(f"--------------------------------------------------------------------------------\n")
                    outfile.write(f"File: {file_abs_path}\n")
                    outfile.write(f"--------------------------------------------------------------------------------\n")
                    
                    # Check file extension
                    _, file_extension = os.path.splitext(file_name)
                    
                    # אם הסיומת היא אחת מהמותרות (קוד) - נקרא את התוכן
                    if file_extension.lower() in ALLOWED_EXTENSIONS:
                        try:
                            # Attempt to read the file content as text
                            with open(file_abs_path, 'r', encoding='utf-8') as infile:
                                content = infile.read()
                            
                            outfile.write("Content:\n")
                            outfile.write(content)
                            
                            # Ensure there's a newline if file doesn't end with one
                            if content and not content.endswith('\n'):
                                outfile.write("\n")
                            outfile.write(f"--- End of Content for {os.path.basename(file_abs_path)} ---\n\n")

                        except UnicodeDecodeError:
                            outfile.write("[Content: This is likely a binary file or uses an encoding other than UTF-8. Content not displayed as text.]\n\n")
                        except IOError as e: 
                            outfile.write(f"[Content: Could not read file. Error: {e}]\n\n")
                        except Exception as e: 
                            outfile.write(f"[Content: An unexpected error occurred while reading file: {e}]\n\n")
                    
                    # אם זו לא סיומת של קוד - מדלגים על התוכן
                    else:
                        outfile.write(f"[Content skipped: File extension '{file_extension}' is not in the allowed code list.]\n\n")

        print(f"Successfully mapped directory '{abs_root_dir}'.")
        print(f"Output saved to: {output_filepath}")

    except IOError as e:
        print(f"Error: Could not write to output file '{output_filepath}'. OS Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    target_directory = input("Enter the directory path to map: ")
    map_directory_to_file(target_directory)