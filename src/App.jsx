import React, { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [name, setName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 80 });
  const [ballDirection, setBallDirection] = useState({ dx: 3, dy: -3 });
  const [paddlePosition, setPaddlePosition] = useState(45);
  const [bricks, setBricks] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  // Initialize bricks
  useEffect(() => {
    const rows = 5;
    const columns = 7;
    const brickWidth = 12;
    const brickHeight = 4;
    const newBricks = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        newBricks.push({
          x: col * (brickWidth + 1),
          y: row * (brickHeight + 1) + 5,
          width: brickWidth,
          height: brickHeight,
          status: 1,
        });
      }
    }
    setBricks(newBricks);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver || !gameStarted) return;

    const interval = setInterval(() => {
      setBallPosition((prev) => {
        const newX = prev.x + ballDirection.dx;
        const newY = prev.y + ballDirection.dy;

        // Check collisions with walls
        if (newX <= 0 || newX >= 100 - 2) {
          setBallDirection((prevDir) => ({ ...prevDir, dx: -prevDir.dx }));
        }
        if (newY <= 0) {
          setBallDirection((prevDir) => ({ ...prevDir, dy: -prevDir.dy }));
        }

        // Check collision with paddle
        if (newY >= 90 && newX >= paddlePosition && newX <= paddlePosition + 10) {
          setBallDirection((prevDir) => ({ ...prevDir, dy: -prevDir.dy }));
        }

        // Check if ball falls below paddle (game over)
        if (newY >= 100) {
          setGameOver(true);
          clearInterval(interval);
        }

        // Check collision with bricks
        setBricks((prevBricks) =>
          prevBricks.map((brick) => {
            if (
              brick.status === 1 &&
              newX >= brick.x &&
              newX <= brick.x + brick.width &&
              newY >= brick.y &&
              newY <= brick.y + brick.height
            ) {
              setBallDirection((prevDir) => ({ ...prevDir, dy: -prevDir.dy }));
              setScore((prevScore) => prevScore + 10); // Increment score
              return { ...brick, status: 0 };
            }
            return brick;
          })
        );

        return { x: newX, y: newY };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [ballDirection, paddlePosition, gameOver, gameStarted]);

  // Move paddle
  const movePaddle = (direction) => {
    setPaddlePosition((prev) =>
      direction === "left" ? Math.max(0, prev - 5) : Math.min(90, prev + 5)
    );
  };

  return (
    <div className="game-container">
      {!gameStarted ? (
        <div className="start-screen">
          <h1>Breakout Game</h1>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={() => {
              if (name.trim()) {
                setGameStarted(true);
              } else {
                alert("Please enter your name.");
              }
            }}
          >
            Start Game
          </button>
        </div>
      ) : (
        <>
          {gameOver && (
            <div className="overlay">
              <h2>Game Over, {name}!</h2>
              <p>Your Score: {score}</p>
              <button
                onClick={() => {
                  setBallPosition({ x: 50, y: 80 });
                  setBallDirection({ dx: 3, dy: -3 });
                  setPaddlePosition(45);
                  setGameOver(false);
                  setGameStarted(false);
                  setScore(0); // Reset score
                }}
              >
                Restart
              </button>
            </div>
          )}
          <div
            className="ball"
            style={{
              top: `${ballPosition.y}%`,
              left: `${ballPosition.x}%`,
            }}
          ></div>
          <div
            className="paddle"
            style={{ left: `${paddlePosition}%` }}
          ></div>
          {bricks.map(
            (brick, index) =>
              brick.status === 1 && (
                <div
                  key={index}
                  className="brick"
                  style={{
                    top: `${brick.y}%`,
                    left: `${brick.x}%`,
                    width: `${brick.width}%`,
                    height: `${brick.height}%`,
                  }}
                ></div>
              )
          )}
          <div className="controls">
            <button onClick={() => movePaddle("left")}>Left</button>
            <button onClick={() => movePaddle("right")}>Right</button>
          </div>
          <div className="score">Score: {score}</div>
        </>
      )}
    </div>
  );
}
