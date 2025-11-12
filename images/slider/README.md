# Interactive Meditation Journey Slider

A customizable, responsive iPhone mockup slider with an interactive timeline, designed to showcase meditation app user flows and journeys.

## Features

- **iPhone Mockup Display** - Realistic iPhone frame with slides displayed inside the screen
- **Interactive Timeline** - Dynamic, scrollable timeline at the top showing meditation journey stages
- **Progressive Revelation** - Timeline segments are revealed as users progress through slides
- **Stage-Based Color Coding** - Visual distinction between intro, preparation, meditation, and other stages
- **Tap Animation** - Animated finger tap indicator showing where users interact
- **Video & Audio Support** - Play videos with optional separate audio tracks
- **Responsive Design** - Works on desktop and mobile devices
- **Auto-sizing Timeline Segments** - Timeline segments automatically adjust to content width

## Quick Start

1. Open `index.html` in a web browser
2. Click arrows to navigate between slides
3. Click the phone itself to advance
4. Click timeline segments to jump to specific slides
5. Drag timeline horizontally to reveal more stages

## File Structure

```
slider/
├── index.html           # Main HTML file with slide definitions
├── styles.css           # All styling and responsive breakpoints
├── script.js            # Timeline generation and interaction logic
└── slider-screens/      # Slide images and videos
    ├── 1.webp
    ├── 2.webp
    └── ...
```

## Customization

### Adding a New Slide

Add a new `<div class="slide">` element inside the `.slider` container:

```html
<div class="slide"
  data-title="Slide Title"
  data-description="Slide description shown below the phone"
  data-tap-x="50%"
  data-tap-y="50%"
  data-timeline-label="Timeline Label"
  data-timeline-duration="2 min"
  data-timeline-stage="meditation">
  <img src="slider-screens/your-image.webp" alt="Slide">
</div>
```

### Timeline Configuration

Control timeline appearance through data attributes:

- **data-timeline-label** - Text in timeline (supports HTML like `<br>`)
- **data-timeline-duration** - Duration text shown below label
- **data-timeline-width** - Optional custom width (e.g., `"200px"`)
- **data-timeline-stage** - Color theme: `intro`, `preparation`, `meditation`, `additional`, `outro`

### Stage Colors

Modify colors in `styles.css`:

```css
.timeline-segment[data-stage="meditation"] .timeline-bar::before {
  background-color: #E8A398; /* Change this color */
}
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled

## Credits

Built for meditation app journey visualization and user flow demonstrations.

## License

MIT License - Feel free to use and modify for your projects.
