# K Chetan Kumar — Premium 3D Portfolio

A production-style, dependency-light portfolio using the supplied GLB directly with Three.js/WebGL.

## Run locally

Because browsers restrict local GLB loading from `file://`, start a local static server in this folder:

### Python
```bash
python -m http.server 5173
```
Then open `http://localhost:5173`.

### VS Code
Use any local static-server extension and open `index.html` through the server.

## Included
- Supplied 3D GLB at `assets/chetan-kumar.glb`
- Supplied resume at `assets/resume.pdf`
- Continuous 360° Three.js rotation
- Mouse/touch drag, inertia and damping
- Angle indicator tied to actual model rotation
- Auto rotation with pause control
- Cinematic glass UI
- Responsive mobile navigation
- Scroll-aware active navigation
- Reduced-motion support
- GLB loading progress and graceful failure state
- Education, certifications, training and real academic project content from the supplied resume

The only external runtime dependencies are Three.js and GLTFLoader loaded from jsDelivr. The supplied GLB itself is not replaced or converted.
