import { Router } from 'express';
import * as MatchModel from '../models/Match';
import * as CityModel from '../models/City';
import { NearestNeighbourStrategy } from '../strategies/NearestNeighbourStrategy';
import db from '../db/connection';
import { calculate } from '../utils/CostCalculator';
// Tip: You can also import DateOnlyStrategy to compare results
// import { DateOnlyStrategy } from '../strategies/DateOnlyStrategy';

const router = Router();

/**
 * Route Optimisation Routes — YOUR TASKS #3 and #5
 */

// ============================================================
//  POST /api/route/optimise — YOUR TASK #3
// ============================================================
//
// TODO: Implement this endpoint
//
// Request body: { matchIds: ["match-1", "match-5", "match-12", ...], originCityId: "city-atlanta" }
//
// Steps:
//   1. Extract matchIds and originCityId from req.body
//   2. Fetch the full match data: MatchModel.getByIds(matchIds)
//   3. Fetch origin city: CityModel.getById(originCityId)
//   4. Create a strategy instance: new NearestNeighbourStrategy()
//      (or new DateOnlyStrategy() to test with the working example first)
//   5. Call strategy.optimise(matches, originCity)
//   6. Return the optimised route as JSON
//
// TIP: Start by using DateOnlyStrategy to verify your endpoint works,
// then switch to NearestNeighbourStrategy once you've implemented it.
//
// ============================================================

// Get best route
router.post('/optimise', (req, res) => {
  try {
    const { matchIds, originCityId } = req.body;

    // Validation
    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      res.status(400).json({ error: 'matchIds must be a non-empty array' });
      return;
    }

    const matches = MatchModel.getByIds(matchIds);
    const originCity = originCityId ? CityModel.getById(originCityId) : undefined;

    const strategy = new NearestNeighbourStrategy();
    const route = strategy.optimise(matches, originCity);

    res.json(route);
  } catch (error) {
    res.status(500).json({ error: 'Failed to optimise route' });
  }
});

// ============================================================
//  POST /api/route/budget — YOUR TASK #5
// ============================================================
//
// TODO: Implement this endpoint
//
// Request body:
// {
//   "budget": 5000.00,
//   "matchIds": ["match-1", "match-5", "match-12", ...],
//   "originCityId": "city-atlanta"
// }
//
// Steps:
//   1. Extract budget, matchIds, and originCityId from req.body
//   2. Fetch matches by IDs: MatchModel.getByIds(matchIds)
//   3. Fetch origin city: CityModel.getById(originCityId)
//   4. Fetch all flight prices from the database
//   5. Use the CostCalculator to calculate the budget result
//   6. Return the BudgetResult as JSON
//
// Hint: Import and use the CostCalculator from '../utils/CostCalculator'
//
// IMPORTANT CONSTRAINTS:
//   - User MUST attend at least 1 match in each country (USA, Mexico, Canada)
//   - If the budget is insufficient, return feasible=false with:
//     - minimumBudgetRequired: the actual cost
//     - suggestions: ways to reduce cost
//   - If countries are missing, return feasible=false with:
//     - missingCountries: list of countries not covered
//
// ============================================================

// Give cost breakdown and if it meets the budget
router.post('/budget', (req, res) => {
  try {
    const { budget, matchIds, originCityId } = req.body;

    // Validation
    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      res.status(400).json({ error: 'matchIds must be a non-empty array' });
      return;
    }
    if (!budget || typeof budget !== 'number') {
      res.status(400).json({ error: 'budget must be a number' });
      return;
    }

    const matches = MatchModel.getByIds(matchIds);
    const originCity = CityModel.getById(originCityId);

    if (!originCity) {
      res.status(400).json({ error: 'originCityId not found' });
      return;
    }

    const flightPrices = db.prepare('SELECT * FROM flight_prices').all() as any[];

    const result = calculate(matches, budget, originCityId, flightPrices, originCity);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate budget' });
  }
});

// ============================================================
//  POST /api/route/best-value — BONUS CHALLENGE #1
// ============================================================
//
// TODO: Implement this endpoint (BONUS)
//
// Request body:
// {
//   "budget": 5000.00,
//   "originCityId": "city-atlanta"
// }
//
// Steps:
//   1. Extract budget and originCityId from req.body
//   2. Fetch all matches: MatchModel.getAll()
//   3. Fetch origin city: CityModel.getById(originCityId)
//   4. Fetch all flight prices from the database
//   5. Use the BestValueFinder to find the best combination
//   6. Return the BestValueResult as JSON
//
// Hint: Import and use the BestValueFinder from '../bonus/BestValueFinder'
//
// ============================================================

router.post('/best-value', (req, res) => {
  // TODO: Replace with your implementation (BONUS)
  res.status(200).json({});
});

export default router;
