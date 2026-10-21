// Lets the loader wait until the 3D landmarks are "warm": every shader
// compiled and every model uploaded to the GPU. Without this, the first time
// the camera sees a new landmark the GPU stalls for up to a second (measured:
// ~990 ms), which shows up as a frozen or black screen when scrolling fast.
let resolveWarm;
export const landmarksWarm = new Promise((resolve) => (resolveWarm = resolve));
export const markLandmarksWarm = () => resolveWarm();
