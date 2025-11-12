# Meditation Journey Slider - Technical Documentation

## Overview

This is a highly customizable slider component designed to showcase meditation app user flows within an iPhone mockup. It features a dynamic timeline that progressively reveals stages as users navigate through slides.

## Architecture

### Core Components

1. **HTML Structure** (`index.html`)
   - Slide definitions with data attributes
   - iPhone mockup container
   - Navigation controls
   - Timeline wrapper (dynamically populated)

2. **Styling** (`styles.css`)
   - iPhone frame and screen positioning
   - Timeline appearance and colors
   - Responsive breakpoints
   - Stage-based color themes

3. **JavaScript Logic** (`script.js`)
   - Dynamic timeline generation
   - Slide navigation
   - Media playback control
   - Progressive reveal system
   - Auto-scroll functionality

---

## Slide Configuration

Each slide is defined by a `<div class="slide">` element with data attributes that control both the slide content and its timeline appearance.

### Core Data Attributes

#### `data-title` (Required)
- **Type:** String
- **Purpose:** Main title shown in the description area below the phone
- **Example:** `data-title="User opens their phone in the morning"`
- **Note:** This is the primary user-facing content description

#### `data-description` (Required)
- **Type:** String (supports HTML)
- **Purpose:** Detailed description shown below the title
- **Example:** `data-description="They decide to proceed with 'select meditation' button"`
- **Supports:** HTML tags like `<br>` for line breaks
- **Note:** Changed to use `innerHTML` to support formatting

#### `data-tap-x` and `data-tap-y` (Required)
- **Type:** Percentage string (e.g., "50%")
- **Purpose:** Coordinates for the animated finger tap indicator
- **Example:** `data-tap-x="54%" data-tap-y="52%"`
- **How it works:**
  - Percentages are relative to the slider dimensions
  - X=0% is left edge, X=100% is right edge
  - Y=0% is top edge, Y=100% is bottom edge
- **Animation:** Creates a circular tap indicator that appears at these coordinates when transitioning to the next slide

---

## Timeline Configuration

### Timeline Data Attributes

#### `data-timeline-label` (Required)
- **Type:** String (supports HTML)
- **Purpose:** Text displayed in the timeline segment
- **Example:** `data-timeline-label="Start"`
- **HTML Support:** Can use `<br>` for multi-line labels
- **Example with break:** `data-timeline-label="Prepare your<br>footsoak (optional)"`
- **Fallback:** If not provided, uses `data-title` instead

#### `data-timeline-duration` (Optional)
- **Type:** String
- **Purpose:** Duration text shown below the label in smaller font
- **Example:** `data-timeline-duration="12-15 min"`
- **Display:** Appears in gray text below the label
- **Note:** Purely informational, doesn't affect segment width
- **Empty value:** Leave as `data-timeline-duration=""` to show no duration

#### `data-timeline-width` (Optional)
- **Type:** CSS width value (e.g., "200px", "150px")
- **Purpose:** Override auto-calculated width with custom fixed width
- **Example:** `data-timeline-width="180px"`
- **Default behavior:** If not set, width auto-calculates as `text content width + 40px`
- **Use case:** When you want consistent segment sizes regardless of text length

#### `data-timeline-stage` (Required)
- **Type:** String (predefined values)
- **Purpose:** Determines color theme for the segment
- **Options:**
  - `"intro"` - Light blue (#B8D4D9) - Opening/warmup activities
  - `"preparation"` - Light green (#A8D5A8) - Setup and optional preparation
  - `"meditation"` - Light coral (#E8A398) - Core meditation practice
  - `"additional"` - Light plum (#DDA0DD) - Extra/optional activities
  - `"outro"` - Light gold (#FFD9A0) - Closing and reflection
- **Effect:** Colors both the timeline bar fill and active text color

#### `data-include-timeline` (Optional)
- **Type:** String ("yes" or "no")
- **Purpose:** Control whether this slide appears in the timeline
- **Default:** "yes" (or if attribute is omitted)
- **Options:**
  - `"yes"` or omitted - Slide appears in timeline as normal segment
  - `"no"` - Slide is excluded from timeline; no segment created
- **Behavior when set to "no":**
  - No timeline segment is created for this slide
  - When navigating to this slide, timeline stays on the previous active segment
  - Useful for transition screens or explanatory content that shouldn't be represented as separate stages
- **Example use case:** You have a 10-second explanation video between meditation stages - you want users to see it, but don't want it as a separate timeline segment
- **Implementation:** Script maintains a `slideToSegmentMap` that maps slide indices to timeline segments (or `null` if excluded)
- **Example:**
  ```html
  <div class="slide"
    data-include-timeline="no"
    data-title="Transition screen"
    data-description="Brief explanation..."
    ...>
    <video src="transition.webm" loop playsinline></video>
  </div>
  ```

---

## Timeline Auto-sizing Logic

### How Width Calculation Works

When `data-timeline-width` is not provided:

1. **Element Creation:** Timeline segment is created with label and duration
2. **Temporary Append:** Segment is added to DOM to measure rendered size
3. **Measurement:** Script measures `offsetWidth` of both label and duration elements
4. **Calculation:** Takes the wider of the two and adds 40px (20px padding each side)
5. **Application:** Width is set via inline style `segment.style.width = "${width}px"`

```javascript
const labelWidth = labelDiv.offsetWidth;
const durationWidth = durationEl.offsetWidth;
const contentWidth = Math.max(labelWidth, durationWidth);
const segmentWidth = contentWidth + 40; // 20px padding on each side
segment.style.width = `${segmentWidth}px`;
```

### Mobile Responsiveness

On mobile (viewport ≤ 768px):
- Timeline segments use the same auto-sizing logic
- Fonts are smaller (10px vs 13px for labels)
- Duration text is 9px instead of 10px
- Padding remains consistent

---

## Video and Audio Support

### Three Media Options

#### 1. Image Slide (Default)
```html
<div class="slide" ...>
  <img src="slider-screens/1.webp" alt="Slide 1">
</div>
```

#### 2. Video with Separate Audio (Video Muted)
```html
<div class="slide"
  data-audio="slider-screens/audio.mp3"
  ...>
  <video src="slider-screens/video.webm" loop playsinline></video>
</div>
```
- **Behavior:** Video plays but is muted
- **Separate audio:** Plays from the source specified in `data-audio`
- **Use case:** When video visuals and audio need to be separate files

#### 3. Video with Native Audio
```html
<div class="slide"
  data-use-video-audio="true"
  ...>
  <video src="slider-screens/video.webm" loop playsinline></video>
</div>
```
- **Behavior:** Video plays with its embedded audio track
- **Setting:** `data-use-video-audio="true"` enables native audio
- **Use case:** When video file contains the audio you want to use

### Media Playback Logic

**Auto-play:** Media starts when slide becomes active
**Auto-stop:** Media pauses when navigating away from slide
**Out of view:** IntersectionObserver pauses media when slider scrolls out of viewport
**Video attributes:** Always include `loop playsinline` for smooth mobile experience

---

## Progressive Revelation System

### How It Works

1. **Initial State:** All timeline segments appear at 40% opacity
2. **Revealed State:** When user reaches a slide, that segment and all previous segments become 100% opacity
3. **Active State:** Current slide's segment shows as "active" with:
   - Bar fills to 100% width
   - Text color changes to match stage theme
   - Font weight increases to 700

### CSS Classes

```css
.timeline-segment              /* Default: 40% opacity */
.timeline-segment.revealed     /* 100% opacity, bar fills */
.timeline-segment.active       /* Current slide: bold text, themed color */
```

### Implementation

```javascript
// Mark all segments before current as revealed
if (slideIndex < currentSlideIndex) {
  segment.classList.add('revealed');
}
// Mark current segment as both active and revealed
else if (slideIndex === currentSlideIndex) {
  segment.classList.add('active');
  segment.classList.add('revealed');
}
```

---

## Navigation System

### Four Navigation Methods

#### 1. Arrow Buttons
- **Left Arrow:** Previous slide
- **Right Arrow:** Next slide (with tap animation)
- **Position:** 130px outside phone edges on desktop, to viewport edges on mobile
- **Click area:** Only the button itself is clickable
- **Special effect:** Right arrow has pulsing animation on first slide

#### 2. Click Phone Screen
- **Behavior:** Same as clicking right arrow
- **Area:** Entire `.slider` element
- **Use case:** Intuitive touch-friendly advancement

#### 3. Click Timeline Segment
- **Behavior:** Jump directly to that slide
- **Drag protection:** Won't trigger if user was dragging timeline
- **Implementation:** `isDragging` flag prevents accidental navigation during scroll

#### 4. Keyboard (Could be implemented)
- Currently not implemented, but could add arrow key support

---

## Timeline Scrolling and Gradients

### Horizontal Scrolling

**Container width:**
- Desktop: `calc(340px + 80px + 340px)` = 760px (text + gap + phone width)
- Mobile: `calc(100vw - 32px)` (16px margins each side)

**Track width:** Sum of all segment widths (usually exceeds container)

**Overflow:** Container has `overflow-x: auto` with hidden scrollbar

### Gradient Indicators

**Purpose:** Show users there's more content to scroll

**Implementation:**
```html
<div class="timeline-wrapper">
  <div class="timeline-gradient-left"></div>   <!-- Left fade -->
  <div class="timeline-gradient-right"></div>  <!-- Right fade -->
  <div class="timeline-container">...</div>
</div>
```

**Behavior:**
- **Left gradient:** Shows when `scrollLeft > 10px`
- **Right gradient:** Shows when not scrolled to end
- **Width:** 60px on desktop, 40px on mobile
- **Effect:** White to transparent gradient overlay
- **Position:** Fixed at viewport edges, don't scroll with content

**Update logic:**
```javascript
const updateScrollIndicators = () => {
  const scrollLeft = timelineContainer.scrollLeft;
  const maxScrollLeft = timelineContainer.scrollWidth - timelineContainer.clientWidth;

  // Show/hide gradients based on scroll position
  if (scrollLeft > 10) {
    timelineWrapper.classList.add('has-scroll-left');
  }
  if (scrollLeft < maxScrollLeft - 10) {
    timelineWrapper.classList.add('has-scroll-right');
  }
};
```

---

## Auto-scroll to Active Segment

When user navigates to a new slide, timeline automatically scrolls to center that segment:

```javascript
const segmentCenter = activeSegment.offsetLeft + activeSegment.offsetWidth / 2;
const containerCenter = timelineContainer.clientWidth / 2;

timelineContainer.scrollTo({
  left: segmentCenter - containerCenter,
  behavior: 'smooth'
});
```

**Effect:** Active segment smoothly scrolls into center of timeline viewport

---

## Drag Functionality

### Desktop (Mouse Events)

```javascript
mousedown  → Start drag, record startX and scrollLeft
mousemove  → Calculate offset, update scrollLeft
mouseup    → End drag
```

### Mobile (Touch Events)

```javascript
touchstart → Start drag, record touch position
touchmove  → Calculate offset, update scrollLeft
touchend   → End drag
```

### Drag vs Click Detection

**Problem:** Need to distinguish between click and drag on timeline segments

**Solution:** `isDragging` flag
- Set to `true` on mousedown/touchstart
- Set to `false` on mouseup/touchend
- Timeline segment click handler checks this flag:
  ```javascript
  if (isDragging) return; // Don't navigate if just dragging
  ```

---

## Responsive Breakpoints

### Desktop (> 768px)

```css
.timeline-wrapper {
  width: calc(340px + 80px + 340px); /* 760px */
}
.buttons-wrapper {
  width: calc(100% + 200px); /* Extends 100px each side */
}
```

### Mobile (≤ 768px)

```css
.timeline-wrapper {
  width: calc(100vw - 32px); /* 16px margins */
}
.buttons-wrapper {
  width: calc(100vw - 32px); /* Matches timeline */
}
.mockup-container {
  width: min(280px, calc(100% - 100px));
}
```

**Font sizes mobile adjustments:**
- Stage titles: 13px → 10px
- Duration text: 10px → 9px
- Timeline bar height: 6px → 5px

---

## Color System

### Stage Color Mapping

Each stage has a paired color system:

| Stage | Bar Color | Active Text Color | Purpose |
|-------|-----------|------------------|---------|
| intro | #B8D4D9 (light blue) | #4A90A4 (darker blue) | Opening activities |
| preparation | #A8D5A8 (light green) | #6B9F6B (darker green) | Setup/optional prep |
| meditation | #E8A398 (light coral) | #D88B7F (darker coral) | Core practice |
| additional | #DDA0DD (light plum) | #C77BC7 (darker plum) | Extra activities |
| outro | #FFD9A0 (light gold) | #D4AF37 (darker gold) | Closing/reflection |

### CSS Implementation

```css
/* Bar fill color */
.timeline-segment[data-stage="meditation"] .timeline-bar::before {
  background-color: #E8A398;
}

/* Active text color */
.timeline-segment[data-stage="meditation"].active .stage-title {
  color: #D88B7F;
}
```

---

## Peculiarities and Edge Cases

### 1. HTML in Labels
- Timeline labels use `innerHTML` instead of `textContent`
- **Why:** Allows `<br>` tags for multi-line labels
- **Security note:** Only use with trusted content, not user input
- **Example:** `data-timeline-label="Prepare your<br>footsoak"`

### 2. Description HTML Support
- Descriptions also support HTML via `innerHTML`
- **Use case:** Line breaks, formatting in slide descriptions
- **Implementation:** Changed in script.js line 278

### 3. Measurement Timing
- Timeline segments temporarily appended to DOM for width measurement
- **Why:** `offsetWidth` only works on rendered elements
- **Process:** Create → Append → Measure → Apply width
- **Performance:** Happens once on page load, negligible impact

### 4. Video Audio Switching
- `data-use-video-audio="true"` unmutes video
- Without it, video is muted and separate audio plays if `data-audio` is set
- **Cannot:** Use both video audio and separate audio simultaneously
- **Logic:** If `useVideoAudio` is true, separate audio is ignored

### 5. First Slide Indicator
- Right arrow has special styling on first slide
- **CSS class:** `first-slide` added to `#next` button
- **Effect:** Could show green ring or other "start here" indicator
- **Removed after:** User navigates past first slide

### 6. Timeline Dots
- Dots appear at right edge of each segment (except last)
- **Position:** `right: -5px` to overlap segment boundaries
- **Size:** 10px on desktop, 8px on mobile
- **Style:** Dark gray (#666666) with white border
- **Purpose:** Visual separator between stages

### 7. Intersection Observer
- Pauses media when slider scrolls out of viewport
- **Threshold:** 0.1 (10% visibility)
- **Purpose:** Save resources, prevent background audio
- **Limitation:** Doesn't restart when scrolling back (by design)

### 8. Pulsing Animation
- Right arrow pulses on page load
- **Animation:** Scale and ring effects
- **CSS:** Removed when `.clicked` class added
- **Duration:** Infinite until first click

### 9. Mobile Width Calculation
- Different base widths for mobile vs desktop
- **Desktop base:** 120px
- **Mobile base:** 80px (33% smaller)
- **Detection:** `window.innerWidth <= 768`
- **Multipliers:** Same weight system (1x, 1.5x, 2x)

### 10. Scroll Position Reset
- Timeline starts at `scrollLeft = 0` on page load
- **Why:** Ensures first segment is visible
- **Implementation:** Set explicitly after initialization
- **Effect:** Right gradient shows immediately

---

## Initialization Sequence

```javascript
1. initializeTimeline()     // Generate timeline segments from slides
2. initializeTimelineDrag() // Set up drag/scroll functionality
3. initializeTimelineClicks() // Set up segment click navigation
4. updateDescription()      // Show first slide's title/description
5. Reset scrollLeft to 0    // Ensure timeline starts at beginning
```

---

## Common Customization Tasks

### Change Phone Size
```css
.mockup-container {
  width: 340px;  /* Adjust this */
  height: 736px; /* Maintain aspect ratio */
}
```

### Adjust Timeline Position
```css
.timeline-wrapper {
  top: 30px; /* Distance from top of screen */
}
```

### Change Arrow Spacing
```css
.buttons-wrapper {
  width: calc(100% + 200px); /* Change 200px to adjust spacing */
}
```

### Modify Segment Padding
```javascript
const segmentWidth = contentWidth + 40; // Change 40 to adjust total padding
```

### Add New Stage Color
```css
.timeline-segment[data-stage="custom"] .timeline-bar::before {
  background-color: #YOUR_COLOR;
}
.timeline-segment[data-stage="custom"].active .stage-title {
  color: #YOUR_DARKER_COLOR;
}
```

---

## Performance Considerations

1. **Image Format:** Using WebP for ~30% smaller file sizes
2. **Video Format:** Using WebM for better web performance
3. **Video Attributes:** `playsinline` prevents fullscreen on iOS
4. **Intersection Observer:** Pauses off-screen videos
5. **CSS Transitions:** Hardware-accelerated transforms
6. **Flexbox Layout:** Efficient rendering without complex calculations
7. **Event Delegation:** Could be improved by using single listener on track

---

## Known Limitations

1. **No keyboard navigation** - Only mouse/touch supported
2. **No loop mode** - Can't wrap from last to first slide automatically
3. **No autoplay** - Doesn't advance slides automatically
4. **Single audio track** - Can't play multiple sounds simultaneously
5. **Fixed aspect ratio** - Phone mockup doesn't resize dynamically based on content
6. **No slide transitions** - Simple opacity fade only
7. **No touch swipe** - Can't swipe on phone to navigate (only click/tap)

---

## Future Enhancement Ideas

- Add keyboard arrow key navigation
- Implement swipe gestures on phone mockup
- Add configurable transition effects
- Support for multiple simultaneous audio tracks
- Timeline minimap for long journeys
- Bookmark/favorite specific slides
- Export journey as video or GIF
- Analytics tracking for slide engagement
- A/B testing different journeys
- Collaborative commenting on slides

---

## Debugging Tips

### Timeline not appearing
- Check: `initializeTimeline()` called
- Check: Slides have `data-timeline-label` attribute
- Check: `.timeline-track` element exists in DOM

### Segments wrong width
- Check: Fonts loaded before measurement
- Check: `data-timeline-width` not interfering
- Try: Adding delay before initialization

### Video not playing
- Check: File path correct
- Check: `data-use-video-audio` set if audio needed
- Check: Browser console for errors
- Try: Simpler video codec

### Colors not applying
- Check: `data-timeline-stage` spelling exact
- Check: CSS selector specificity
- Try: Inspect element in DevTools

### Scrolling not working
- Check: Container has `overflow-x: auto`
- Check: Track width exceeds container width
- Check: Elements have `flex-shrink: 0`

---

## Best Practices

1. **Image optimization:** Use WebP format, compress images
2. **Video optimization:** Keep videos short (<30 seconds), compress well
3. **Label text:** Keep concise, use line breaks for readability
4. **Stage grouping:** Group related slides under same stage for visual consistency
5. **Testing:** Test on both desktop and mobile devices
6. **Accessibility:** Could add ARIA labels and keyboard support
7. **Content:** Tell a clear story through the journey progression

---

This slider was built to showcase meditation app user journeys in an intuitive, visual way. The combination of phone mockup, interactive timeline, and progressive revelation creates an engaging demonstration experience.
