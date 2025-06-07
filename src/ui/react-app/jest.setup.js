require('@testing-library/jest-dom');

// A more aggressive mock for PointerEvent and related functions
global.PointerEvent = class PointerEvent extends Event {};
global.HTMLElement.prototype.hasPointerCapture = () => false;
global.HTMLElement.prototype.releasePointerCapture = () => {};
global.HTMLElement.prototype.scrollIntoView = () => {}; 