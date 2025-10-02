#!/bin/bash

# Convert ChatGPT images to WebP format
# Usage: ./scripts/convert-chatgpt-images.sh [input_file] [output_name]
# If no arguments provided, converts all ChatGPT images in current directory

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed. Please install it first:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    exit 1
fi

# Function to convert a single image
convert_image() {
    local input="$1"
    local output_name="$2"

    if [ ! -f "$input" ]; then
        echo "Error: File '$input' not found"
        return 1
    fi

    # If no output name provided, generate one from input filename
    if [ -z "$output_name" ]; then
        # Remove "ChatGPT Image " prefix and date/time, convert to lowercase, replace spaces with hyphens
        output_name=$(basename "$input" .png | \
                     sed 's/ChatGPT Image //' | \
                     sed 's/, [0-9]\{4\}_.*//' | \
                     tr '[:upper:]' '[:lower:]' | \
                     tr ' ' '-')
        output_name="${output_name}.webp"
    elif [[ ! "$output_name" =~ \.webp$ ]]; then
        output_name="${output_name}.webp"
    fi

    local output_path="public/${output_name}"

    echo "Converting: $input"
    echo "       to: $output_path"

    convert "$input" -quality 90 "$output_path"

    if [ $? -eq 0 ]; then
        local size=$(ls -lh "$output_path" | awk '{print $5}')
        echo "✓ Success! Size: $size"
        echo ""
        return 0
    else
        echo "✗ Failed to convert $input"
        echo ""
        return 1
    fi
}

# Main script logic
if [ $# -eq 0 ]; then
    # No arguments - convert all ChatGPT images in current directory
    shopt -s nullglob
    files=("ChatGPT Image"*.png)

    if [ ${#files[@]} -eq 0 ]; then
        echo "No ChatGPT images found in current directory"
        echo "Looking for files matching pattern: 'ChatGPT Image*.png'"
        exit 0
    fi

    echo "Found ${#files[@]} ChatGPT image(s)"
    echo ""

    converted=0
    failed=0

    for file in "${files[@]}"; do
        if convert_image "$file"; then
            ((converted++))
        else
            ((failed++))
        fi
    done

    echo "================================"
    echo "Conversion complete!"
    echo "  Converted: $converted"
    echo "  Failed: $failed"
    echo "================================"

elif [ $# -eq 1 ]; then
    # One argument - convert specific file with auto-generated name
    convert_image "$1"

elif [ $# -eq 2 ]; then
    # Two arguments - convert specific file with custom name
    convert_image "$1" "$2"

else
    echo "Usage:"
    echo "  $0                          # Convert all ChatGPT images in current directory"
    echo "  $0 <input_file>             # Convert specific file with auto-generated name"
    echo "  $0 <input_file> <output>    # Convert specific file with custom name"
    exit 1
fi
