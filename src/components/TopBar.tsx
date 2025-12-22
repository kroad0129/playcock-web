import React from "react";

export default function TopBar(props: {
  isRunning: boolean;
  onOpenManage: () => void;
  onOpenEditParticipants: () => void;
  onStart: () => void;
  onEnd: () => void;
  startDisabled: boolean;
}) {
  const {
    isRunning,
    onOpenManage,
    onOpenEditParticipants,
    onStart,
    onEnd,
    startDisabled,
  } = props;

  return (
    <header style={S.topBar}>
      <div style={S.brand}>PLAYCOCK</div>

      <div style={S.actions}>
        <button style={S.btnGhost} onClick={onOpenManage} type="button">
          부원 관리
        </button>

        {isRunning ? (
          <>
            <button
              style={S.btnGhost}
              onClick={onOpenEditParticipants}
              type="button"
            >
              참가자 수정
            </button>
            <button style={S.btnDanger} onClick={onEnd} type="button">
              활동 종료
            </button>
          </>
        ) : (
          <button
            style={{
              ...S.btnPrimary,
              opacity: startDisabled ? 0.5 : 1,
              cursor: startDisabled ? "not-allowed" : "pointer",
            }}
            onClick={onStart}
            disabled={startDisabled}
            type="button"
          >
            활동 시작
          </button>
        )}
      </div>
    </header>
  );
}

const S: Record<string, React.CSSProperties> = {
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    background: "white",
    borderBottom: "1px solid #e8e8ef",
    gap: 10,
  },
  brand: { fontSize: 18, fontWeight: 900, letterSpacing: 0.2 },
  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "none",
    background: "#2b57ff",
    color: "white",
    fontWeight: 900,
    fontSize: 14,
  },
  btnDanger: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "none",
    background: "#ff3b30",
    color: "white",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
  },
  btnGhost: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e6e6ee",
    background: "white",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
  },
};
