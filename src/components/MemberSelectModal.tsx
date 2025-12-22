import React, { useMemo } from "react";
import type { ClubPlayerResponse } from "../types/playcock";

function genderKo(g: string) {
  return g === "FEMALE" ? "여자" : "남자";
}
function typeKo(t: string) {
  const up = (t || "").toUpperCase();
  if (up === "MEMBER") return "부원";
  if (up === "GUEST") return "게스트";
  return "기타";
}

export default function MemberSelectModal(props: {
  title: string;
  members: ClubPlayerResponse[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;

  search: string;
  onChangeSearch: (v: string) => void;

  leftButtons?: React.ReactNode;
  primaryLabel: string;
  primaryDisabled: boolean;
  onPrimary: () => void;

  onClose: () => void;
}) {
  const {
    title,
    members,
    selectedIds,
    onToggle,
    search,
    onChangeSearch,
    leftButtons,
    primaryLabel,
    primaryDisabled,
    onPrimary,
    onClose,
  } = props;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, search]);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.header}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              minWidth: 0,
            }}
          >
            <div style={S.title}>{title}</div>
            <div style={S.sub}>
              전체 <b>{members.length}</b>명 · 선택됨 <b>{selectedIds.size}</b>
              명
            </div>
          </div>
          <button style={S.btnGhost} onClick={onClose} type="button">
            닫기
          </button>
        </div>

        <div style={S.searchBox}>
          <input
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="이름으로 검색..."
            style={S.searchInput}
          />
        </div>

        <div style={S.body}>
          {filtered.map((m) => {
            const selected = selectedIds.has(m.id);
            return (
              <div
                key={m.id}
                style={{
                  ...S.row,
                  borderColor: selected ? "#2b57ff" : "#e9e9f1",
                  borderWidth: selected ? 2 : 1,
                  background: selected ? "#f2f3ff" : "#fff",
                }}
                onClick={() => onToggle(m.id)}
              >
                <div style={S.rowLine}>
                  <div style={S.name}>{m.name}</div>
                  <div style={S.meta}>
                    {genderKo(m.gender)} · {typeKo(m.type)}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <div style={S.muted}>검색 결과가 없어요.</div>
          ) : null}
        </div>

        <div style={S.footer}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {leftButtons}
          </div>
          <button
            type="button"
            style={{
              ...S.btnPrimary,
              opacity: primaryDisabled ? 0.5 : 1,
              cursor: primaryDisabled ? "not-allowed" : "pointer",
            }}
            disabled={primaryDisabled}
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
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
    width: "min(500px, 100%)", // ✅ 요청 반영
    maxHeight: "min(88vh, 920px)",
    background: "white",
    borderRadius: 16,
    border: "1px solid #e8e8ef",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f0f0f6",
    gap: 10,
  },
  title: { fontSize: 15, fontWeight: 900 },
  sub: { fontSize: 12, color: "#666" },

  searchBox: { padding: 10, borderBottom: "1px solid #f0f0f6" },
  searchInput: {
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    padding: "9px 10px",
    borderRadius: 12,
    border: "1px solid #e6e6ee",
    fontSize: 14,
    outline: "none",
  },

  body: {
    padding: 10,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  row: {
    padding: "9px 10px",
    borderRadius: 14,
    border: "1px solid #e9e9f1",
    cursor: "pointer",
  },

  rowLine: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: 900,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
  meta: {
    fontSize: 12,
    color: "#444",
    fontWeight: 800,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  footer: {
    padding: 10,
    borderTop: "1px solid #f0f0f6",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
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
  muted: { color: "#666", fontSize: 13, padding: 10 },
};
