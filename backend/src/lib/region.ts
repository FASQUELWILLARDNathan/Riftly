/**
 * Portage direct de `get_region_from_series()` du bot Discord Python.
 *
 * TODO (roadmap étape 2+) : remplacer ce pattern-matching par une vraie
 * table de référence `league` (code, nom, tier) reliée aux matchs, plutôt
 * que de la déduction de string à la volée. Gardé identique pour l'instant
 * pour ne pas changer le comportement observable pendant la migration.
 */
export function getRegionFromSeries(series?: string | null, tournament?: string | null): string {
  const seriesUpper = (series ?? "").toUpperCase();
  const tournamentUpper = (tournament ?? "").toUpperCase();

  if (tournamentUpper.includes("WORLDS")) return "Worlds";
  if (tournamentUpper.includes("MSI")) return "MSI";
  if (tournamentUpper.includes("RLCS")) return "RLCS";
  if (
    tournamentUpper.includes("VALORANT") ||
    tournamentUpper.includes("VCT") ||
    tournamentUpper.includes("CHAMPIONS TOUR")
  )
    return "VCT";
  if (tournamentUpper.includes("GAME CHANGERS")) return "Game Changers";

  if (seriesUpper.includes("LEC") || tournamentUpper.includes("LEC")) return "LEC";
  if (seriesUpper.includes("LFL") || tournamentUpper.includes("LFL")) return "LFL";
  if (seriesUpper.includes("LCS") || tournamentUpper.includes("LCS")) return "LCS";
  if (seriesUpper.includes("LCK") || tournamentUpper.includes("LCK")) return "LCK";
  if (seriesUpper.includes("LPL") || tournamentUpper.includes("LPL")) return "LPL";
  if (seriesUpper.includes("CBLOL") || tournamentUpper.includes("CBLOL")) return "CBLOL";
  if (seriesUpper.includes("VCS") || tournamentUpper.includes("VCS")) return "VCS";
  if (seriesUpper.includes("PCS") || tournamentUpper.includes("PCS")) return "PCS";
  if (seriesUpper.includes("EWC") || tournamentUpper.includes("EWC")) return "EWC";
  if (seriesUpper.includes("EMEA") || tournamentUpper.includes("EMEA")) return "EMEA";
  if (seriesUpper.includes("RLCS")) return "RLCS";
  if (seriesUpper.includes("CHALLENGERS")) return "Challengers";

  return "Autre";
}

/** Extrait les noms d'équipes depuis le JSON match2opponents (même structure que côté bot). */
export function extractTeamNames(match2opponents: unknown): string[] {
  if (!Array.isArray(match2opponents)) return [];
  return match2opponents
    .map((opp: any) => opp?.teamtemplate?.name ?? opp?.name)
    .filter((name: unknown): name is string => typeof name === "string");
}
