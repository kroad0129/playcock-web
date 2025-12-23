import React, { useEffect, useMemo, useState } from "react";
import type { DashboardResponse, PlayerCard } from "../types/playcock";

type GenderFilter = "ALL" | "MALE" | "FEMALE";
type SortMode = "NONE" | "REST_DESC" | "MATCH_ASC";

function minutesOnlyFromSeconds(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60);
  return `${m}분`;
}
function elapsedHuman(sec?: number) {
  if (sec == null) return "-";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m <= 0 ? `${r}초` : `${m}분 ${r}초`;
}
function isoToKST(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR");
}
function secondsSince(iso?: string | null) {
  if (!iso) return 0;
  const d = new Date(iso);
  const ms = d.getTime();
  if (Number.isNaN(ms)) return 0;
  return Math.floor((Date.now() - ms) / 1000);
}
function matchTypeKo(type?: string | null) {
  if (!type) return "경기";
  const t = String(type).toUpperCase();
  //if (t.includes("MIX")) return "혼합복식";
  //if (t.includes("MALE") || t.includes("MEN")) return "남자복식";
  //if (t.includes("FEMALE") || t.includes("WOMEN")) return "여자복식";
  if (t === "MALE_DOUBLE" || t === "M_D") return "남자복식";
  if (t === "FEMALE_DOUBLE" || t === "F_D") return "여자복식";
  if (t === "MIXED_DOUBLE" || t === "X_D") return "혼합복식";
  return type;
}
function typeKo(t: string) {
  const up = (t || "").toUpperCase();
  if (up === "MEMBER") return "부원";
  if (up === "GUEST") return "게스트";
  return "기타";
}

function useViewport() {
  const [v, setV] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setV({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return v;
}

export default function SessionDashboard(props: {
  dashboard: DashboardResponse;

  pickedIds: number[];
  onTogglePick: (clubPlayerId: number) => void;
  onClearPick: () => void;

  onCreateWaitingTeam: (clubPlayerIds: number[]) => void;
  onDeleteWaitingTeam: (teamId: number) => void;

  onStartMatch: (teamId: number) => void;
  onEndMatch: (matchId: number) => void;

  lastSyncAtMs: number;
  nowTickMs: number;
}) {
  const {
    dashboard,
    pickedIds,
    onTogglePick,
    onClearPick,
    onCreateWaitingTeam,
    onDeleteWaitingTeam,
    onStartMatch,
    onEndMatch,
    lastSyncAtMs,
    nowTickMs,
  } = props;

  const { w, h } = useViewport();
  const boardHeight = Math.max(520, Math.floor(h * 0.74));

  const gridCols = w >= 1200 ? "1.6fr 1fr 1fr" : w >= 900 ? "1.4fr 1fr" : "1fr";

  const [genderFilter, setGenderFilter] = useState<GenderFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("NONE");
  const [listSearch, setListSearch] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  const driftSec = useMemo(() => {
    if (!lastSyncAtMs) return 0;
    const diff = nowTickMs - lastSyncAtMs;
    return diff > 0 ? Math.floor(diff / 1000) : 0;
  }, [lastSyncAtMs, nowTickMs]);

  const pickedSet = useMemo(() => new Set(pickedIds), [pickedIds]);

  const list = dashboard.list ?? [];
  const waitingTeams = dashboard.waitingTeams ?? [];
  const playingMatches = dashboard.playingMatches ?? [];

  const pickedPlayers = useMemo(() => {
    const map = new Map<number, PlayerCard>(
      list.map((p) => [p.clubPlayerId, p])
    );
    return pickedIds.map((id) => map.get(id)).filter(Boolean) as PlayerCard[];
  }, [list, pickedIds]);

  const displayList = useMemo(() => {
    let arr = list;

    if (genderFilter === "MALE") arr = arr.filter((p) => p.gender === "MALE");
    if (genderFilter === "FEMALE")
      arr = arr.filter((p) => p.gender === "FEMALE");

    const q = listSearch.trim().toLowerCase();
    if (q) arr = arr.filter((p) => p.name.toLowerCase().includes(q));

    const copy = [...arr];

    if (sortMode === "REST_DESC") {
      copy.sort(
        (a, b) =>
          (b.restSeconds ?? 0) + driftSec - ((a.restSeconds ?? 0) + driftSec)
      );
    } else if (sortMode === "MATCH_ASC") {
      copy.sort((a, b) => (a.totalMatchCount ?? 0) - (b.totalMatchCount ?? 0));
    }

    return copy;
  }, [list, genderFilter, sortMode, driftSec, listSearch]);

  const createTeam = () => {
    setErrorText(null);
    if (pickedIds.length < 1 || pickedIds.length > 4) {
      setErrorText("대기팀은 1~4명만 선택할 수 있어요.");
      return;
    }
    onCreateWaitingTeam(pickedIds);
    // ✅ 선택 유지가 더 편하면 아래 줄을 주석 처리해도 됨
    onClearPick();
  };

  return (
    <div style={S.wrap}>
      <div style={S.summary}>
        <div style={S.small}>
          시작: <b>{isoToKST(dashboard.session?.startedAt ?? null)}</b>
        </div>
        <div style={S.small}>
          목록 <b>{list.length}</b>명 · 대기 <b>{waitingTeams.length}</b>팀 ·
          경기 <b>{playingMatches.length}</b>개
        </div>
      </div>

      <div
        style={{
          ...S.grid,
          gridTemplateColumns: gridCols,
          height: boardHeight,
        }}
      >
        {/* LIST */}
        <section style={S.card}>
          <div style={S.cardHeader}>
            <div style={S.cardTitle}>부원 목록</div>
            <div style={S.pill}>{displayList.length}명</div>
          </div>

          {/* ✅ 윈도우에서 한 줄 고정(좌 필터 / 우 액션) */}
          <div
            style={{
              ...S.topBar,
              gridTemplateColumns: w < 720 ? "1fr" : "1fr 220px",
            }}
          >
            <div style={S.filters}>
              <div style={S.filterRow}>
                <div style={S.filterLabel}>성별</div>
                <Chip
                  active={genderFilter === "ALL"}
                  onClick={() => setGenderFilter("ALL")}
                >
                  전체
                </Chip>
                <Chip
                  active={genderFilter === "MALE"}
                  onClick={() => setGenderFilter("MALE")}
                >
                  남자
                </Chip>
                <Chip
                  active={genderFilter === "FEMALE"}
                  onClick={() => setGenderFilter("FEMALE")}
                >
                  여자
                </Chip>
              </div>

              <div style={S.filterRow}>
                <div style={S.filterLabel}>정렬</div>
                <Chip
                  active={sortMode === "NONE"}
                  onClick={() => setSortMode("NONE")}
                >
                  기본
                </Chip>
                <Chip
                  active={sortMode === "REST_DESC"}
                  onClick={() => setSortMode("REST_DESC")}
                >
                  휴식
                </Chip>
                <Chip
                  active={sortMode === "MATCH_ASC"}
                  onClick={() => setSortMode("MATCH_ASC")}
                >
                  경기
                </Chip>
              </div>
            </div>

            <div style={S.actionBox}>
              <div style={{ fontWeight: 900, fontSize: 13 }}>
                선택 {pickedIds.length}명
              </div>
              <button style={S.btnPrimary} onClick={createTeam} type="button">
                대기팀 생성
              </button>
              <div style={S.pickedNames}>
                {pickedPlayers.length === 0
                  ? "없음"
                  : pickedPlayers.map((p) => p.name).join(", ")}
              </div>
              {errorText ? <div style={S.err}>{errorText}</div> : null}
            </div>
          </div>

          {/* ✅ 요청: 위 공간 활용해서 검색 */}
          <div style={S.listSearchBox}>
            <input
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="부원 이름 검색..."
              style={S.listSearchInput}
            />
          </div>

          <div style={S.scroll}>
            {displayList.map((p) => {
              const selected = pickedSet.has(p.clubPlayerId);
              const restSec = (p.restSeconds ?? 0) + driftSec;
              const tint = p.gender === "FEMALE" ? "#fff0f7" : "#eef3ff";

              return (
                <div
                  key={p.clubPlayerId}
                  style={{
                    ...S.row,
                    background: tint,
                    borderColor: selected ? "#2b57ff" : "#e9e9f1",
                    borderWidth: 1,
                    boxShadow: selected
                      ? "inset 0 0 0 2px #2b57ff, 0 0 0 3px rgba(43,87,255,0.12)"
                      : "none",
                    boxSizing: "border-box",
                    transform: selected ? "translateY(-1px)" : "none",
                  }}
                  onClick={() => onTogglePick(p.clubPlayerId)}
                >
                  <div style={S.rowLine}>
                    <div style={S.name}>{p.name}</div>
                    <div style={S.meta}>
                      {p.gender === "FEMALE" ? "여자" : "남자"} ·{" "}
                      {typeKo(p.type)}
                    </div>
                  </div>

                  <div style={S.small}>
                    휴식{" "}
                    <span style={S.mono}>
                      {minutesOnlyFromSeconds(restSec)}
                    </span>
                    <div></div>
                    <span style={S.mono}>
                      총 {p.totalMatchCount} / 남복 {p.maleDoubleCount} / 여복{" "}
                      {p.femaleDoubleCount} / 혼복 {p.mixedDoubleCount}
                    </span>
                  </div>
                </div>
              );
            })}
            {displayList.length === 0 ? (
              <div style={S.muted}>표시할 부원이 없습니다.</div>
            ) : null}
          </div>
        </section>

        {/* WAITING */}
        <section style={S.card}>
          <div style={S.cardHeader}>
            <div style={S.cardTitle}>대기</div>
            <div style={S.pill}>{waitingTeams.length}팀</div>
          </div>

          <div style={S.scroll}>
            {waitingTeams.map((t, idx) => {
              const members = (t.members || []).map((m) => m.name).join(", ");
              const waitSec = secondsSince((t as any).createdAt) + driftSec;

              return (
                <div key={t.waitingTeamId} style={S.rowStatic}>
                  {/* ✅ "대기 팀" 중복 제거 + 경과 시간 */}
                  <div style={S.waitTitle}>
                    대기 {idx + 1} · {minutesOnlyFromSeconds(waitSec)} 경과
                  </div>

                  <div style={{ marginTop: 6, fontSize: 13, color: "#333" }}>
                    {members}
                  </div>

                  {/* ✅ 버튼 한 줄 좌우대칭 */}
                  <div style={S.twoBtnRow}>
                    <button
                      style={{ ...S.btnPrimary, width: "100%" }}
                      onClick={() => onStartMatch(t.waitingTeamId)}
                      type="button"
                    >
                      경기 시작
                    </button>
                    <button
                      style={{ ...S.btnGhost, width: "100%" }}
                      onClick={() => onDeleteWaitingTeam(t.waitingTeamId)}
                      type="button"
                    >
                      팀 해체
                    </button>
                  </div>
                </div>
              );
            })}
            {waitingTeams.length === 0 ? (
              <div style={S.muted}>대기팀이 없습니다.</div>
            ) : null}
          </div>
        </section>

        {/* PLAYING */}
        <section style={S.card}>
          <div style={S.cardHeader}>
            <div style={S.cardTitle}>경기 중</div>
            <div style={S.pill}>{playingMatches.length}경기</div>
          </div>

          <div style={S.scroll}>
            {playingMatches.map((m) => {
              const members = (m.members || []).map((x) => x.name).join(", ");
              const elapsed = (m.elapsedSeconds ?? 0) + driftSec;

              return (
                <div key={m.matchId} style={S.rowStatic}>
                  <div style={{ fontWeight: 900, fontSize: 15 }}>
                    {matchTypeKo(m.matchType)}
                  </div>
                  <div style={S.small}>진행 {elapsedHuman(elapsed)}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "#333" }}>
                    {members}
                  </div>

                  {/* ✅ 경기 종료 버튼 길게 */}
                  <div style={{ marginTop: 10 }}>
                    <button
                      style={{ ...S.btnDanger, width: "100%" }}
                      onClick={() => onEndMatch(m.matchId)}
                      type="button"
                    >
                      경기 종료
                    </button>
                  </div>
                </div>
              );
            })}
            {playingMatches.length === 0 ? (
              <div style={S.muted}>진행중인 경기가 없습니다.</div>
            ) : null}
          </div>
        </section>
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
      onClick={onClick}
      type="button"
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
  wrap: { display: "flex", flexDirection: "column", gap: 10, minHeight: 0 },

  summary: {
    background: "white",
    border: "1px solid #e8e8ef",
    borderRadius: 16,
    padding: 12,
  },

  grid: { display: "grid", gap: 10, minHeight: 0 },

  card: {
    background: "white",
    border: "1px solid #e8e8ef",
    borderRadius: 16,
    padding: 12,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: 900 },
  pill: {
    marginLeft: "auto",
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    background: "#f2f3ff",
  },

  topBar: {
    display: "grid",
    gridTemplateColumns: "1fr 220px",
    gap: 10,
    alignItems: "stretch",
    marginBottom: 10,
  },

  filters: {
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 10,
    background: "#fafafe",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
  },
  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  filterLabel: { fontSize: 12, fontWeight: 900, color: "#666", width: 40 },

  actionBox: {
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 10,
    background: "#fafafe",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
  },
  pickedNames: { fontSize: 12, color: "#555", lineHeight: 1.35 },

  listSearchBox: { marginBottom: 10, minWidth: 0 },
  listSearchInput: {
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

  chip: {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid #e6e6ee",
    background: "white",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
  },

  scroll: {
    overflow: "auto",
    minHeight: 0,
    flex: 1,
    display: "grid",
    gap: 8,
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    alignContent: "start",
    padding: 6, // ✅ 추가 (상단 짤림 방지)
    boxSizing: "border-box", // ✅ 추가
  },

  row: {
    borderStyle: "solid",
    borderColor: "#e9e9f1",
    borderWidth: 1,
    borderRadius: 14,
    padding: "9px 10px",
    cursor: "pointer",
  },
  rowStatic: {
    border: "1px solid #eee",
    borderRadius: 14,
    padding: "9px 10px",
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

  waitTitle: { fontWeight: 900, fontSize: 14 },

  twoBtnRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginTop: 10,
  },

  err: { color: "#c00", fontWeight: 900, fontSize: 12 },
  muted: { color: "#666", fontSize: 13, padding: 10 },

  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "none",
    background: "#2b57ff",
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

  small: { fontSize: 12, color: "#666", marginTop: 5 },
  mono: {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
};
