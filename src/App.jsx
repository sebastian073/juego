import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Button, TextInput, Dimensions } from "react-native";
import { collection, addDoc, getDocs } from "firebase/firestore";
import db from "./firebaseConfig";

const { width, height } = Dimensions.get("window");

export default function App() {
  const [name, setName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: width / 2, y: height - 100 });
  const [ballDirection, setBallDirection] = useState({ dx: 3, dy: -3 });
  const [paddlePosition, setPaddlePosition] = useState(width / 2 - 50);
  const [bricks, setBricks] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [scores, setScores] = useState([]);

  // Initialize bricks
  useEffect(() => {
    const rows = 5;
    const columns = 7;
    const brickWidth = width / columns - 10;
    const brickHeight = 20;
    const newBricks = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        newBricks.push({
          x: col * (brickWidth + 10),
          y: row * (brickHeight + 10) + 50,
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
        if (newX <= 0 || newX >= width - 20) {
          setBallDirection((prevDir) => ({ ...prevDir, dx: -prevDir.dx }));
        }
        if (newY <= 0) {
          setBallDirection((prevDir) => ({ ...prevDir, dy: -prevDir.dy }));
        }

        // Check collision with paddle
        if (
          newY >= height - 120 &&
          newX >= paddlePosition &&
          newX <= paddlePosition + 100
        ) {
          setBallDirection((prevDir) => ({ ...prevDir, dy: -prevDir.dy }));
        }

        // Check if ball falls below paddle (game over)
        if (newY >= height) {
          setGameOver(true);
          clearInterval(interval);
          saveScore();
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
      direction === "left"
        ? Math.max(0, prev - 30)
        : Math.min(width - 100, prev + 30)
    );
  };

  // Save score to Firestore
  const saveScore = async () => {
    if (!name.trim()) return;

    try {
      await addDoc(collection(db, "scores"), {
        name,
        score,
        date: new Date(),
      });
      fetchScores();
    } catch (error) {
      console.error("Error saving score: ", error);
    }
  };

  // Fetch scores from Firestore
  const fetchScores = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "scores"));
      const fetchedScores = querySnapshot.docs.map((doc) => doc.data());
      setScores(fetchedScores);
    } catch (error) {
      console.error("Error fetching scores: ", error);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  return (
    <View style={styles.container}>
      {!gameStarted ? (
        <View style={styles.startScreen}>
          <Text style={styles.title}>Breakout Game</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={(text) => setName(text)}
          />
          <Button
            title="Start Game"
            onPress={() => {
              if (name.trim()) {
                setGameStarted(true);
              } else {
                alert("Please enter your name.");
              }
            }}
          />
          <Text style={styles.subtitle}>Leaderboard:</Text>
          {scores.map((player, index) => (
            <Text key={index} style={styles.scoreText}>
              {player.name}: {player.score}
            </Text>
          ))}
        </View>
      ) : (
        <>
          {gameOver && (
            <View style={styles.overlay}>
              <Text style={styles.gameOverText}>Game Over, {name}!</Text>
              <Text style={styles.scoreText}>Your Score: {score}</Text>
              <Button
                title="Restart"
                onPress={() => {
                  setBallPosition({ x: width / 2, y: height - 100 });
                  setBallDirection({ dx: 3, dy: -3 });
                  setPaddlePosition(width / 2 - 50);
                  setGameOver(false);
                  setGameStarted(false);
                  setScore(0); // Reset score
                }}
              />
            </View>
          )}
          <View style={[styles.ball, { top: ballPosition.y, left: ballPosition.x }]} />
          <View style={[styles.paddle, { left: paddlePosition }]} />
          {bricks.map(
            (brick, index) =>
              brick.status === 1 && (
                <View
                  key={index}
                  style={[
                    styles.brick,
                    {
                      top: brick.y,
                      left: brick.x,
                      width: brick.width,
                      height: brick.height,
                    },
                  ]}
                />
              )
          )}
          <View style={styles.controls}>
            <Button title="Left" onPress={() => movePaddle("left")} />
            <Button title="Right" onPress={() => movePaddle("right")} />
          </View>
          <Text style={styles.score}>Score: {score}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  startScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  title: {
    fontSize: 30,
    color: "#FFF",
    marginBottom: 20,
  },
  input: {
    height: 40,
    width: "80%",
    backgroundColor: "#FFF",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  ball: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF5722",
  },
  paddle: {
    position: "absolute",
    bottom: 20,
    width: 100,
    height: 20,
    backgroundColor: "#4CAF50",
    borderRadius: 5,
  },
  brick: {
    position: "absolute",
    backgroundColor: "#FFC107",
  },
  controls: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  gameOverText: {
    fontSize: 30,
    color: "#FFF",
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 20,
    color: "#FFF",
  },
  score: {
    position: "absolute",
    top: 40,
    left: 20,
    fontSize: 20,
    color: "#FFF",
  },
});
