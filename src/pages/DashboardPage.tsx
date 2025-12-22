import React, { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar";
import CreateMemberModal from "../components/CreateMemberModal";
import MemberSelectModal from "../components/MemberSelectModal";
import SessionDashboard from "../components/SessionDashboard";
import { playcockApi } from "../api/playcockApi";
import type { ClubPlayerResponse, DashboardResponse } from "../types/playcock";

const EMPTY_DASH: DashboardResponse = {
  session: null,
  list: [],
  waitingTeams: [],
  playingMatches: [],
};

export default function DashboardPage() {
  const [members, setMembers] = useState<ClubPlayerResponse[]>([]);
  const [dashboard, setDashboard] = useState<DashboardResponse>(EMPTY_DASH);

  const [lastSyncAtMs, setLastSyncAtMs] = useState<number>(0);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  const [preSearch, setPreSearch] = useState("");
  const [preSelected, setPreSelected] = useState<Set<number>>(new Set());

  const [pickedIds, setPickedIds] = useState<number[]>([]);

  const [openManage, setOpenManage] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [manageSearch, setManageSearch] = useState("");
  const [manageSelected, setManageSelected] = useState<Set<number>>(new Set());

  const [editSearch, setEditSearch] = useState("");
  const [editSelected, setEditSelected] = useState<Set<number>>(new Set());
  const [editBaseSelected, setEditBaseSelected] = useState<Set<number>>(
    new Set()
  );

  const isRunning = !!dashboard.session;

  const loadMembers = async () => {
    const res = await playcockApi.listMembers();
    setMembers(res);
  };

  const refreshDashboard = async () => {
    try {
      const d = await playcockApi.dashboard();
      setDashboard(d ?? EMPTY_DASH);
      setLastSyncAtMs(Date.now());
    } catch {
      setDashboard((prev) => (prev.session ? prev : EMPTY_DASH));
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadMembers();
      } catch {}
      await refreshDashboard();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => refreshDashboard(), 5000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const filteredPre = useMemo(() => {
    const q = preSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, preSearch]);

  const togglePre = (id: number) => {
    setPreSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startDisabled = preSelected.size === 0;

  const start = async () => {
    if (preSelected.size === 0) return;
    try {
      const ids = Array.from(preSelected);
      const d = await playcockApi.startActivity(ids);
      setDashboard(d ?? EMPTY_DASH);
      setLastSyncAtMs(Date.now());
      setPreSelected(new Set());
      setPickedIds([]);
    } catch {
      await refreshDashboard();
      alert("이미 진행 중인 활동이 있어요. 화면을 복구했어요!");
    }
  };

  const end = async () => {
    const ok = confirm("활동을 종료할까요?");
    if (!ok) return;
    try {
      await playcockApi.endActivity();
      setDashboard(EMPTY_DASH);
      setPickedIds([]);
      setLastSyncAtMs(Date.now());
    } catch (e: any) {
      alert(e?.message ?? "활동 종료 실패");
    }
  };

  // 부원 관리
  const openManageModal = async () => {
    try {
      await loadMembers();
    } catch {}
    setManageSearch("");
    setManageSelected(new Set());
    setOpenManage(true);
  };
  const closeManageModal = () => {
    setOpenManage(false);
    setManageSelected(new Set());
    setManageSearch("");
  };
  const toggleManage = (id: number) => {
    setManageSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const deleteSelectedMembers = async () => {
    if (manageSelected.size === 0) {
      alert("삭제할 부원을 선택하세요.");
      return;
    }
    const ok = confirm("선택한 부원을 삭제할까요?");
    if (!ok) return;

    try {
      for (const id of Array.from(manageSelected)) {
        await playcockApi.deleteMember(id);
      }
      setManageSelected(new Set());
      await loadMembers();
    } catch (e: any) {
      alert(e?.message ?? "부원 삭제 실패");
    }
  };
  const createMember = async (payload: {
    name: string;
    gender: "MALE" | "FEMALE";
    type: string;
  }) => {
    try {
      await playcockApi.createMember(payload);
      setOpenCreate(false);
      await loadMembers();
    } catch (e: any) {
      alert(e?.message ?? "부원 등록 실패");
    }
  };

  // ✅ 현재 참가자(= list + waiting + playing) 전부 합치기
  const collectCurrentParticipantIds = (d: DashboardResponse) => {
    const ids = new Set<number>();

    (d.list ?? []).forEach((p) => ids.add(p.clubPlayerId));
    (d.waitingTeams ?? []).forEach((t) =>
      (t.members ?? []).forEach((m) => ids.add(m.clubPlayerId))
    );
    (d.playingMatches ?? []).forEach((m) =>
      (m.members ?? []).forEach((p) => ids.add(p.clubPlayerId))
    );

    return ids;
  };

  // 참가자 수정
  const openEditModal = async () => {
    try {
      await loadMembers();
    } catch {}

    setEditSearch("");
    // ✅ 여기! 기존 list만 쓰던 걸, 대기/경기 포함으로 변경
    const base = collectCurrentParticipantIds(dashboard);
    setEditBaseSelected(base); // ✅ 기준 저장
    setEditSelected(new Set(base)); // ✅ 화면용 선택 set
    setOpenEdit(true);
  };
  const closeEditModal = () => {
    setOpenEdit(false);
    setEditSelected(new Set());
    setEditBaseSelected(new Set()); // ✅ 추가
    setEditSearch("");
  };

  const toggleEdit = (id: number) => {
    setEditSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const applyParticipants = async () => {
    if (editSelected.size === 0) {
      alert("참가자는 1명 이상이어야 해요.");
      return;
    }

    const base = editBaseSelected; // 모달 열 때 저장한 "기준 참가자"
    const next = editSelected; // 모달에서 최종 선택한 참가자

    // 추가할 사람 = next - base
    const addIds = Array.from(next).filter((id) => !base.has(id));

    // 제거할 사람 = base - next
    const removeIds = Array.from(base).filter((id) => !next.has(id));

    try {
      const d = await playcockApi.updateParticipants({ addIds, removeIds });
      setDashboard(d ?? EMPTY_DASH);
      setLastSyncAtMs(Date.now());
      setPickedIds([]);
      closeEditModal();
    } catch (e: any) {
      alert(e?.message ?? "참가자 반영 실패");
    }
  };

  // 활동 중 LIST 선택(대기팀 생성용)
  const togglePick = (clubPlayerId: number) => {
    setPickedIds((prev) => {
      const has = prev.includes(clubPlayerId);
      if (has) return prev.filter((x) => x !== clubPlayerId);
      if (prev.length >= 4) return prev;
      return [...prev, clubPlayerId];
    });
  };
  const clearPick = () => setPickedIds([]);

  const createWaitingTeam = async (clubPlayerIds: number[]) => {
    try {
      const d = await playcockApi.createWaitingTeam(clubPlayerIds);
      setDashboard(d ?? EMPTY_DASH);
      setLastSyncAtMs(Date.now());
    } catch (e: any) {
      alert(e?.message ?? "대기팀 생성 실패");
    }
  };
  const deleteWaitingTeam = async (teamId: number) => {
    try {
      const d = await playcockApi.deleteWaitingTeam(teamId);
      setDashboard(d ?? EMPTY_DASH);
      setLastSyncAtMs(Date.now());
    } catch (e: any) {
      alert(e?.message ?? "팀 해체 실패");
    }
  };
  const startMatch = async (teamId: number) => {
    try {
      const d = await playcockApi.startMatch(teamId);
      setDashboard(d ?? EMPTY_DASH);
      setLastSyncAtMs(Date.now());
    } catch (e: any) {
      alert(e?.message ?? "경기 시작 실패");
    }
  };
  const endMatch = async (matchId: number) => {
    try {
      const d = await playcockApi.endMatch(matchId);
      setDashboard(d ?? EMPTY_DASH);
      setLastSyncAtMs(Date.now());
    } catch (e: any) {
      alert(e?.message ?? "경기 종료 실패");
    }
  };

  return (
    <div style={S.page}>
      <TopBar
        isRunning={isRunning}
        onOpenManage={openManageModal}
        onOpenEditParticipants={openEditModal}
        onStart={start}
        onEnd={end}
        startDisabled={startDisabled}
      />

      <main style={S.main}>
        {!isRunning ? (
          <div style={S.preWrap}>
            <div style={S.preCard}>
              <div style={S.preTitle}>참가자 선택</div>
              <div style={S.preSub}>
                전체 <b>{members.length}</b>명 · 선택됨{" "}
                <b>{preSelected.size}</b>명
              </div>

              <div style={{ marginTop: 10 }}>
                <input
                  value={preSearch}
                  onChange={(e) => setPreSearch(e.target.value)}
                  placeholder="이름으로 검색..."
                  style={S.searchInput}
                />
              </div>

              <div style={S.preList}>
                {filteredPre.map((m) => {
                  const selected = preSelected.has(m.id);
                  return (
                    <div
                      key={m.id}
                      style={{
                        ...S.preRow,
                        borderColor: selected ? "#2b57ff" : "#e9e9f1",
                        borderWidth: selected ? 2 : 1,
                        background: selected ? "#f2f3ff" : "#fff",
                      }}
                      onClick={() => togglePre(m.id)}
                    >
                      <div style={S.rowLine}>
                        <div style={S.name}>{m.name}</div>
                        <div style={S.meta}>
                          {m.gender === "FEMALE" ? "여자" : "남자"} ·{" "}
                          {String(m.type).toUpperCase() === "MEMBER"
                            ? "부원"
                            : String(m.type).toUpperCase() === "GUEST"
                            ? "게스트"
                            : "기타"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <SessionDashboard
            dashboard={dashboard}
            pickedIds={pickedIds}
            onTogglePick={togglePick}
            onClearPick={clearPick}
            onCreateWaitingTeam={createWaitingTeam}
            onDeleteWaitingTeam={deleteWaitingTeam}
            onStartMatch={startMatch}
            onEndMatch={endMatch}
            lastSyncAtMs={lastSyncAtMs}
            nowTickMs={nowTick}
          />
        )}
      </main>

      {/* 부원 관리 모달 */}
      {openManage && (
        <MemberSelectModal
          title="부원 관리"
          members={members}
          selectedIds={manageSelected}
          onToggle={toggleManage}
          search={manageSearch}
          onChangeSearch={setManageSearch}
          leftButtons={
            <>
              <button
                type="button"
                style={S.btnGhost}
                onClick={() => setOpenCreate(true)}
              >
                등록
              </button>
              <button
                type="button"
                style={S.btnGhost}
                onClick={deleteSelectedMembers}
              >
                삭제
              </button>
            </>
          }
          primaryLabel="닫기"
          primaryDisabled={false}
          onPrimary={closeManageModal}
          onClose={closeManageModal}
        />
      )}

      {openCreate && (
        <CreateMemberModal
          onClose={() => setOpenCreate(false)}
          onCreate={createMember}
        />
      )}

      {/* 참가자 수정 모달 */}
      {openEdit && (
        <MemberSelectModal
          title="참가자 수정"
          members={members}
          selectedIds={editSelected}
          onToggle={toggleEdit}
          search={editSearch}
          onChangeSearch={setEditSearch}
          leftButtons={null}
          primaryLabel="반영"
          primaryDisabled={editSelected.size === 0}
          onPrimary={applyParticipants}
          onClose={closeEditModal}
        />
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#f6f7fb",
    fontFamily:
      'system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans KR", sans-serif',
  },
  main: { flex: 1, minHeight: 0, padding: "clamp(10px, 2vw, 16px)" },

  preWrap: { height: "100%", display: "grid", placeItems: "center" },
  preCard: {
    width: "min(500px, 100%)",
    height: "min(76vh, 760px)",
    background: "white",
    border: "1px solid #e8e8ef",
    borderRadius: 16,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  preTitle: { fontSize: 16, fontWeight: 900 },
  preSub: { marginTop: 4, fontSize: 12, color: "#666" },

  searchInput: {
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    padding: "9px 10px",
    borderRadius: 12,
    border: "1px solid #e6e6ee",
    fontSize: 14,
    outline: "none",
    background: "white",
  },

  preList: {
    marginTop: 10,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 0,
    flex: 1,
  },

  preRow: {
    padding: "9px 10px",
    borderRadius: 14,
    borderStyle: "solid",
    borderColor: "#e9e9f1",
    borderWidth: 1,
    cursor: "pointer",
    background: "#fff",
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
