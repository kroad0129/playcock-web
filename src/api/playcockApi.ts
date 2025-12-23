import type { ClubPlayerResponse, DashboardResponse } from "../types/playcock";

const BASE = "/api";

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const text = await res.text().catch(() => "");
  const ct = res.headers.get("content-type") ?? "";

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  if (!ct.includes("application/json")) return undefined as unknown as T;
  return (text ? JSON.parse(text) : null) as T;
}

export const playcockApi = {
  // 부원
  listMembers: () => http<ClubPlayerResponse[]>("/club-players"),
  createMember: (body: {
    name: string;
    type: string;
    gender: "MALE" | "FEMALE";
  }) =>
    http<ClubPlayerResponse>("/club-players", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteMember: (id: number) =>
    http<void>(`/club-players/${id}`, { method: "DELETE" }),

  // 활동
  startActivity: (participantClubPlayerIds: number[]) =>
    http<DashboardResponse>("/sessions/start", {
      method: "POST",
      body: JSON.stringify({ participantClubPlayerIds }),
    }),

  dashboard: () => http<DashboardResponse>("/sessions/current/dashboard"),

  endActivity: () => http<void>("/sessions/current/end", { method: "POST" }),

  updateParticipants: (body: { addIds: number[]; removeIds: number[] }) =>
    http<DashboardResponse>("/sessions/current/participants", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // 대기팀 / 경기
  createWaitingTeam: (clubPlayerIds: number[]) =>
    http<DashboardResponse>("/waiting-teams", {
      method: "POST",
      body: JSON.stringify({ clubPlayerIds }),
    }),

  deleteWaitingTeam: (teamId: number) =>
    http<DashboardResponse>(`/waiting-teams/${teamId}`, { method: "DELETE" }),

  startMatch: (waitingTeamId: number) =>
    http<DashboardResponse>("/matches/start", {
      method: "POST",
      body: JSON.stringify({ waitingTeamId }),
    }),

  endMatch: (matchId: number) =>
    http<DashboardResponse>(`/matches/${matchId}/end`, { method: "POST" }),
};
