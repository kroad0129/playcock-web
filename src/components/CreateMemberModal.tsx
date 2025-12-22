import React from "react";

export default function CreateMemberModal(props: {
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    gender: "MALE" | "FEMALE";
    type: string;
  }) => void;
}) {
  const { onClose, onCreate } = props;

  const [name, setName] = React.useState("");
  const [gender, setGender] = React.useState<"MALE" | "FEMALE">("MALE");
  const [type, setType] = React.useState<string>("MEMBER");

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.header}>
          <div style={S.title}>부원 등록</div>
          <button style={S.btnGhost} onClick={onClose} type="button">
            닫기
          </button>
        </div>

        <div style={S.body}>
          <div style={S.label}>이름</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 입력"
            style={S.input}
          />

          <div style={{ marginTop: 12 }}>
            <div style={S.label}>성별</div>
            <div style={S.row}>
              <Chip
                active={gender === "MALE"}
                onClick={() => setGender("MALE")}
              >
                남자
              </Chip>
              <Chip
                active={gender === "FEMALE"}
                onClick={() => setGender("FEMALE")}
              >
                여자
              </Chip>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={S.label}>멤버유형</div>
            <div style={S.row}>
              <Chip
                active={type === "MEMBER"}
                onClick={() => setType("MEMBER")}
              >
                부원
              </Chip>
              <Chip active={type === "GUEST"} onClick={() => setType("GUEST")}>
                게스트
              </Chip>
              <Chip active={type === "ETC"} onClick={() => setType("ETC")}>
                기타
              </Chip>
            </div>
          </div>
        </div>

        <div style={S.footer}>
          <button
            type="button"
            style={{
              ...S.btnPrimary,
              opacity: name.trim() ? 1 : 0.5,
              cursor: name.trim() ? "pointer" : "not-allowed",
            }}
            disabled={!name.trim()}
            onClick={() => onCreate({ name: name.trim(), gender, type })}
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { active, onClick, children } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...S.chip,
        borderColor: active ? "#2b57ff" : "#e6e6ee",
        background: active ? "#f2f3ff" : "white",
        color: active ? "#2b57ff" : "#333",
      }}
    >
      {children}
    </button>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "grid",
    placeItems: "center",
    padding: 12,
  },
  modal: {
    width: "min(520px, 100%)",
    background: "white",
    borderRadius: 16,
    border: "1px solid #e8e8ef",
    overflow: "hidden",
  },
  header: {
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f0f0f6",
  },
  title: { fontSize: 16, fontWeight: 900 },
  body: { padding: 12 },
  footer: {
    padding: 12,
    borderTop: "1px solid #f0f0f6",
    display: "flex",
    justifyContent: "flex-end",
  },
  label: { fontSize: 12, color: "#666", fontWeight: 900, marginBottom: 6 },
  input: {
    width: "100%",
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid #e6e6ee",
    fontSize: 14,
    outline: "none",
  },
  row: { display: "flex", gap: 8, flexWrap: "wrap" },
  chip: {
    padding: "9px 11px",
    borderRadius: 999,
    border: "1px solid #e6e6ee",
    background: "white",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
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
