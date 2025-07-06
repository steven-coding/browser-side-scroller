# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based side-scroller game project that is currently in its initial setup phase. The repository contains only a README.md file and has just been initialized with git.

## Current State

The project is in early development with no code structure established yet. Future development will likely include:
- HTML/CSS/JavaScript game files
- Asset management for sprites and audio
- Game engine or framework setup
- Build/deployment configuration

## Development Setup

**Prerequisites:**
- Node.js (v18+)
- npm or yarn

**Installation:**
```bash
npm install
```

**Development Commands:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

**Note:** If you encounter permission issues with npm in WSL, try running from Windows Command Prompt/PowerShell instead.

## Architecture

**Current Structure:**
- `/src/main.ts` - Entry point that instantiates and runs the game
- `/src/browser-side-scroller.ts` - Main game class containing all game logic
- `/index.html` - HTML template with canvas element
- Canvas-based 2D rendering using native browser APIs
- Object-oriented game architecture with TypeScript classes

**Key Components:**
- `BrowserSideScroller` class with encapsulated game state
- Game loop with update/render cycle using requestAnimationFrame
- Input handling system with keyboard events
- Basic physics (gravity, collision detection)
- Player entity with movement and jumping mechanics

**Development Approach:**
- Custom game engine built from scratch
- TypeScript for type safety
- Vite for fast development and bundling
- Modular architecture as the project grows
- Kebab-case file naming convention (e.g., `browser-side-scroller.ts`)