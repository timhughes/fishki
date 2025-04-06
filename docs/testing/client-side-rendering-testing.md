# Client-Side Markdown Rendering: Manual Testing Plan

This document outlines the manual testing procedures for verifying the client-side markdown rendering implementation in the Fishki editor.

## Overview

The Fishki editor has been updated to use client-side rendering for the markdown preview instead of making API calls to the server. This change improves performance, reduces server load, and enables offline editing capabilities.

## Prerequisites

- Local development environment set up
- Fishki application running locally
- Access to browser developer tools
- Test markdown content of various complexity levels

## Test Cases

### 1. Basic Functionality Testing

**Objective**: Verify that the editor correctly renders markdown content in real-time without server calls.

**Steps**:
1. Navigate to an existing page in the wiki
2. Click "Edit" to enter edit mode
3. Observe the initial rendering of content in the preview pane
4. Make changes to the content and verify the preview updates immediately
5. Test the following markdown elements:
   - Headings (# to ######)
   - Paragraphs with line breaks
   - Bold and italic text
   - Lists (ordered and unordered)
   - Links
   - Images (if available in the repository)
   - Blockquotes
   - Horizontal rules
   - Code blocks (inline and multi-line)
   - Tables
6. Save the changes and verify they persist after reload

**Expected Results**:
- Preview updates in real-time as you type
- All markdown elements render correctly
- No visible lag between typing and preview updating
- No network requests to `/api/render` endpoint

### 2. Performance Testing

**Objective**: Evaluate the performance of client-side rendering compared to server-side rendering.

**Steps**:
1. Create or open a large markdown document (>1000 lines)
2. Enter edit mode and measure the time it takes for the initial preview to render
3. Make changes at different positions in the document:
   - Beginning of the document
   - Middle of the document
   - End of the document
4. Add and remove complex elements (tables, code blocks)
5. Rapidly type content to test real-time rendering performance

**Expected Results**:
- Initial rendering completes in under 2 seconds
- Preview updates feel instantaneous (under 100ms)
- No noticeable lag even with large documents
- Smooth typing experience without freezing or stuttering

### 3. Network Traffic Analysis

**Objective**: Confirm that no unnecessary API calls are made during editing.

**Steps**:
1. Open browser developer tools and go to the Network tab
2. Navigate to a page and enter edit mode
3. Clear the network log
4. Make various edits to the content
5. Monitor the network tab for any API calls
6. Save the document and verify only the save API call is made

**Expected Results**:
- No API calls to `/api/render` during editing
- Only one API call to `/api/save` when saving the document
- Reduced network traffic compared to previous implementation

### 4. Offline Capability Testing

**Objective**: Verify that the editor works correctly without an internet connection.

**Steps**:
1. Open the application and navigate to a page
2. Enter edit mode
3. Disconnect from the network (turn off Wi-Fi or use browser dev tools to simulate offline)
4. Make changes to the content
5. Verify that the preview continues to update correctly
6. Attempt to save (should show appropriate error)
7. Reconnect to the network and verify save works

**Expected Results**:
- Preview continues to work without network connection
- Appropriate error message when trying to save offline
- Changes can be saved once network is restored

### 5. Syntax Highlighting Testing

**Objective**: Verify that code blocks are properly syntax highlighted.

**Steps**:
1. Enter edit mode for a page
2. Add code blocks with different language specifications:
   ```markdown
   ```javascript
   const x = 10;
   console.log(x);
   ```

   ```python
   def hello():
       print("Hello, world!")
   ```

   ```go
   package main
   
   import "fmt"
   
   func main() {
       fmt.Println("Hello, world!")
   }
   ```

   ```css
   body {
       background-color: #f0f0f0;
       color: #333;
   }
   ```
   ```
3. Verify that each code block is highlighted according to its language

**Expected Results**:
- Different languages have appropriate syntax highlighting
- Colors match the expected highlighting scheme
- No rendering errors or missing highlights

### 6. Edge Case Testing

**Objective**: Verify that the editor handles edge cases gracefully.

**Steps**:
1. Test with very large code blocks (100+ lines)
2. Test with complex nested markdown structures:
   - Lists within lists
   - Blockquotes within lists
   - Code blocks within blockquotes
3. Test with special characters and emoji
4. Test with HTML embedded in markdown
5. Test with malformed markdown syntax
6. Test with extremely long lines of text

**Expected Results**:
- All content renders without errors
- Performance remains acceptable
- Malformed markdown degrades gracefully
- Special characters and emoji display correctly

### 7. Cross-Browser Testing

**Objective**: Verify that the editor works consistently across different browsers.

**Steps**:
1. Repeat basic functionality tests in:
   - Chrome
   - Firefox
   - Safari (if available)
   - Edge (if available)
2. Pay special attention to rendering differences and performance

**Expected Results**:
- Consistent behavior across all tested browsers
- No browser-specific rendering issues
- Similar performance characteristics

### 8. Accessibility Testing

**Objective**: Verify that the editor remains accessible with client-side rendering.

**Steps**:
1. Navigate through the editor using keyboard only
2. Test with a screen reader if available
3. Check color contrast in the rendered preview
4. Verify that all interactive elements are keyboard accessible

**Expected Results**:
- Editor can be fully operated with keyboard
- Screen readers can access both editor and preview content
- Color contrast meets WCAG AA standards
- All functionality remains accessible

## Reporting Issues

When reporting issues with the client-side rendering implementation, please include:

1. Browser and version
2. Operating system
3. Steps to reproduce
4. Expected vs. actual behavior
5. Screenshots if applicable
6. Network logs from browser developer tools
7. Console errors if any

## Conclusion

This manual testing plan ensures that the client-side markdown rendering implementation is thoroughly tested for functionality, performance, and edge cases. By following these test procedures, we can verify that the implementation meets all requirements and provides a better user experience than the previous server-side rendering approach.
