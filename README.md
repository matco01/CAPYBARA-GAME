# Capybara Dino Game

An exact replica of the Google Chrome Dino game with a capybara theme!

## Features

- **Authentic Gameplay**: Jump mechanics, obstacle avoidance, and scoring system identical to the original
- **Progressive Difficulty**: Game speed increases every 100 points
- **High Score Tracking**: Saves your best score locally
- **Responsive Design**: Works on desktop and mobile devices
- **Capybara Theme**: Ready for custom capybara graphics (currently using placeholder shapes)

## How to Play

1. Open `index.html` in your web browser
2. Press **SPACE** or **↑** (Up Arrow) to start the game
3. Press **SPACE** or **↑** to make the capybara jump
4. Avoid cacti and birds to keep running
5. Try to beat your high score!

## Controls

- **Desktop**: SPACE bar or Up Arrow key
- **Mobile**: Tap the screen
- **Restart**: Click the restart button or press SPACE/↑ when game over

## File Structure

- `index.html` - Main game page
- `style.css` - Game styling and layout
- `game.js` - Complete game logic and mechanics
- `README.md` - This file

## Customization

The game is ready for your capybara PNG images! Simply replace the placeholder graphics in the `drawPlayer()`, `drawCactus()`, and `drawBird()` functions in `game.js` with your custom images.

## Technical Details

- Built with vanilla HTML5 Canvas
- 60 FPS game loop
- Pixel-perfect collision detection
- Local storage for high scores
- Mobile-friendly touch controls
