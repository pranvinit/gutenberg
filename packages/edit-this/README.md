# Edit This

Frontend editing helpers for block themes - adds "Edit This" buttons to template parts and post content on the site frontend.

## Description

The `@wordpress/edit-this` package provides functionality to display "Edit This" buttons overlaid on template parts and post content when viewing the frontend of a block theme website. This helps users quickly navigate to the appropriate editor to make changes to specific parts of their site.

## Features

- **Template Part Editing**: Shows edit buttons on template parts (header, footer, etc.)
- **Post Content Editing**: Shows edit buttons on post content areas
- **Admin Bar Toggle**: Provides a toggle in the admin bar to enable/disable Edit This mode
- **Accessibility**: Fully keyboard accessible with proper ARIA labels
- **Responsive**: Works on all device sizes with touch-friendly fallbacks

## Usage

This package is automatically enqueued when Edit This mode is enabled via the admin bar toggle. No manual setup is required.

### Enabling Edit This Mode

1. Visit your site's frontend while logged in as an editor or administrator
2. Click the "Edit This Mode" toggle in the admin bar
3. Edit buttons will appear when hovering over template parts and post content
4. Click any edit button to navigate to the appropriate editor

### For Theme Developers

The package automatically detects template parts and post content blocks that have been marked with the appropriate data attributes by the PHP backend. No additional configuration is needed.

## Browser Support

This package supports all modern browsers:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)  
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for information about contributing to this package.

## License

GPL-2.0-or-later
