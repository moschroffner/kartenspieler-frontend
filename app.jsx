import React, { useState, useEffect, useRef } from 'react';

export default function CardGameApp() {
  const [screen, setScreen] = useState('home');
  const [gameType, setGameType] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const pid = Math.random().toString(36).substr(2, 9);
    setPlayerId(pid);

    const ws = new WebSocket('wss://kartenspieler-backend.onrender.com/ws');

    ws.onopen = () => console.log('Connected');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'gameState') setGameState(message.state);
      if (message.type === 'roomCreated') {
        setRoomCode(message.roomCode);
        setGameState(message.state);
        setScreen(gameType === 'watten' ? 'watten' : 'schnellen');
      }
      if (message.type === 'joinedRoom') {
        setScreen(gameType === 'watten' ? 'watten' : 'schnellen');
      }
    };
    ws.onerror = (err) => console.error('WS Error:', err);
    wsRef.current = ws;

    return () => ws.close();
  }, []);

  const sendMessage = (type, data = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, playerId, roomCode, ...data }));
    }
  };

  const createRoom = () => sendMessage('createRoom', { gameType });
  const joinRoom = () => {
    if (inputCode.trim()) {
      sendMessage('joinRoom', { roomCode: inputCode.toUpperCase() });
      setRoomCode(inputCode.toUpperCase());
      setScreen(gameType === 'watten' ? 'watten' : 'schnellen');
    }
  };

  // HOME
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-5xl mb-2">🎴</h1>
          <h1 className="text-4xl font-bold text-white mb-8">Kartenspieler</h1>
          <button
            onClick={() => { setGameType('watten'); setScreen('gameSelect'); }}
            className="w-full mb-4 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg text-lg"
          >
            🎴 Watten
          </button>
          <button
            onClick={() => { setGameType('schnellen'); setScreen('gameSelect'); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-lg"
          >
            ⚡ Schnellen
          </button>
        </div>
      </div>
    );
  }

  // GAME SELECT
  if (screen === 'gameSelect') {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            {gameType === 'watten' ? '🎴 Watten' : '⚡ Schnellen'}
          </h2>
          <button
            onClick={createRoom}
            className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg"
          >
            ➕ Neues Spiel
          </button>
          <div className="mb-4 text-gray-400 text-center">— oder —</div>
          <input
            type="text"
            placeholder="Code eingeben..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded-lg mb-2 text-center uppercase"
          />
          <button
            onClick={joinRoom}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg mb-4"
          >
            ✅ Beitreten
          </button>
          <button
            onClick={() => { setScreen('home'); setGameType(null); }}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded-lg"
          >
            ← Zurück
          </button>
        </div>
      </div>
    );
  }

  // WATTEN
  if (screen === 'watten') {
    return (
      <div className="min-h-screen bg-green-900 p-4">
        <div className="max-w-2xl mx-auto text-white">
          <h1 className="text-3xl mb-4 text-center">🎴 Watten</h1>
          <p className="text-center mb-4">Room: <span className="font-mono font-bold">{roomCode}</span></p>
          {gameState && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-600 p-4 rounded text-center">
                  <p className="text-sm">🔵 Team 1</p>
                  <p className="text-3xl font-bold">{gameState.teams?.[0]?.score || 0}</p>
                </div>
                <div className="bg-red-600 p-4 rounded text-center">
                  <p className="text-sm">🔴 Team 2</p>
                  <p className="text-3xl font-bold">{gameState.teams?.[1]?.score || 0}</p>
                </div>
              </div>
              <div className="bg-slate-800 p-4 rounded text-center">
                <p className="text-sm text-gray-300">Status: {gameState.status}</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // SCHNELLEN
  if (screen === 'schnellen') {
    return (
      <div className="min-h-screen bg-blue-900 p-4">
        <div className="max-w-2xl mx-auto text-white">
          <h1 className="text-3xl mb-4 text-center">⚡ Schnellen</h1>
          <p className="text-center mb-4">Room: <span className="font-mono font-bold">{roomCode}</span></p>
          {gameState && (
            <>
              <div className="bg-slate-800 p-4 rounded text-center mb-4">
                <p className="text-2xl mb-2">Punkte:</p>
                {gameState.players?.map(p => (
                  <p key={p.id} className="text-lg">{p.name}: <span className="font-bold">{p.points}</span></p>
                ))}
              </div>
              <div className="bg-slate-800 p-4 rounded text-center">
                <p className="text-sm text-gray-300">Status: {gameState.status}</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return <div className="text-white text-center mt-10">Verbindung wird hergestellt...</div>;
}
