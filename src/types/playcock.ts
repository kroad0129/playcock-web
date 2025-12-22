export type Gender = "MALE" | "FEMALE";
export type PlayerType = "MEMBER" | "GUEST" | string;

export type ClubPlayerResponse = {
  id: number;
  name: string;
  type: PlayerType;
  gender: Gender;
};

export type DashboardResponse = {
  session: null | {
    sessionId: number;
    startedAt: string;
    totalMatches: number;
  };
  list: PlayerCard[];
  waitingTeams: WaitingTeamCard[];
  playingMatches: MatchCard[];
};

export type PlayerCard = {
  clubPlayerId: number;
  name: string;
  type: PlayerType;
  gender: Gender;
  lastPlayedAt: string | null;
  restSeconds: number;

  maleDoubleCount: number;
  femaleDoubleCount: number;
  mixedDoubleCount: number;
  totalMatchCount: number;
};

export type WaitingTeamCard = {
  waitingTeamId: number;
  createdAt: string;
  members: PlayerCard[];
};

export type MatchCard = {
  matchId: number;
  matchNo: number;
  matchType: string; // 백엔드 enum 문자열
  startedAt: string;
  elapsedSeconds: number;
  members: PlayerCard[];
};
