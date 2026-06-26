import { useState, useCallback } from "react";
import { useChat } from "../../context/ChatContext";

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

const checkWinner = (board) => {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], line: [a,b,c] };
  }
  return null;
};

const EMPTY = Array(9).fill(null);

export default function WordGameWidget({ onClose }) {
  const { sendMessage } = useChat();
  const [board,  setBoard]  = useState(EMPTY);
  const [turn,   setTurn]   = useState("X");
  const [shared, setShared] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0 });

  const result   = checkWinner(board);
  const winner   = result?.winner;
  const winLine  = result?.line || [];
  const isDraw   = !winner && board.every(Boolean);
  const gameOver = winner || isDraw;

  const handleClick = useCallback((i) => {
    if (board[i] || gameOver) return;
    const next = [...board];
    next[i] = turn;
    const res = checkWinner(next);
    if (res) setScores(s => ({ ...s, [res.winner]: s[res.winner] + 1 }));
    setBoard(next);
    setTurn(t => t === "X" ? "O" : "X");
  }, [board, turn, gameOver]);

  const reset = () => { setBoard(EMPTY); setTurn("X"); setShared(false); };

  const shareResult = async () => {
    const emoji = board.map(v => v === "X" ? "❌" : v === "O" ? "⭕" : "⬜");
    const grid  = [
      emoji.slice(0,3).join(""),
      emoji.slice(3,6).join(""),
      emoji.slice(6,9).join(""),
    ].join("\n");
    const msg = winner
      ? `🎮 Tic Tac Toe — ${winner === "X" ? "❌" : "⭕"} wins!\n\n${grid}`
      : `🎮 Tic Tac Toe — It's a draw!\n\n${grid}`;
    await sendMessage(msg, "text");
    setShared(true);
    setTimeout(onClose, 800);
  };

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.header}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:24}}>🎮</span>
            <div>
              <h3 style={S.title}>Tic Tac Toe</h3>
              <p style={S.sub}>2 players · same device</p>
            </div>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        <div style={S.scores}>
          <div style={{...S.scoreBox,...(turn==="X"&&!gameOver?S.scoreActive:{})}}>
            <span style={{fontSize:22}}>❌</span>
            <span style={S.scoreNum}>{scores.X}</span>
            <span style={S.scoreLabel}>Player X</span>
          </div>
          <div style={S.vs}>VS</div>
          <div style={{...S.scoreBox,...(turn==="O"&&!gameOver?S.scoreActive:{})}}>
            <span style={{fontSize:22}}>⭕</span>
            <span style={S.scoreNum}>{scores.O}</span>
            <span style={S.scoreLabel}>Player O</span>
          </div>
        </div>

        <div style={S.status}>
          {gameOver
            ? winner
              ? <span style={{color:winner==="X"?"#6366f1":"#a855f7",fontWeight:700}}>{winner==="X"?"❌":"⭕"} Player {winner} wins! 🎉</span>
              : <span style={{color:"#f59e0b",fontWeight:700}}>It's a draw! 🤝</span>
            : <span>Turn: <strong style={{color:turn==="X"?"#6366f1":"#a855f7"}}>{turn==="X"?"❌ X":"⭕ O"}</strong></span>
          }
        </div>

        <div style={S.board}>
          {board.map((cell,i) => (
            <button key={i} onClick={() => handleClick(i)}
              style={{...S.cell,...(winLine.includes(i)?S.cellWin:{}),cursor:cell||gameOver?"default":"pointer",fontSize:cell?32:14}}>
              {cell==="X"?"❌":cell==="O"?"⭕":""}
            </button>
          ))}
        </div>

        <div style={S.actions}>
          <button onClick={reset} style={S.resetBtn}>🔄 New Game</button>
          {gameOver && (
            <button onClick={shareResult} disabled={shared} style={S.shareBtn}>
              {shared?"Shared! ✓":"📤 Share result"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay:     {position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(0,0,0,0.6)"},
  modal:       {width:"100%",maxWidth:360,background:"#1a1a2e",border:"1px solid rgba(255,255,255,.1)",borderRadius:24,overflow:"hidden",boxShadow:"0 25px 60px rgba(0,0,0,0.5)"},
  header:      {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 20px 16px",borderBottom:"1px solid rgba(255,255,255,.08)"},
  title:       {fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:"#fff",margin:0},
  sub:         {fontSize:11,color:"rgba(255,255,255,.35)",margin:"2px 0 0"},
  closeBtn:    {background:"none",border:"none",color:"rgba(255,255,255,.4)",fontSize:18,cursor:"pointer",padding:4,lineHeight:1},
  scores:      {display:"flex",alignItems:"center",justifyContent:"center",gap:16,padding:"16px 20px"},
  scoreBox:    {display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"12px 24px",borderRadius:14,background:"rgba(255,255,255,.04)",border:"2px solid transparent",transition:"all .2s",flex:1},
  scoreActive: {border:"2px solid rgba(99,102,241,.5)",background:"rgba(99,102,241,.1)"},
  scoreNum:    {fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:28,color:"#fff",lineHeight:1},
  scoreLabel:  {fontSize:10,color:"rgba(255,255,255,.35)",textTransform:"uppercase",letterSpacing:".06em"},
  vs:          {fontSize:12,fontWeight:700,color:"rgba(255,255,255,.2)",flexShrink:0},
  status:      {textAlign:"center",padding:"0 20px 14px",fontSize:14,color:"rgba(255,255,255,.6)"},
  board:       {display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,padding:"0 20px 20px"},
  cell:        {aspectRatio:"1",borderRadius:14,background:"rgba(255,255,255,.06)",border:"1.5px solid rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"},
  cellWin:     {background:"rgba(99,102,241,.2)",border:"1.5px solid rgba(99,102,241,.5)"},
  actions:     {display:"flex",gap:8,padding:"0 20px 20px"},
  resetBtn:    {flex:1,padding:"11px 0",borderRadius:12,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer"},
  shareBtn:    {flex:1,padding:"11px 0",borderRadius:12,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer"},
};
