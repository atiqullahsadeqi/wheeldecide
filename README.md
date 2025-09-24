🎡 Wheel Decide Project – Cursor Rules
🔹 General Rules

Use Next.js (or React) with TypeScript for clean structure.

Use Tailwind CSS for styling (dark background, neon highlights).

Keep all reusable logic (like spinning the wheel) inside hooks.

Organize components into components/ (e.g., Wheel.tsx, WheelOption.tsx).

Maintain accessibility (keyboard + screen readers).

🔹 Wheel Design Rules

The wheel must look like the reference:

Circular wheel with evenly divided colored slices.

A center text that shows the selected option.

A spin button below the wheel.

Background = black, wheel slices = yellow + black alternating.

Use CSS transforms for rotation.

Add smooth spin animation using GSAP or Framer Motion.

Ensure the wheel stops at a random slice but aligns perfectly to its center.

🔹 Data & Options

Keep options editable in a JSON file (choices.json).
Example:

["Read a book", "Dance", "Phone your family", "Prepare food"]


Load options dynamically into the wheel.

Allow up to 100 choices.

🔹 Functionality Rules

On clicking Spin, the wheel rotates randomly between 3–6 full turns before landing.

Highlight the selected slice and display the result text in bold.

Add a reset button to spin again.

Ensure fairness: randomization must be uniform.

🔹 Extra Features

Add a sound effect when spinning and when stopping.

Add a “Modify Wheel” modal to edit items (like in your screenshot).

Allow users to save & load wheels locally (localStorage).

Provide an embed code for sharing wheels."# wheeldecide" 
"# wheeldecide" 
