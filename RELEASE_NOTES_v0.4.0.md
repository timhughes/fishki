# Fishki v0.4.0 Release Notes

## Overview

Fishki v0.4.0 introduces significant improvements to folder navigation, index page handling, and markdown rendering. This release focuses on enhancing the user experience with client-side markdown rendering, better folder navigation, and improved test coverage.

## New Features

### Folder Navigation and Index Pages
- **Auto-loading index pages**: When navigating to folders, index.md files are automatically loaded
- **Index page creation**: Added support for creating index pages in folders that don't have them
- **Hidden index pages in tree view**: Index pages are now hidden in the tree view for cleaner navigation
- **Folder path handling in URL**: URLs with folder paths now properly resolve to index pages or show create page interface

### Client-Side Markdown Rendering
- **Real-time preview**: Implemented client-side markdown rendering for instant preview updates
- **Syntax highlighting**: Added code block syntax highlighting with rehype-highlight
- **Improved performance**: Eliminated server round-trips for markdown rendering
- **Offline editing capability**: Preview works without server connection
- **Consistent styling**: Enhanced styling for all markdown elements

## Fixes

### React Router v7 Compatibility
- Updated router configuration to use the new React Router v7 API
- Fixed navigation blocking with the new useBlocker hook
- Improved handling of navigation events
- Updated parameter handling for route components
- Fixed test configuration to support ESM modules

### Test Suite Improvements
- Eliminated React state update warnings in tests
- Properly wrapped all state updates in `act()` calls
- Added controlled promises to manage asynchronous operations
- Implemented fake timers for timing-sensitive tests
- Improved test structure to match component behavior
- Added specific tests for dialog flows and component state changes

### UI Improvements
- Fixed folder navigation to show create page interface in view mode instead of edit mode
- Improved directory path handling for better user experience
- Enhanced page deletion flow

## Dependencies
- Bumped actions/setup-go from 4 to 5 in GitHub Actions workflows

## Documentation
- Updated README to reflect current project state
- Added testing documentation for client-side rendering
- Added documentation for frontend test fixes

## Technical Details
- Added proper TypeScript configuration for tests
- Configured Jest for React Markdown components
- Created comprehensive test suite for the MarkdownEditor component
- Improved error handling in API client
- Enhanced path utilities for better folder and file handling

## Contributors
- Tim Hughes
- Dependabot

## Upgrading
No special steps are required when upgrading from v0.3.0. The application will automatically use the new client-side rendering and folder navigation features.
