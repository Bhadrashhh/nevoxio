# Nevoxio

> Next-Gen IT Solutions, Mobile Apps & Web Engineering

A high-performance, immersive web application featuring interactive Three.js 3D background visualisations, GSAP smooth animations, glassmorphism aesthetics, and responsive digital craftsmanship.

---

## 🚀 Getting Started

### Local Development Preview

You can run a lightweight local server without external dependencies:

```bash
# Using Python
python -m http.server 3000

# Or using Node.js / npx
npx serve .
```

Then open your browser and navigate to:
**`http://localhost:3000`**

---

## 📁 Project Structure

```
Nevoxio/
├── assets/
│   ├── css/
│   │   └── style.css            # Custom responsive styles & theme tokens
│   ├── js/
│   │   ├── app.js               # UI interactivity & dynamic logic
│   │   ├── background3d.js      # Three.js 3D canvas background experience
│   │   ├── gsap.min.js          # GSAP animation library
│   │   └── three.min.js         # Three.js library
│   ├── images/
│   │   └── projects/            # Portfolio showcase assets
│   └── nevoxio_logo_white.png   # Brand logos & favicons
├── index.html                   # Main landing page
└── .gitignore                   # Git ignore rules
```

---

## 🤝 Collaborative Git Workflow

1. **Pull latest changes before starting work:**
   ```bash
   git pull origin main
   ```

2. **Create a feature branch for your work:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Stage and commit your changes:**
   ```bash
   git add .
   git commit -m "feat: describe the changes made"
   ```

4. **Push your branch to GitHub:**
   ```bash
   git push -u origin feature/your-feature-name
   ```

5. **Open a Pull Request on GitHub** to review and merge into `main`.
