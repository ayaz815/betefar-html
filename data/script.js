document.addEventListener("DOMContentLoaded", async function () {
  const jsonFilePath = ".././content/content.json";

  fetch(jsonFilePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load JSON file: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("JSON Data Loaded:", data);

      // Get the current screen ID (assuming it's in the body `id`)
      const screenId = document.body.id; // e.g., "screen1", "screen2"
      const screenData = data[screenId];

      console.log(screenId, screenData);

      if (screenData) {
        // Update HTML elements by their IDs
        document.getElementById("question-text").textContent =
          screenData.question || "Default Question";
        document.getElementById("answer-text").textContent =
          screenData.answer || "Default Answer";

        const firmNamingElement = document.querySelector(
          ".title-section h1:nth-child(2)"
        );
        if (firmNamingElement) {
          firmNamingElement.textContent =
            screenData.firmNaming || "Default Firm Naming";
        }
      } else {
        console.warn(`No data found for screen: ${screenId}`);
      }
    })
    .catch((error) => {
      console.error("Error loading JSON file:", error);
    });

  // Fetch the screen number from the URL or assign manually
  const screenNumber = parseInt(
    window.location.href.match(/screen(\d+)/)?.[1] || 1
  ); // Defaults to screen1

  // Target the current screen music file only
  const musicButtons = document.querySelectorAll(".play-btn");
  const musicImages = document.querySelectorAll(".play-btn img");
  const seekBar = document.getElementById("seekBar1"); // Reference to the seek bar

  // Load a single audio file specific to this screen
  const musicAudio = new Audio(`../musicFiles/music${screenNumber}.mp3`);

  let musicPlaying = false; // Only one track per screen

  // Ensure seekBar exists before initializing
  if (seekBar) {
    seekBar.value = 0;
  }

  // Loop through all music buttons (if multiple buttons on one screen)
  musicButtons.forEach((button, index) => {
    const musicImage = musicImages[index];

    button.addEventListener("click", () => {
      // New Logic: Stop all speaker audios before playing music
      speakerAudios.forEach((speakerAudio, i) => {
        if (!speakerAudio.paused) {
          speakerAudio.pause();
          speakerImages[i].style.opacity = "0.7";
          speakerMuted[i] = true;
        }
      });

      musicPlaying = !musicPlaying;

      if (musicPlaying) {
        musicAudio
          .play()
          .catch((err) => console.error("Music audio play error:", err));
        musicImage.src = "../assets/play-red2.png"; // Change to pause icon
      } else {
        musicAudio.pause();
        musicImage.src = "../assets/play-red1.png"; // Change back to play icon
      }
    });

    // Reset when audio ends
    musicAudio.addEventListener("ended", () => {
      musicImage.src = "../assets/play-red1.png";
      musicPlaying = false;
      if (seekBar) {
        seekBar.value = 0;
      }
    });

    // Update seek bar progress
    musicAudio.addEventListener("timeupdate", () => {
      if (seekBar) {
        seekBar.value = (musicAudio.currentTime / musicAudio.duration) * 100;
      }
    });

    // Allow manual seeking
    if (seekBar) {
      seekBar.addEventListener("input", () => {
        musicAudio.currentTime = (seekBar.value / 100) * musicAudio.duration;
      });
    }
  });

  // ---------------------- Speaker Button Logic (Completely Independent) -------------------------
  const speakerButtons = document.querySelectorAll(".speaker-btn");
  const speakerImages = document.querySelectorAll(".speaker-btn img");

  // Load separate speaker audio files for each button
  const speakerAudios = Array.from(
    { length: 16 },
    (_, index) => new Audio(`../audioFiles/audio${index + 1}.mp3`)
  );

  let speakerMuted = Array(16).fill(false);
  let speakerPlayedOnce = Array(16).fill(false); // Track if audio has been played before

  // Loop through all speaker buttons for handling their respective audio
  speakerButtons.forEach((button, index) => {
    const speakerAudio = speakerAudios[index];
    const speakerImage = speakerImages[index];

    button.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent toggling the question by mistake

      // New Logic: Pause music when a speaker button is pressed
      if (musicPlaying) {
        musicAudio.pause();
        musicImages.forEach((img) => (img.src = "../assets/play-red1.png"));
        musicPlaying = false;
      }

      // If the audio has never been played, start playing it
      if (!speakerPlayedOnce[index]) {
        speakerAudio
          .play()
          .then(() => {
            speakerImage.style.filter = "none";
            speakerImage.style.opacity = "1";
            speakerMuted[index] = false;
            speakerPlayedOnce[index] = true;
          })
          .catch((err) => console.error("Speaker audio play error:", err));
        return;
      }

      // If it has already played, toggle between mute and unmute
      speakerMuted[index] = !speakerMuted[index];

      if (speakerMuted[index]) {
        speakerAudio.pause();
        speakerImage.style.opacity = "0.7";
      } else {
        speakerAudio
          .play()
          .catch((err) => console.error("Speaker audio play error:", err));
        speakerImage.style.filter = "none";
        speakerImage.style.opacity = "1";
      }
    });
  });

  // ---------------------- Answer Toggle Logic -------------------------
  const answerDiv = document.querySelector(".toggle-answer-area");

  // Select all paragraphs inside the answer area
  const answerText = answerDiv
    ? answerDiv.querySelectorAll(".answer-text")
    : [];

  // Add the click event listener to the parent for toggling
  if (answerDiv) {
    answerDiv.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent conflicts with other elements

      if (answerText.length > 1) {
        // Toggle between showing and hiding the second paragraph with fade effect
        const secondParagraph = answerText[1];
        if (secondParagraph.classList.contains("opacity-0")) {
          secondParagraph.classList.remove("opacity-0", "pointer-events-none");
        } else {
          secondParagraph.classList.add("opacity-0", "pointer-events-none");
        }
      }
    });
  }

  // Ensure the second paragraph is hidden initially
  if (answerText.length > 1) {
    answerText[1].classList.add("opacity-0", "pointer-events-none");
  }

  // Select all tooltips for speaker and play buttons
  const tooltips = document.querySelectorAll(".tooltip");

  // Function to handle tooltip visibility with timeout logic
  tooltips.forEach((tooltip) => {
    const parentButton = tooltip.closest(".group");

    parentButton.addEventListener("mouseenter", () => {
      // Show the tooltip
      tooltip.classList.remove("opacity-0");
      tooltip.classList.add("opacity-100");

      // Set a timeout to hide the tooltip after 3 seconds
      setTimeout(() => {
        tooltip.classList.remove("opacity-100");
        tooltip.classList.add("opacity-0");
      }, 3000); // Tooltip disappears after 3 seconds
    });
  });

  // ---------------------- Fullscreen Logic with Top 10% Interactive Area -------------------------
  function setupDoubleTapListeners(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    // Create an interactive top 10% area for fullscreen activation
    const topRegion = document.createElement("div");
    topRegion.style.position = "absolute";
    topRegion.style.top = "0";
    topRegion.style.left = "0";
    topRegion.style.width = "100%";
    topRegion.style.height = "10%";
    topRegion.style.cursor = "pointer";
    topRegion.style.zIndex = "100";

    // Attach double-click event to trigger fullscreen
    topRegion.addEventListener("dblclick", toggleFullScreen);

    // Add hover message
    const hoverMessage = document.createElement("div");
    hoverMessage.textContent = "Maximize screen";
    hoverMessage.style.position = "absolute";
    hoverMessage.style.top = "50%";
    hoverMessage.style.left = "50%";
    hoverMessage.style.transform = "translate(-50%, -50%)";
    hoverMessage.style.color = "white";
    hoverMessage.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    hoverMessage.style.padding = "5px 10px";
    hoverMessage.style.borderRadius = "8px";
    hoverMessage.style.fontSize = "14px";
    hoverMessage.style.opacity = "0";
    hoverMessage.style.transition = "opacity 0.5s";

    // Show the hover message only on hover
    topRegion.addEventListener("mouseenter", () => {
      hoverMessage.style.opacity = "1";
    });
    topRegion.addEventListener("mouseleave", () => {
      hoverMessage.style.opacity = "0";
    });

    // Add the hover message and top area to the panel
    topRegion.appendChild(hoverMessage);
    panel.style.position = "relative";
    panel.appendChild(topRegion);
  }

  // Function to toggle fullscreen mode
  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error entering fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // Apply fullscreen listeners to multiple panels
  const panels = [
    "screen2FullScreen",
    "middlePanel",
    "rightPanel",
    "lefttPanel",
    "leftttPanel",
  ];
  panels.forEach((panelId) => setupDoubleTapListeners(panelId));
});

// document.addEventListener("DOMContentLoaded", function () {
//   // Dynamically generate the music elements
//   const musicContainer = document.getElementById("musicContainer");
//   for (let i = 1; i <= 16; i++) {
//     const formattedNumber = i.toString().padStart(2, "0") + ".";
//     musicContainer.innerHTML += `
//                 <div class="flex flex-col items-center justify-start bg-black">
//                     <p class="sm:text-4xl text-5xl text-center text-gray-300 px-[5%] pt-1 font-agency">
//                         ${formattedNumber}
//                     </p>
//                     <p class="sm:text-4xl text-5xl text-center text-gray-300 px-[5%] pt-1 font-agency">
//                         Name of Music
//                     </p>
//                     <button
//                         id="playBtn${i}"
//                         class="play-btn bg-transparent hover:border-none border-none focus-visible:outline-none focus:outline-none transition-transform duration-300 hover:scale-105"
//                     >
//                         <img
//                             id="playImg${i}"
//                             src="../assets/play-red1.png"
//                             alt="Play"
//                             class="py-5 sm:py-2 sm:w-17 w-16"
//                         />
//                     </button>
//                     <input
//                         type="range"
//                         id="seekBar${i}"
//                         class="seek-bar w-[80%] h-[3px] my-2 bg-gray-300 accent-gray-500 rounded-lg cursor-pointer focus:outline-none"
//                     />
//                   </div>`;
//   }

//   // JavaScript to handle multiple audio files after elements are generated
//   const playButtons = document.querySelectorAll(".play-btn");
//   const playImages = document.querySelectorAll("[id^=playImg]");
//   const seekBars = document.querySelectorAll(".seek-bar");
//   const audioFiles = Array.from(
//     { length: 16 },
//     (_, index) => new Audio(`../musicFiles/music${index + 1}.mp3`)
//   );
//   let isPlaying = Array(16).fill(false);

//   // Initialize all seek bars to 0
//   seekBars.forEach((seekBar) => {
//     seekBar.value = 0;
//   });

//   playButtons.forEach((button, index) => {
//     const audio = audioFiles[index];
//     const playImage = playImages[index];
//     const seekBar = seekBars[index];

//     button.addEventListener("click", () => {
//       if (isPlaying[index]) {
//         audio.pause();
//         playImage.src = "../assets/play-red1.png";
//       } else {
//         audioFiles.forEach((otherAudio, i) => {
//           if (i !== index) {
//             otherAudio.pause();
//             playImages[i].src = "../assets/play-red1.png";
//             isPlaying[i] = false;
//           }
//         });
//         audio.play().catch((err) => console.error("Audio play error:", err));
//         playImage.src = "../assets/play-red2.png";
//       }
//       isPlaying[index] = !isPlaying[index];
//     });

//     audio.addEventListener("timeupdate", () => {
//       seekBar.value = (audio.currentTime / audio.duration) * 100;
//     });

//     seekBar.addEventListener("input", () => {
//       audio.currentTime = (seekBar.value / 100) * audio.duration;
//     });

//     audio.addEventListener("ended", () => {
//       playImage.src = "../assets/play-red1.png";
//       isPlaying[index] = false;
//       seekBar.value = 0;
//     });
//   });
// });

// ---------------------- Fullscreen and Navigation Logic -------------------------

// Function to set up top, left, and right zones for each panel
function setupInteractiveZones(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return; // Prevent errors if the panel does not exist

  panel.style.position = "relative"; // Ensure relative positioning for absolute child elements

  // ---------------- Top 10% Zone (Fullscreen Toggle) ----------------
  const topRegion = createInteractionZone(
    "0%",
    "0%",
    "100%",
    "10%",
    "Double-click to Maximize"
  );
  topRegion.addEventListener("dblclick", toggleFullScreen);
  panel.appendChild(topRegion);

  // ---------------- Left 10% Zone (Left Navigation) ----------------
  const leftRegion = createInteractionZone(
    "0%",
    "0%",
    "10%",
    "100%",
    "← Navigate Left"
  );
  leftRegion.addEventListener("click", () => navigateLeft(panelId));
  panel.appendChild(leftRegion);

  // ---------------- Right 10% Zone (Right Navigation) ----------------
  const rightRegion = createInteractionZone(
    "90%",
    "0%",
    "10%",
    "100%",
    "→ Navigate Right"
  );
  rightRegion.addEventListener("click", () => navigateRight(panelId));
  panel.appendChild(rightRegion);
}

// Function to create a reusable interactive zone
function createInteractionZone(left, top, width, height, hoverText) {
  const region = document.createElement("div");
  region.style.position = "absolute";
  region.style.left = left;
  region.style.top = top;
  region.style.width = width;
  region.style.height = height;
  region.style.cursor = "pointer";
  region.style.zIndex = "100";

  // Hover Message
  const hoverMessage = document.createElement("div");
  hoverMessage.textContent = hoverText;
  hoverMessage.style.position = "absolute";
  hoverMessage.style.top = "50%";
  hoverMessage.style.left = "50%";
  hoverMessage.style.transform = "translate(-50%, -50%)";
  hoverMessage.style.color = "white";
  hoverMessage.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  hoverMessage.style.padding = "5px 10px";
  hoverMessage.style.borderRadius = "8px";
  hoverMessage.style.fontSize = "14px";
  hoverMessage.style.opacity = "0";
  hoverMessage.style.transition = "opacity 0.5s";

  // Show message on hover
  region.addEventListener("mouseenter", () => {
    hoverMessage.style.opacity = "1";
  });
  region.addEventListener("mouseleave", () => {
    hoverMessage.style.opacity = "0";
  });

  region.appendChild(hoverMessage);
  return region;
}

// // ---------------------- Fullscreen Logic -------------------------
// function toggleFullScreen() {
//   if (!document.fullscreenElement) {
//     document.documentElement.requestFullscreen().catch((err) => {
//       console.error("Error entering fullscreen:", err);
//     });
//   } else {
//     document.exitFullscreen();
//   }
// }

// // ---------------------- Navigation Logic -------------------------
// function navigateLeft(panelId) {
//   console.log(`Navigated Left from ${panelId}`);
//   alert(`Navigated Left from ${panelId}`);
// }

// function navigateRight(panelId) {
//   console.log(`Navigated Right from ${panelId}`);
//   alert(`Navigated Right from ${panelId}`);
// }

// // ---------------------- Apply Logic to Panels -------------------------
// const panels = [
//   "screen2FullScreen",
//   "middlePanel",
//   "rightPanel",
//   "lefttPanel",
//   "leftttPanel",
// ];
// panels.forEach((panelId) => setupInteractiveZones(panelId));

function navigateToScreen(targetScreen) {
  window.location.href = targetScreen;
}

// Smooth Navigation with Tailwind
function navigateToScreen(url) {
  const mainContainer = document.getElementById("screen2FullScreen");

  // Add Tailwind classes for fade-out effect
  mainContainer.classList.add(
    "opacity-0",
    "transition-opacity",
    "duration-500"
  );

  // Redirect after transition completes
  setTimeout(() => {
    window.location.href = url;
  }, 500); // Matches Tailwind's 500ms duration
}

// Ensure the screen fades in on load
window.addEventListener("load", () => {
  const mainContainer = document.getElementById("screen2FullScreen");
  mainContainer.classList.remove("opacity-0");
  mainContainer.classList.add(
    "opacity-100",
    "transition-opacity",
    "duration-500"
  );
});

const showButton = document.querySelector(
  "[data-drawer-show='drawer-bottom-example']"
);
const drawer = document.getElementById("drawer-bottom-example");
const closeButton = drawer.querySelector(
  "[data-drawer-hide='drawer-bottom-example']"
);

// Show drawer when the button is clicked
showButton.addEventListener("click", () => {
  drawer.classList.remove("transform-none");
  drawer.classList.add("translate-y-0");
});

// Hide drawer when the close button is clicked
closeButton.addEventListener("click", () => {
  drawer.classList.remove("translate-y-0");
  drawer.classList.add("transform-none");
});
