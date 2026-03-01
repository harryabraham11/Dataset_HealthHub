## Packages
recharts | Beautiful, responsive charts for data visualization
react-dropzone | Seamless drag-and-drop file upload interface
react-markdown | Safely render AI-generated Markdown suggestions
framer-motion | Smooth page transitions and micro-interactions

## Notes
- Upload endpoint expects `multipart/form-data` with a `file` field.
- Cleaned files are assumed to be accessible via `/uploads/${cleanedFilename}` or similar static route.
- Ensure Tailwind config has access to `--font-sans` and `--font-display` CSS variables.
