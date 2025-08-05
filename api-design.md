# API Design: Filedime Backend Migration

## Tauri Commands Inventory

From `src-tauri/src/main.rs`, here are all the Tauri commands that need HTTP API equivalents:

### Core File Operations
- `list_files(path, window, state)` - List files in directory
- `files_list_for_miller_col(path, window, state)` - List files for Miller columns
- `checkiffile(path)` - Check if path exists and is file
- `doespathexist(path)` - Check if path exists
- `openpath(path)` - Open file/URL with default application
- `foldersize(path, window, state)` - Get folder size
- `getparentpath(path, window, state)` - Get parent directory path
- `get_path_options(path, window, state)` - Get path completion options

### Navigation & Tabs
- `newtab(path, window, state)` - Create new tab
- `newwindow(path, ff, window, state)` - Create new window
- `newspecwindow(winlabel, name, window, state)` - Create specific window
- `closetab(windowname, window, state)` - Close tab
- `closealltabs(window, state)` - Close all tabs
- `listtabs(window, state)` - List all tabs
- `tabname(path)` - Get tab name from path
- `disablenav(windowname, window, state)` - Disable navigation
- `addtotabhistory(path, window, state)` - Add to tab history

### Search & Loading
- `searchload(path, window, state)` - Load search results
- `loadsearchlist(windowname, id, path, window, state)` - Load search list
- `populate_try(path, window, state)` - Populate directory (used by search)
- `search_try(path, window, state)` - Search functionality

### File Operations
- `fileop(src, dest, window, state)` - File operations (copy/move/delete)
- `checkforconflicts(src, dest, window, state)` - Check for file conflicts

### Bookmarks & Marks
- `addmark(path, window, state)` - Add bookmark
- `removemark(path, window, state)` - Remove bookmark
- `loadmarks(windowname, app_handle, marks_json)` - Load bookmarks

### Configuration & Settings
- `configfolpath(window, state)` - Get folder configuration
- `nosize(windowname, togglewhat, window, state)` - Toggle various options
- `startup(window)` - Startup initialization

### System & Utilities
- `getlocalip()` - Get local IP address
- `get_timestamp()` - Get current timestamp
- `checker()` - Check for updates
- `highlightfile(path, theme)` - Highlight file syntax
- `filegptendpoint(endpoint)` - Get/set FileGPT endpoint

### Custom Scripts & Buttons
- `otb(bname, path, state)` - Open terminal/button custom script
- `mirror(functionname, arguments, window)` - Mirror function to frontend

### Drive Operations
- `senddriveslist(window)` - Send list of drives
- `mountdrive(drive_letter)` - Mount drive
- `unmountdrive(drive_letter)` - Unmount drive

### Navigation Timeline
- `navbrowsetimeline(direction, window, state)` - Browse navigation history

### HTML/Markdown Loading
- `loadfromhtml(path, window, state)` - Load from HTML
- `loadmarkdown(path, window, state)` - Load markdown

### Server Management
- `startserver(window)` - Start server
- `stopserver(window)` - Stop server

## HTTP API Design

### Base URL Configuration
- Development: `http://localhost:8477` (matches existing TCP server)
- Production: Configurable via environment variable

### Request Format
- All endpoints accept POST requests with JSON body
- Authentication: Bearer token (placeholder for future implementation)
- CORS: Enabled for all origins during development

### Response Format
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

### Endpoint Mappings

#### File Operations
```typescript
// List files in directory
POST /api/files/list
{
  "path": "/home/user/documents"
}

// Get file info
POST /api/files/info
{
  "path": "/home/user/documents/file.txt"
}

// Open file
POST /api/files/open
{
  "path": "/home/user/documents/file.txt"
}

// Get folder size
POST /api/files/folder-size
{
  "path": "/home/user/documents"
}

// Get parent path
POST /api/files/parent-path
{
  "path": "/home/user/documents/subfolder"
}

// Path completion
POST /api/files/path-options
{
  "path": "/home/user/doc"
}
```

#### Navigation & Tabs
```typescript
// Create new tab
POST /api/tabs/new
{
  "path": "/home/user/documents"
}

// Close tab
POST /api/tabs/close
{
  "tab_id": "unique-tab-id"
}

// List tabs
POST /api/tabs/list

// Get tab name
POST /api/tabs/name
{
  "path": "/home/user/documents"
}
```

#### Search
```typescript
// Search directory
POST /api/search/load
{
  "path": "/home/user",
  "query": "document"
}

// Load search results
POST /api/search/results
{
  "window_name": "main",
  "id": "search-1",
  "path": "/home/user"
}
```

#### Configuration
```typescript
// Get configuration
POST /api/config/folder-path

// Toggle options
POST /api/config/toggle
{
  "window_name": "main",
  "option": "size" // size, excludehidden, includefolder, folcount, sessionsave
}
```

#### System
```typescript
// Get local IP
POST /api/system/local-ip

// Get timestamp
POST /api/system/timestamp

// Check for updates
POST /api/system/check-updates

// Highlight file
POST /api/files/highlight
{
  "path": "/home/user/code.rs",
  "theme": "dark"
}
```

#### Custom Scripts
```typescript
// Execute custom script
POST /api/scripts/execute
{
  "button_name": "Open Terminal",
  "path": "/home/user/documents"
}
```

### Event System (WebSocket fallback)
For real-time updates, implement WebSocket endpoints:
- `/api/ws/events` - Listen to application events
- `/api/ws/progress` - Progress updates for long operations

### Error Handling
```json
{
  "success": false,
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "The specified file does not exist"
  }
}
```

### Rate Limiting
- Implement basic rate limiting (100 requests per minute)
- Include X-RateLimit-* headers in responses