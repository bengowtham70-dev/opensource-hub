---
name: animated-component-libraries
description: Pre-built animated component library patterns combining Magic UI and React Bits for animated gradient border beams, shimmer buttons, blurred text reveals, and dynamic background grids.
---

# Animated Component Libraries (Magic UI & React Bits)

## 1. Animated Gradient Border Beams
A continuous moving gradient light that travels along the border of glass cards:

```css
@keyframes borderBeam {
  100% {
    offset-distance: 100%;
  }
}

.border-beam {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  mask: linear-gradient(transparent, transparent), linear-gradient(#fff, #fff);
  mask-clip: padding-box, border-box;
  mask-composite: intersect;
}

.border-beam::after {
  content: "";
  position: absolute;
  aspect-ratio: 1;
  width: 200px;
  background: linear-gradient(to left, #6366f1, #10b981, transparent);
  offset-path: rect(0 auto auto 0 round 16px);
  animation: borderBeam 6s linear infinite;
}
```

## 2. Shimmer & Tactile Glass Buttons
```css
.shimmer-button {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(16, 185, 129, 0.2));
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  backdrop-filter: blur(12px);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.shimmer-button:hover {
  transform: translateY(-2px);
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.3);
}

.shimmer-button:active {
  transform: scale(0.97);
}
```

## 3. Dynamic Animated Grid & Mask Patterns
```css
.mesh-glow-bg {
  background-image: 
    radial-gradient(at 27% 37%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
    radial-gradient(at 97% 21%, rgba(16, 185, 129, 0.1) 0px, transparent 50%),
    radial-gradient(at 52% 99%, rgba(6, 182, 212, 0.12) 0px, transparent 50%);
}
```
