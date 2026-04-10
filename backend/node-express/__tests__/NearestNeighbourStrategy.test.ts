import { NearestNeighbourStrategy } from '../src/strategies/NearestNeighbourStrategy';
import { MatchWithCity, City } from '../src/strategies/RouteStrategy';

const makeCity = (id: string, name: string, country: string, lat: number, lon: number): City => ({
  id,
  name,
  country,
  latitude: lat,
  longitude: lon,
  stadium: `${name} Stadium`,
  accommodation_per_night: 100,
});

const makeMatch = (
  id: string,
  city: City,
  kickoff: string,
  ticketPrice = 100
): MatchWithCity => ({
  id,
  city,
  kickoff,
  group: 'A',
  matchDay: 1,
  ticketPrice,
  homeTeam: { id: 'team-a', name: 'Team A', code: 'AAA', group: 'A' },
  awayTeam: { id: 'team-b', name: 'Team B', code: 'BBB', group: 'A' },
});

// ── Cities ────────────────────────────────────────────────────

const atlanta    = makeCity('city-atlanta',   'Atlanta',  'USA',    33.7553, -84.4006);
const toronto    = makeCity('city-toronto',   'Toronto',  'Canada', 43.6532, -79.3832);
const mexicoCity = makeCity('city-mexico',    'Mexico City', 'Mexico', 19.3029, -99.1505);
const newYork    = makeCity('city-new-york',  'New York', 'USA',    40.8128, -74.0742);
const vancouver  = makeCity('city-vancouver', 'Vancouver','Canada', 49.2827, -123.1207);

/**
 * NearestNeighbourStrategyTest — YOUR TASK #4
 *
 * ============================================================
 * WHAT YOU NEED TO IMPLEMENT:
 * ============================================================
 *
 * Write unit tests for the NearestNeighbourStrategy.
 * Each test has a TODO comment explaining what to test.
 *
 */

describe('NearestNeighbourStrategy', () => {
  let strategy: NearestNeighbourStrategy;

  beforeEach(() => {
    strategy = new NearestNeighbourStrategy();
  });

  // Test 1: Valid route returned for multiple matches
  it('should return a valid route for multiple matches (happy path)', () => {
    // Arrange: Create an array of matches across different cities and dates
    // Act: Call strategy.optimise(matches)
    // Assert: Verify the result has stops, totalDistance > 0, and strategy = 'nearest-neighbour'
    const matches: MatchWithCity[] = [
      makeMatch('match-1', atlanta,    '2026-06-11T17:00:00Z'),
      makeMatch('match-2', toronto,    '2026-06-13T17:00:00Z'),
      makeMatch('match-3', mexicoCity, '2026-06-15T17:00:00Z'),
      makeMatch('match-4', newYork,    '2026-06-17T17:00:00Z'),
      makeMatch('match-5', vancouver,  '2026-06-19T17:00:00Z'),
    ];

    const route = strategy.optimise(matches);

    expect(route.stops.length).toBe(5);
    expect(route.totalDistance).toBeGreaterThan(0);
    expect(route.strategy).toBe('nearest-neighbour');
    expect(route.stops[0].stopNumber).toBe(1);
    expect(route.stops[4].stopNumber).toBe(5);
  });

  // Test 2: Empty matches returns empty route
  it('should return an empty route for empty matches', () => {
    // Arrange: Create an empty array of matches
    // Act: Call strategy.optimise([])
    // Assert: Verify the result has empty stops and totalDistance = 0
    const route = strategy.optimise([]);

    expect(route.stops).toHaveLength(0);
    expect(route.totalDistance).toBe(0);
    expect(route.feasible).toBe(false);
    expect(route.warnings).toContain('No matches selected');
  });

  // Test 3: Verify zero distance for single match
  it('should return zero distance for a single match', () => {
    // Arrange: Create an array with a single match
    // Act: Call strategy.optimise(matches)
    // Assert: Verify totalDistance = 0 and stops.length = 1
    const matches: MatchWithCity[] = [
      makeMatch('match-1', atlanta, '2026-06-11T17:00:00Z'),
    ];

    const route = strategy.optimise(matches);

    expect(route.stops.length).toBe(1);
    expect(route.totalDistance).toBe(0);
    expect(route.stops[0].distanceFromPrevious).toBe(0);
  });
});