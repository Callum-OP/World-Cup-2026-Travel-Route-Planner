import { RouteStrategy, MatchWithCity, OptimisedRoute, City } from './RouteStrategy';
import { buildRoute } from '../utils/buildRoute';
import { calculateDistance } from '../utils/haversine';

/**
 * NearestNeighbourStrategy — YOUR TASK #3
 *
 * Route optimisation using nearest-neighbour heuristic.
 *
 * ============================================================
 * WHAT YOU NEED TO IMPLEMENT:
 * ============================================================
 *
 * 1. optimise() method - The nearest-neighbour algorithm:
 *    - Sort matches by kickoff date
 *    - Group matches by date
 *    - For each date, pick the match nearest to your current city
 *    - Track your current city as you process each match
 *
 * 2. validateRoute() method - Validation checks:
 *    - Must have at least 5 matches
 *    - Must visit all 3 countries (USA, Mexico, Canada)
 *    - Set feasibility, warnings, and country coverage on the route
 *
 * ============================================================
 * HELPER METHODS PROVIDED (no changes needed):
 * ============================================================
 *
 * - buildRoute(orderedMatches, strategyName) - Builds the route from ordered matches
 * - calculateDistance(lat1, lon1, lat2, lon2) - Calculates distance between coordinates
 *
 * ============================================================
 */
export class NearestNeighbourStrategy implements RouteStrategy {
  private static readonly STRATEGY_NAME = 'nearest-neighbour';
  private static readonly REQUIRED_COUNTRIES = ['USA', 'Mexico', 'Canada'];
  private static readonly MINIMUM_MATCHES = 5;

  // ============================================================
  //  Nearest Neighbour Algorithm
  // ============================================================
  //
  // TODO: Implement the nearest-neighbour selection
  //
  // Steps:
  //   1. Handle empty/null matches - return createEmptyRoute()
  //   2. Sort matches by kickoff date
  //   3. Group matches by date (use match.kickoff.split('T')[0])
  //   4. For each date (in sorted order):
  //      - If only 1 match that day, add it to orderedMatches
  //      - If multiple matches, pick the nearest to currentCity
  //   5. Track currentCity as you process each match
  //   6. Build and validate route using buildRoute() and validateRoute()
  //
  // Hints:
  //   - Use calculateDistance(lat1, lon1, lat2, lon2) for distance
  //   - Group by date: match.kickoff.split('T')[0]
  //   - The first match in chronological order is your starting point
  //
  // ============================================================

  // Finds the best route using the nearest neighbours and chronological order
  optimise(matches: MatchWithCity[], originCity?: City): OptimisedRoute {
    if (!matches || matches.length === 0) {
      return this.createEmptyRoute();
    }

    // Sort all matches by kickoff date
    const sorted = [...matches].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );

    // Group matches by date (YYYY-MM-DD)
    const groupedByDate = new Map<string, MatchWithCity[]>();
    for (const match of sorted) {
      const date = match.kickoff.split('T')[0];
      if (!groupedByDate.has(date)) {
        groupedByDate.set(date, []);
      }
      groupedByDate.get(date)!.push(match);
    }

    // For each date, pick the match nearest to current city
    const orderedMatches: MatchWithCity[] = [];
    let currentCity: City = originCity ?? sorted[0].city;

    for (const [, matchesOnDate] of groupedByDate) {
      if (matchesOnDate.length === 1) {
        orderedMatches.push(matchesOnDate[0]);
      } else {
        // Pick the match whose city is nearest to current position
        let nearest = matchesOnDate[0];
        let nearestDistance = calculateDistance(
          currentCity.latitude,
          currentCity.longitude,
          nearest.city.latitude,
          nearest.city.longitude
        );

        for (const match of matchesOnDate.slice(1)) {
          const distance = calculateDistance(
            currentCity.latitude,
            currentCity.longitude,
            match.city.latitude,
            match.city.longitude
          );
          if (distance < nearestDistance) {
            nearest = match;
            nearestDistance = distance;
          }
        }

        orderedMatches.push(nearest);
      }

      // Update current city to the one we just picked
      currentCity = orderedMatches[orderedMatches.length - 1].city;
    }

    const route = this.buildRoute(orderedMatches, originCity);
    // Check the route is valid
    this.validateRoute(route, orderedMatches);
    return route;
  }

  // ============================================================
  //  Validation — YOUR TASK
  // ============================================================
  //
  // TODO: Implement route validation
  //
  // Check the following constraints:
  //   1. Minimum matches - must have at least MINIMUM_MATCHES (5)
  //   2. Country coverage - must visit all REQUIRED_COUNTRIES (USA, Mexico, Canada)
  //
  // Set on the route:
  //   - route.feasible = true/false
  //   - route.warnings = list of warning messages
  //   - route.countriesVisited = list of countries
  //   - route.missingCountries = list of missing countries
  //
  // ============================================================

  // Ensures the route is valid by checking it against the requirements (Visit all countries and at least 5 matches)
  private validateRoute(route: OptimisedRoute, matches: MatchWithCity[]): void {
    const warnings: string[] = [];

    // Check minimum matches
    if (matches.length < NearestNeighbourStrategy.MINIMUM_MATCHES) {
      warnings.push(
        `Only ${matches.length} match(es) selected — minimum is ${NearestNeighbourStrategy.MINIMUM_MATCHES}`
      );
    }

    // Check countries visited
    const countriesVisited = [...new Set(matches.map((m) => m.city.country))];
    const missingCountries = NearestNeighbourStrategy.REQUIRED_COUNTRIES.filter(
      (c) => !countriesVisited.includes(c)
    );

    if (missingCountries.length > 0) {
      warnings.push(`Missing matches in: ${missingCountries.join(', ')}`);
    }

    route.feasible =
      matches.length >= NearestNeighbourStrategy.MINIMUM_MATCHES &&
      missingCountries.length === 0;
    route.warnings = warnings;
    route.countriesVisited = countriesVisited;
    route.missingCountries = missingCountries;
  }

  // ============================================================
  //  Helper Methods (provided - no changes needed)
  // ============================================================

  /**
   * Creates an empty route with appropriate warnings.
   */
  private createEmptyRoute(): OptimisedRoute {
    return {
      stops: [],
      totalDistance: 0,
      strategy: NearestNeighbourStrategy.STRATEGY_NAME,
      feasible: false,
      warnings: ['No matches selected', `Must select at least ${NearestNeighbourStrategy.MINIMUM_MATCHES} matches`],
      countriesVisited: [],
      missingCountries: [...NearestNeighbourStrategy.REQUIRED_COUNTRIES],
    };
  }

  /**
   * Builds an optimised route from ordered matches, including origin city distance.
   */
  private buildRoute(orderedMatches: MatchWithCity[], originCity?: City): OptimisedRoute {
    const route = buildRoute(orderedMatches, NearestNeighbourStrategy.STRATEGY_NAME);

    // Add distance from origin city to first match
    if (originCity && route.stops.length > 0) {
      const firstStop = route.stops[0];
      const distanceFromOrigin = calculateDistance(
        originCity.latitude,
        originCity.longitude,
        firstStop.city.latitude,
        firstStop.city.longitude
      );
      firstStop.distanceFromPrevious = distanceFromOrigin;
      route.totalDistance += distanceFromOrigin;
    }

    return route;
  }
}
