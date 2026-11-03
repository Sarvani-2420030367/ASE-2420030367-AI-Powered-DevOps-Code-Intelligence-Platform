import os
import zipfile
from typing import Tuple

MAX_ZIP_SIZE = 50 * 1024 * 1024       # 50MB uploaded zip limit
MAX_EXTRACTED_SIZE = 200 * 1024 * 1024 # 200MB uncompressed limit
MAX_FILE_COUNT = 5000                  # Max file count to prevent zip bombs

def safe_extract_zip(zip_path: str, extract_to: str) -> Tuple[bool, str, int]:
    """
    Safely extracts a ZIP archive preventing path traversal (Zip Slip vulnerability),
    zip bombs, and deeply nested directories.
    Returns: (success: bool, error_message: str, extracted_file_count: int)
    """
    if not os.path.exists(zip_path):
        return False, "ZIP file does not exist", 0

    if os.path.getsize(zip_path) > MAX_ZIP_SIZE:
        return False, f"ZIP file exceeds maximum allowed size of {MAX_ZIP_SIZE // (1024 * 1024)}MB", 0

    extract_to = os.path.abspath(extract_to)
    os.makedirs(extract_to, exist_ok=True)

    total_extracted_size = 0
    file_count = 0

    try:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            infolist = zf.infolist()
            if len(infolist) > MAX_FILE_COUNT:
                return False, f"ZIP contains {len(infolist)} files, exceeding limit of {MAX_FILE_COUNT}", 0

            for member in infolist:
                # Prevent path traversal (e.g., ../../evil.txt or absolute paths)
                target_path = os.path.abspath(os.path.join(extract_to, member.filename))
                
                # Check target_path is strictly inside extract_to
                if not (target_path == extract_to or target_path.startswith(extract_to + os.sep)):
                    return False, f"Attempted path traversal detected in file: {member.filename}", 0

                # Check uncompressed size
                total_extracted_size += member.file_size
                if total_extracted_size > MAX_EXTRACTED_SIZE:
                    return False, "Extracted content exceeds maximum uncompressed size limit", 0

                # Extract safely
                zf.extract(member, extract_to)
                if not member.is_dir():
                    file_count += 1

        return True, "", file_count
    except zipfile.BadZipFile:
        return False, "Uploaded file is not a valid or readable ZIP archive", 0
    except Exception as e:
        return False, f"Failed to extract ZIP: {str(e)}", 0
