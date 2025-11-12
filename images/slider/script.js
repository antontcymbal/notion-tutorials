const slides = document.querySelectorAll(".slide");
const nextButton = document.getElementById("next");
const prevButton = document.getElementById("prev");
const clickText = document.querySelector(".click-text");
const descriptionTitle = document.getElementById("description-title");
const descriptionParagraph = document.getElementById("description-paragraph");
const tapIndicator = document.querySelector(".tap-indicator");
const slider = document.querySelector(".slider");
const timelineTrack = document.getElementById("timeline-track");
const playPauseIndicator = document.querySelector(".play-pause-indicator");
let isAnimating = false;
let currentAudio = null;
let timelineSegments = [];
let slideToSegmentMap = new Map(); // Maps slide index to timeline segment (or null if excluded)
let playPauseTimeout = null;

// Parse duration string to get relative size
const getDurationWeight = (duration) => {
  if (!duration) return 1;

  const match = duration.match(/(\d+)(?:-(\d+))?\s*min/);
  if (!match) return 1;

  const min = parseInt(match[1]);
  const max = match[2] ? parseInt(match[2]) : min;
  const avg = (min + max) / 2;

  // Scale: 2 min = 1.5x, 5 min = 2x, 10+ min = 2x
  if (avg <= 2) return 1.5;
  if (avg <= 5) return 2;
  return 2;
};

// Generate timeline segments dynamically based on slides
const initializeTimeline = () => {
  timelineTrack.innerHTML = '';
  slideToSegmentMap.clear();

  let lastSegment = null; // Track last created segment for dot placement

  slides.forEach((slide, index) => {
    // Check if this slide should be included in timeline (default: yes)
    const includeInTimeline = slide.getAttribute('data-include-timeline') !== 'no';

    if (!includeInTimeline) {
      slideToSegmentMap.set(index, null); // Mark as excluded
      return; // Skip creating timeline segment for this slide
    }

    // Read timeline data from slide data attributes
    const label = slide.getAttribute('data-timeline-label') || slide.getAttribute('data-title') || `Slide ${index + 1}`;
    const duration = slide.getAttribute('data-timeline-duration') || '';
    const stage = slide.getAttribute('data-timeline-stage') || 'default';
    const customWidth = slide.getAttribute('data-timeline-width');

    const segment = document.createElement('div');
    segment.className = 'timeline-segment';
    segment.setAttribute('data-slide', index);
    segment.setAttribute('data-stage', stage);

    const bar = document.createElement('div');
    bar.className = 'timeline-bar';

    segment.appendChild(bar);

    const labelDiv = document.createElement('div');
    labelDiv.className = 'timeline-label';

    const stageTitle = document.createElement('span');
    stageTitle.className = 'stage-title';
    // Support HTML line breaks
    stageTitle.innerHTML = label;
    labelDiv.appendChild(stageTitle);

    segment.appendChild(labelDiv);

    const durationEl = document.createElement('div');
    durationEl.className = 'timeline-duration';
    durationEl.textContent = duration || '';
    segment.appendChild(durationEl);

    // Temporarily append to measure width
    timelineTrack.appendChild(segment);

    // Calculate width based on content or use custom width
    if (customWidth) {
      segment.style.width = customWidth;
    } else {
      // Measure the actual content width
      const labelWidth = labelDiv.offsetWidth;
      const durationWidth = durationEl.offsetWidth;
      const contentWidth = Math.max(labelWidth, durationWidth);
      const segmentWidth = contentWidth + 40; // 20px padding on each side
      segment.style.width = `${segmentWidth}px`;
    }

    segment.style.flexShrink = '0';

    // Add dot to previous segment if this isn't the first one
    if (lastSegment) {
      const dot = document.createElement('div');
      dot.className = 'timeline-dot';
      lastSegment.querySelector('.timeline-bar').appendChild(dot);
    }

    lastSegment = segment;
    slideToSegmentMap.set(index, segment); // Map slide index to segment
  });

  timelineSegments = document.querySelectorAll('.timeline-segment');
};

// Stop all media (video and audio) on a slide
const stopSlideMedia = (slide) => {
  const video = slide.querySelector('video');
  if (video) {
    // Remove ended event listener to prevent memory leaks
    video.removeEventListener('ended', handleVideoEnded);
    video.pause();
    video.muted = true; // Ensure audio is muted when stopping
    video.currentTime = 0;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
};

// Play media (video and audio) on a slide
const playSlideMedia = (slide) => {
  const video = slide.querySelector('video');
  const audioSrc = slide.getAttribute('data-audio');
  const useVideoAudio = slide.getAttribute('data-use-video-audio') === 'true';

  if (video) {
    // If data-use-video-audio="true", use the video's audio, otherwise mute it
    video.muted = !useVideoAudio;

    // Add ended event listener for auto-advance
    video.addEventListener('ended', handleVideoEnded);

    video.play();
  }

  // Only play separate audio if not using video audio
  if (audioSrc && !useVideoAudio) {
    if (!currentAudio) {
      currentAudio = new Audio();
    }
    currentAudio.src = audioSrc;
    currentAudio.play();
  }
};

// Handle video ended - automatically advance to next slide
const handleVideoEnded = (e) => {
  const video = e.target;
  const currentSlide = document.querySelector('.current');
  const videoSlide = video.closest('.slide');

  // Only advance if this video is on the current slide
  if (videoSlide === currentSlide) {
    // Remove the event listener to prevent duplicate calls
    video.removeEventListener('ended', handleVideoEnded);
    // Automatically advance to next slide
    nextSlide();
  }
};

// Show play/pause indicator
const showPlayPauseIndicator = (text) => {
  // Clear any existing timeout
  if (playPauseTimeout) {
    clearTimeout(playPauseTimeout);
  }

  // Update text and show indicator
  playPauseIndicator.textContent = text;
  playPauseIndicator.classList.remove('hide');
  playPauseIndicator.classList.add('show');

  // Hide after 2 seconds
  playPauseTimeout = setTimeout(() => {
    playPauseIndicator.classList.remove('show');
    playPauseIndicator.classList.add('hide');
  }, 2000);
};

// Handle video play/pause toggle
const toggleVideoPlayPause = (video) => {
  if (video.paused) {
    video.play();
    showPlayPauseIndicator('Play');
  } else {
    video.pause();
    showPlayPauseIndicator('Pause');
  }
};

// Update timeline highlight and progressive reveal based on current slide
const updateTimeline = () => {
  const currentSlideIndex = Array.from(slides).findIndex(slide => slide.classList.contains('current'));

  // Remove active class from all segments
  timelineSegments.forEach(segment => {
    segment.classList.remove('active');
    segment.classList.remove('revealed');
  });

  // Find the timeline segment for current slide (or previous slide if current is excluded)
  let targetSlideIndex = currentSlideIndex;
  let currentSegment = slideToSegmentMap.get(targetSlideIndex);

  // If current slide has no timeline segment, find the previous slide that does
  while (currentSegment === null && targetSlideIndex > 0) {
    targetSlideIndex--;
    currentSegment = slideToSegmentMap.get(targetSlideIndex);
  }

  // Add revealed class to all segments up to and including target slide
  // Add active class to the target segment
  let activeSegment = null;
  timelineSegments.forEach(segment => {
    const slideIndex = parseInt(segment.getAttribute('data-slide'));
    if (slideIndex < targetSlideIndex) {
      segment.classList.add('revealed');
    } else if (slideIndex === targetSlideIndex) {
      segment.classList.add('active');
      segment.classList.add('revealed');
      activeSegment = segment;
    }
  });

  // Scroll active segment into view (only if navigating to new segment)
  if (activeSegment) {
    const timelineContainer = document.querySelector('.timeline-container');
    if (timelineContainer) {
      const segmentRect = activeSegment.getBoundingClientRect();
      const containerRect = timelineContainer.getBoundingClientRect();
      const segmentCenter = activeSegment.offsetLeft + activeSegment.offsetWidth / 2;
      const containerCenter = timelineContainer.clientWidth / 2;

      timelineContainer.scrollTo({
        left: segmentCenter - containerCenter,
        behavior: 'smooth'
      });
    }
  }
};

// Timeline drag functionality
let isDragging = false;
let startX = 0;
let scrollLeft = 0;

// Update gradient indicators based on scroll position
const updateScrollIndicators = () => {
  const timelineContainer = document.querySelector('.timeline-container');
  const timelineWrapper = document.querySelector('.timeline-wrapper');
  if (!timelineContainer || !timelineWrapper) return;

  const scrollLeft = timelineContainer.scrollLeft;
  const maxScrollLeft = timelineContainer.scrollWidth - timelineContainer.clientWidth;

  // Show left gradient if scrolled right
  if (scrollLeft > 10) {
    timelineWrapper.classList.add('has-scroll-left');
  } else {
    timelineWrapper.classList.remove('has-scroll-left');
  }

  // Show right gradient if not scrolled to end
  if (scrollLeft < maxScrollLeft - 10) {
    timelineWrapper.classList.add('has-scroll-right');
  } else {
    timelineWrapper.classList.remove('has-scroll-right');
  }
};

const initializeTimelineDrag = () => {
  const timelineContainer = document.querySelector('.timeline-container');

  if (timelineContainer) {
    // Update indicators on scroll
    timelineContainer.addEventListener('scroll', updateScrollIndicators);

    // Initial update
    setTimeout(updateScrollIndicators, 100);

    timelineContainer.addEventListener('mousedown', (e) => {
      isDragging = true;
      timelineTrack.classList.add('dragging');
      startX = e.pageX;
      scrollLeft = timelineContainer.scrollLeft;
      e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      timelineTrack.classList.remove('dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX;
      const walk = (startX - x);
      timelineContainer.scrollLeft = scrollLeft + walk;
    });

    // Touch events for mobile
    timelineContainer.addEventListener('touchstart', (e) => {
      isDragging = true;
      startX = e.touches[0].pageX;
      scrollLeft = timelineContainer.scrollLeft;
    });

    timelineContainer.addEventListener('touchend', () => {
      isDragging = false;
    });

    timelineContainer.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const x = e.touches[0].pageX;
      const walk = (startX - x);
      timelineContainer.scrollLeft = scrollLeft + walk;
    });
  }
};

// Timeline segment click to navigate
const initializeTimelineClicks = () => {
  timelineSegments.forEach(segment => {
    segment.addEventListener('click', (e) => {
      // Don't navigate if we were just dragging
      if (isDragging) return;

      const targetSlideIndex = parseInt(segment.getAttribute('data-slide'));
      if (!isNaN(targetSlideIndex) && targetSlideIndex >= 0 && targetSlideIndex < slides.length) {
        // Stop current media
        const current = document.querySelector('.current');
        if (current) {
          stopSlideMedia(current);
          current.classList.remove('current');
        }

        // Navigate to target slide
        slides[targetSlideIndex].classList.add('current');
        updateDescription();
      }
    });
  });
};

const updateDescription = () => {
  const current = document.querySelector(".current");
  const title = current.getAttribute("data-title");
  const description = current.getAttribute("data-description");
  if (descriptionTitle && title) {
    descriptionTitle.textContent = title;
  }
  if (descriptionParagraph && description) {
    descriptionParagraph.innerHTML = description;
  }

  // Toggle first-slide class for green ring on first slide
  if (current === slides[0]) {
    nextButton.classList.add("first-slide");
  } else {
    nextButton.classList.remove("first-slide");
  }

  // Update timeline
  updateTimeline();

  // Play media on current slide
  playSlideMedia(current);
};

const animateTap = (tapX, tapY) => {
  return new Promise((resolve) => {
    // Get slider dimensions
    const sliderRect = slider.getBoundingClientRect();

    // Calculate position relative to slider
    const x = sliderRect.width * (parseFloat(tapX) / 100);
    const y = sliderRect.height * (parseFloat(tapY) / 100);

    // Position the tap indicator
    tapIndicator.style.left = x + 'px';
    tapIndicator.style.top = y + 'px';

    // Show the indicator
    tapIndicator.classList.add('active');

    // After moving to position, show tap effect
    setTimeout(() => {
      tapIndicator.classList.add('tapping');

      // Remove tap effect and hide indicator
      setTimeout(() => {
        tapIndicator.classList.remove('tapping');

        setTimeout(() => {
          tapIndicator.classList.remove('active');
          resolve();
        }, 200);
      }, 300);
    }, 400);
  });
};

const nextSlide = async () => {
  if (isAnimating) return;
  isAnimating = true;

  const current = document.querySelector(".current");
  const tapX = current.getAttribute("data-tap-x");
  const tapY = current.getAttribute("data-tap-y");

  // Animate tap on current slide
  await animateTap(tapX, tapY);

  // Stop media on current slide
  stopSlideMedia(current);

  // Transition to next slide
  current.classList.remove("current");
  if (current.nextElementSibling) {
    current.nextElementSibling.classList.add("current");
  } else {
    slides[0].classList.add("current");
  }
  updateDescription();
  isAnimating = false;
};

const prevSlide = () => {
  if (isAnimating) return;
  isAnimating = true;

  const current = document.querySelector(".current");

  // Stop media on current slide
  stopSlideMedia(current);

  // Transition to previous slide (no tap animation for prev)
  current.classList.remove("current");
  if (current.previousElementSibling) {
    current.previousElementSibling.classList.add("current");
  } else {
    slides[slides.length - 1].classList.add("current");
  }
  updateDescription();
  isAnimating = false;
};

nextButton.addEventListener("click", () => {
  nextSlide();
});

prevButton.addEventListener("click", () => {
  prevSlide();
});

// Click on phone/slider to advance (or play/pause video)
slider.addEventListener("click", (e) => {
  const currentSlide = document.querySelector('.current');
  const video = currentSlide.querySelector('video');

  // If current slide has a video and user clicked on/near the video, toggle play/pause
  if (video) {
    toggleVideoPlayPause(video);
  } else {
    // For image slides, advance normally
    nextSlide();
  }
});

// Keyboard navigation with arrow keys
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    nextSlide();
  } else if (e.key === "ArrowLeft") {
    prevSlide();
  }
});

// Pause video/audio when slider is not in view
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      // Slider is not visible, pause all media
      const current = document.querySelector(".current");
      if (current) {
        stopSlideMedia(current);
      }
    }
  });
}, { threshold: 0.1 });

observer.observe(slider);

// Initialize on page load
initializeTimeline();
initializeTimelineDrag();
initializeTimelineClicks();
updateDescription();

// Ensure timeline starts at beginning
const timelineContainer = document.querySelector('.timeline-container');
if (timelineContainer) {
  timelineContainer.scrollLeft = 0;
}
