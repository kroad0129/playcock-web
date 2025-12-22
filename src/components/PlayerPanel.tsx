import React, { useMemo } from "react";

export type SimpleMember = {
  id: number;
  name: string;
};

export type PlayerPanelMode = "MANAGE" | "EDIT_PARTICIPANTS";

export default function PlayerPanel(props: {
  mode: PlayerPanelMode;
  title: string;

  members: SimpleMember[];
  selectedIds: Set<number>;

  onClose: () => void;
  onToggleSelected: (id: number) => void;

  // 검색
  search: string;
  onChangeSearch: (v: string) => void;

  // MANAGE 전용
  onAddMember?: (payload: {
    name: string;
    gender: "MALE" | "FEMALE";
    type: string;
  }) => void;
  onDeleteSelectedMembers?: () => void;

  // EDIT_PARTICIPANTS 전용
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  primaryDisabled: boolean;
}) {
  const {
    mode,
    title,
    members,
    selectedIds,
    onClose,
    onToggleSelected,
    search,
    onChangeSearch,
    onAddMember,
    onDeleteSelectedMembers,
    primaryActionLabel,
    onPrimaryAction,
    primaryDisabled,
  } = props;

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newGender, setNewGender] = React.useState<"MALE" | "FEMALE">("MALE");
  const [newType, setNewType] = React.useState<string>("MEMBER");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, search]);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.header}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              전체 부원 <b>{members.length}</b>명 · 선택됨{" "}
              <b>{selectedIds.size}</b>명
            </div>
          </div>
          <button style={S.btnGhost} onClick={onClose}>
            닫기
          </button>
        </div>

        <div style={S.searchBox}>
          {mode === "MANAGE" && isCreateOpen ? (
            <div style={S.createBox}>
              <div style={S.createTitle}>부원 등록</div>

              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="이름 입력"
                style={S.createInput}
              />

              <div style={S.createRow}>
                <div style={S.createLabel}>성별</div>
                <button
                  style={{
                    ...S.chip,
                    ...(newGender === "MALE" ? S.chipActive : {}),
                  }}
                  onClick={() => setNewGender("MALE")}
                  type="button"
                >
                  남자
                </button>
                <button
                  style={{
                    ...S.chip,
                    ...(newGender === "FEMALE" ? S.chipActive : {}),
                  }}
                  onClick={() => setNewGender("FEMALE")}
                  type="button"
                >
                  여자
                </button>
              </div>

              <div style={S.createRow}>
                <div style={S.createLabel}>타입</div>
                <button
                  style={{
                    ...S.chip,
                    ...(newType === "MEMBER" ? S.chipActive : {}),
                  }}
                  onClick={() => setNewType("MEMBER")}
                  type="button"
                >
                  MEMBER
                </button>
                <button
                  style={{
                    ...S.chip,
                    ...(newType === "GUEST" ? S.chipActive : {}),
                  }}
                  onClick={() => setNewType("GUEST")}
                  type="button"
                >
                  GUEST
                </button>
              </div>

              <button
                style={{
                  ...S.btnCreate,
                  opacity: newName.trim() ? 1 : 0.5,
                  cursor: newName.trim() ? "pointer" : "not-allowed",
                }}
                disabled={!newName.trim()}
                type="button"
                onClick={() => {
                  if (!newName.trim()) return;
                  onAddMember?.({
                    name: newName.trim(),
                    gender: newGender,
                    type: newType,
                  });

                  // ✅ 등록 후 폼 닫고 입력 초기화
                  setNewName("");
                  setIsCreateOpen(false);
                }}
              >
                등록 완료
              </button>
            </div>
          ) : null}

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
                  borderColor: selected ? "#2b57ff" : "#eee",
                  background: selected ? "#f2f3ff" : "#fff",
                }}
                onClick={() => onToggleSelected(m.id)}
              >
                <div style={{ fontSize: 16, fontWeight: 900 }}>{m.name}</div>
              </div>
            );
          })}
        </div>

        <div style={S.footer}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {mode === "MANAGE" ? (
              <>
                <button
                  style={S.btnSecondary}
                  type="button"
                  onClick={() => setIsCreateOpen((v) => !v)}
                >
                  등록
                </button>

                <button
                  style={S.btnSecondary}
                  onClick={onDeleteSelectedMembers}
                  type="button"
                >
                  삭제
                </button>
              </>
            ) : null}
          </div>

          <button
            style={{
              ...S.btnPrimary,
              opacity: primaryDisabled ? 0.5 : 1,
              cursor: primaryDisabled ? "not-allowed" : "pointer",
            }}
            onClick={onPrimaryAction}
            disabled={primaryDisabled}
          >
            {primaryActionLabel}
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
    padding: 14,
  },
  modal: {
    width: "min(860px, 100%)",
    maxHeight: "min(86vh, 920px)",
    background: "white",
    borderRadius: 16,
    border: "1px solid #e8e8ef",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f0f0f6",
  },
  searchBox: { padding: 12, borderBottom: "1px solid #f0f0f6" },
  searchInput: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #e6e6ee",
    fontSize: 16,
    outline: "none",
  },
  body: {
    padding: 12,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  row: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid #eee",
    cursor: "pointer",
  },
  footer: {
    padding: 12,
    borderTop: "1px solid #f0f0f6",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  btnPrimary: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "#2b57ff",
    color: "white",
    fontWeight: 900,
  },
  btnSecondary: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e6e6ee",
    background: "#fafafe",
    fontWeight: 900,
    cursor: "pointer",
  },
  btnGhost: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e6e6ee",
    background: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  createBox: {
    margin: "0 12px 12px 12px",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 12,
    background: "#fafafe",
  },
  createTitle: { fontSize: 14, fontWeight: 900, marginBottom: 10 },
  createInput: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #e6e6ee",
    fontSize: 15,
    outline: "none",
  },
  createRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  createLabel: { fontSize: 12, fontWeight: 900, color: "#666", width: 36 },
  chip: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid #e6e6ee",
    background: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  chipActive: {
    borderColor: "#2b57ff",
    background: "#f2f3ff",
    color: "#2b57ff",
  },
  btnCreate: {
    marginTop: 12,
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    background: "#2b57ff",
    color: "white",
    fontWeight: 900,
  },
};
